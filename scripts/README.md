# Blog auto-sync from Google Drive

`sync-blog-from-drive.py` watches a Google Drive folder for new/updated docs.
Every file is scanned for one or more posts (separated by a `שניאור` signature),
each post is added to `blog-data.js`, and a separate commit is pushed.

## One-time setup

The script needs Drive read access. Pick **one**:

1. **gcloud (simplest)** — re-auth with Drive scope:
   ```sh
   gcloud auth application-default login \
     --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive.readonly
   ```
   The script will pick up the credentials automatically.

2. **Service account** — set `GOOGLE_APPLICATION_CREDENTIALS` to a JSON path.
   Share the Drive folder with the service account's email.

3. **Manual token** — for one-off runs, set `DRIVE_OAUTH_TOKEN` to an access
   token with `drive.readonly` scope.

The folder ID is configured via `DRIVE_FOLDER_ID` (defaults to the folder set
at the top of the script).

## Launchd schedule

`~/Library/LaunchAgents/com.shneor.blog-sync.plist` runs the script every 24h.
Logs go to `~/Library/Logs/shneor-blog-sync.log`.

Control it with:
```sh
launchctl bootout gui/$(id -u)/com.shneor.blog-sync     # stop
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.shneor.blog-sync.plist  # start
launchctl kickstart gui/$(id -u)/com.shneor.blog-sync   # run now
```

## How it splits multi-post documents

A file may contain N posts. The script splits on the `שניאור` signature line.
For each chunk it expects:
- `**Title**` (first bold line at the top)
- Optional subtitle (next `**…**` line, or first plain paragraph before
  "הורים יקרים,")
- Body, ending with "בהצלחה!" + `שניאור` (consumed by the splitter)

Category is auto-detected from keywords (חינוך / הורות / ערכים).
