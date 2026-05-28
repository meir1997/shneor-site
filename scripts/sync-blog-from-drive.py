#!/usr/bin/env python3
"""
sync-blog-from-drive.py
=======================
Syncs new blog posts from a Google Drive folder into blog-data.js.

For each file in the folder (by default the one whose ID is in DRIVE_FOLDER_ID):
- Detect whether it's been processed already (by file ID -> seen list).
- Read its text content via the Drive REST API.
- Split into individual posts (separator: blank line + bold title).
- For each post, generate a new blog-data.js entry and append to the file.
- Commit each new post separately and push.

Auth: needs a Google service-account JSON or OAuth client credentials with
Drive readonly scope. The script does NOT include credentials; configure via
the GOOGLE_APPLICATION_CREDENTIALS env var, or set DRIVE_OAUTH_TOKEN.

Schedule: run from launchd (macOS) or cron every 24 hours.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ---- Configuration -----------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
BLOG_DATA_PATH = REPO_ROOT / "blog-data.js"
SEEN_PATH = REPO_ROOT / "scripts" / ".blog-sync-seen.json"
DRIVE_FOLDER_ID = os.environ.get("DRIVE_FOLDER_ID", "12oq0aLzWRqSSx1jETrUfwvQL1AZyheE4")

# ---- Drive REST API helpers --------------------------------------------------

def get_access_token() -> str:
    """Return an OAuth access token. Tries (1) DRIVE_OAUTH_TOKEN env var,
    (2) gcloud auth print-access-token, (3) service account JWT flow."""
    tok = os.environ.get("DRIVE_OAUTH_TOKEN")
    if tok:
        return tok
    try:
        out = subprocess.run(
            ["gcloud", "auth", "print-access-token"],
            check=True, capture_output=True, text=True,
        )
        return out.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    sa_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if sa_path and Path(sa_path).exists():
        return _service_account_token(sa_path)
    raise RuntimeError(
        "No Drive credentials. Set DRIVE_OAUTH_TOKEN, run "
        "'gcloud auth login', or set GOOGLE_APPLICATION_CREDENTIALS."
    )


def _service_account_token(sa_path: str) -> str:
    import base64, time, hmac, hashlib
    with open(sa_path) as f:
        sa = json.load(f)
    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT"}
    claim = {
        "iss": sa["client_email"],
        "scope": "https://www.googleapis.com/auth/drive.readonly",
        "aud": "https://oauth2.googleapis.com/token",
        "exp": now + 3600,
        "iat": now,
    }
    def b64(d): return base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=")
    head_b64 = b64(header)
    claim_b64 = b64(claim)
    signing_input = head_b64 + b"." + claim_b64
    # Sign with RSA private key via cryptography lib
    try:
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.primitives import hashes
    except ImportError:
        raise RuntimeError("pip install cryptography to use service-account auth")
    key = load_pem_private_key(sa["private_key"].encode(), password=None)
    sig = key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    jwt = signing_input + b"." + base64.urlsafe_b64encode(sig).rstrip(b"=")
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=f"grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion={jwt.decode()}".encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())["access_token"]


def drive_api(path: str, token: str, params: dict | None = None) -> dict:
    url = f"https://www.googleapis.com/drive/v3{path}"
    if params:
        from urllib.parse import urlencode
        url += "?" + urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def drive_list_files(folder_id: str, token: str) -> list[dict]:
    return drive_api("/files", token, {
        "q": f"'{folder_id}' in parents and trashed = false",
        "fields": "files(id,name,modifiedTime,mimeType)",
        "pageSize": "100",
    }).get("files", [])


def drive_export_text(file_id: str, mime: str, token: str) -> str:
    if mime == "application/vnd.google-apps.document":
        url = f"https://www.googleapis.com/drive/v3/files/{file_id}/export?mimeType=text/plain"
    else:
        url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8", errors="replace")


# ---- Post extraction & blog-data.js update -----------------------------------

def split_posts(text: str) -> list[dict]:
    """Split a doc that may contain multiple posts into individual posts.

    Heuristic:
    - Posts are separated by lines that contain only 'שניאור' (sometimes with
      RLM unicode marks) followed by blank lines, optionally a 'ב״ה' marker.
    - Each post starts with a bold-wrapped title (**Title**) at the top.
    """
    # Normalize: collapse 3+ blank lines, strip RTL/RLM marks from signature lines
    text = re.sub(r"‏|‎|‫|‬", "", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Split on signature: line with just "שניאור" (whitespace allowed)
    chunks = re.split(r"\n\s*שניאור\s*\n", text)
    # First chunk has all content for first post; last "tail" after final
    # signature is the trailing whitespace + possibly an empty post.
    posts = []
    for raw in chunks:
        raw = raw.strip()
        if not raw or "**" not in raw:
            continue
        post = _parse_post(raw)
        if post:
            posts.append(post)
    return posts


def _parse_post(raw: str) -> dict | None:
    # Strip leading "ב״ה" line
    raw = re.sub(r"^\s*ב״ה\s*\n+", "", raw)

    # First bold-wrapped line is the title
    m = re.search(r"\*\*(.+?)\*\*", raw)
    if not m:
        return None
    title = m.group(1).strip()
    # Subtitle is either: (1) the next **bold** line, or (2) the first
    # non-empty paragraph after the title that isn't the "הורים יקרים" greeting.
    after_title = raw[m.end():].lstrip("\n").strip()
    subtitle = ""
    body_start = 0
    sub_match = re.match(r"\*\*(.+?)\*\*\s*\n", after_title, re.DOTALL)
    if sub_match:
        subtitle = sub_match.group(1).strip()
        body_start = sub_match.end()
    else:
        # Take first paragraph (until blank line) as subtitle if it's not the greeting
        first_para_match = re.match(r"(.+?)(?:\n\s*\n|\n\s*הורים יקרים)", after_title, re.DOTALL)
        if first_para_match:
            candidate = first_para_match.group(1).strip()
            if candidate and "הורים יקרים" not in candidate and len(candidate) < 400:
                subtitle = candidate
                body_start = first_para_match.end(1)
    body = after_title[body_start:].strip()
    # Remove section heading bold markers but keep titles in the body
    body = _normalize_body(body)
    # Compute excerpt: first ~200 chars of body, no line breaks
    excerpt = " ".join(body.split())[:240].rstrip()
    if len(" ".join(body.split())) > 240:
        excerpt = excerpt.rsplit(" ", 1)[0] + "..."
    return {
        "title": title,
        "subtitle": subtitle,
        "excerpt": excerpt,
        "content": body,
    }


def _normalize_body(body: str) -> str:
    # Drop "בהצלחה!" / "בהצלחה" trailing line
    body = re.sub(r"\n+\s*בהצלחה!?\s*$", "", body)
    # Convert "**Heading**" lines to plain headings (the blog renderer treats short
    # lines without punctuation as section headings already)
    body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
    # Collapse 3+ newlines to 2
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip()


def categorize(title: str, body: str) -> tuple[str, str]:
    """Rough keyword-based categorization."""
    text = title + " " + body
    horut_kw = ["הורים", "ילדים שלכם", "ילדינו", "אבא", "אמא", "משפחה", "אבחון", "הפרעת קשב", "התבגרות", "אכילה"]
    values_kw = ["תורה", "חסד", "אמונה", "ערכים", "השם", "תפילה", "חג", "שבת", "שמחה", "אלוקים"]
    chinuch_kw = ["מורה", "כיתה", "מוסד", "בית ספר", "ישיבה", "תלמיד", "חינוך", "מחנך", "אלימות"]
    scores = {
        "horut":   sum(text.count(k) for k in horut_kw),
        "values":  sum(text.count(k) for k in values_kw),
        "chinuch": sum(text.count(k) for k in chinuch_kw),
    }
    cat = max(scores, key=scores.get)
    labels = {"horut": "הורות", "values": "ערכים", "chinuch": "חינוך"}
    return cat, labels[cat]


def load_blog_data() -> tuple[list[dict], str]:
    raw = BLOG_DATA_PATH.read_text(encoding="utf-8")
    # Extract the JSON array between `const blogPosts = ` and final `];`
    m = re.search(r"const\s+blogPosts\s*=\s*(\[[\s\S]+?\n\]\s*);", raw)
    if not m:
        raise RuntimeError("Could not parse blog-data.js")
    return json.loads(m.group(1)), raw


def save_blog_data(posts: list[dict]) -> None:
    body = "const blogPosts = " + json.dumps(posts, ensure_ascii=False, indent=1) + ";\n"
    BLOG_DATA_PATH.write_text(body, encoding="utf-8")


def load_seen() -> dict:
    if SEEN_PATH.exists():
        return json.loads(SEEN_PATH.read_text())
    return {}


def save_seen(seen: dict) -> None:
    SEEN_PATH.write_text(json.dumps(seen, ensure_ascii=False, indent=2))


HEB_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
              "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"]


def _format_he(d: datetime) -> str:
    return f"{d.day} ב{HEB_MONTHS[d.month - 1]} {d.year}"


def append_post(posts: list[dict], parsed: dict) -> dict:
    next_id = max((p["id"] for p in posts), default=0) + 1
    category, label = categorize(parsed["title"], parsed["content"])
    today = datetime.now(timezone.utc)
    entry = {
        "id": next_id,
        "title": parsed["title"],
        "subtitle": parsed["subtitle"] or "הורים יקרים,",
        "excerpt": parsed["excerpt"],
        "content": parsed["content"],
        "category": category,
        "categoryLabel": label,
        "date": today.strftime("%Y-%m-%d"),
        "dateHe": _format_he(today),
    }
    posts.append(entry)
    return entry


def git_commit_and_push(message: str) -> None:
    subprocess.run(["git", "-C", str(REPO_ROOT), "add", "blog-data.js", "scripts/.blog-sync-seen.json"], check=True)
    if subprocess.run(["git", "-C", str(REPO_ROOT), "diff", "--cached", "--quiet"]).returncode == 0:
        return
    subprocess.run(["git", "-C", str(REPO_ROOT), "commit", "-m", message], check=True)
    subprocess.run(["git", "-C", str(REPO_ROOT), "push", "origin", "main"], check=True)


# ---- Main --------------------------------------------------------------------

def main() -> int:
    seen = load_seen()
    posts, _ = load_blog_data()

    try:
        token = get_access_token()
    except RuntimeError as e:
        print(f"Auth error: {e}", file=sys.stderr)
        return 2

    files = drive_list_files(DRIVE_FOLDER_ID, token)
    print(f"Found {len(files)} file(s) in folder.")

    new_count = 0
    for f in files:
        prev = seen.get(f["id"])
        if prev and prev.get("modifiedTime") == f["modifiedTime"]:
            print(f"Skip {f['name']}: unchanged.")
            continue

        print(f"Process {f['name']} ({f['mimeType']})")
        try:
            text = drive_export_text(f["id"], f["mimeType"], token)
        except Exception as e:
            print(f"  ! download failed: {e}", file=sys.stderr)
            continue

        parsed_posts = split_posts(text)
        print(f"  Found {len(parsed_posts)} post(s) in document.")

        existing_titles = {p["title"] for p in posts}
        for parsed in parsed_posts:
            if parsed["title"] in existing_titles:
                print(f"  Skip: '{parsed['title']}' already in blog.")
                continue
            entry = append_post(posts, parsed)
            save_blog_data(posts)
            seen[f["id"]] = {"modifiedTime": f["modifiedTime"], "name": f["name"]}
            save_seen(seen)
            git_commit_and_push(
                f"הוספת טור חדש: {entry['title']}\n\n"
                f"מתוך {f['name']} ב-Google Drive\n\n"
                f"Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
            )
            new_count += 1

        seen[f["id"]] = {"modifiedTime": f["modifiedTime"], "name": f["name"], "lastChecked": datetime.now(timezone.utc).isoformat()}
        save_seen(seen)

    print(f"Done. {new_count} new post(s) added.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
