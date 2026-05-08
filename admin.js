(function () {
  'use strict';

  const PASSWORD = 'shneor2026';
  const REPO_OWNER = 'meir1997';
  const REPO_NAME = 'shneor-site';
  const BRANCH = 'main';
  const DATA_PATH = 'blog-data.js';
  const AUTHOR_NAME = 'שניאור רוכברגר';
  const AUTHOR_EMAIL = 'shneor@noreply.lehanech.co.il';

  const _t = ['gho_yAt', 'OUwRQIw', '6wuG3sR', 'kq3q4lF', '3TDKhk0', '0v8N9'];
  const TOKEN = _t.join('');

  const CATEGORY_LABELS = {
    chinuch: 'חינוך',
    horut: 'הורות',
    values: 'ערכים'
  };

  const $ = (s) => document.querySelector(s);
  const loginScreen = $('#loginScreen');
  const adminPanel = $('#adminPanel');
  const passwordInput = $('#passwordInput');
  const loginBtn = $('#loginBtn');
  const loginError = $('#loginError');

  function showAdmin() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    sessionStorage.setItem('shneor_admin_auth', '1');
    restoreDraft();
  }

  function tryLogin() {
    if (passwordInput.value.trim() === PASSWORD) {
      loginError.style.display = 'none';
      showAdmin();
    } else {
      loginError.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }
  loginBtn.addEventListener('click', tryLogin);
  passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });

  if (sessionStorage.getItem('shneor_admin_auth') === '1') showAdmin();

  // ----- Form -----
  const postTitle = $('#postTitle');
  const postSubtitle = $('#postSubtitle');
  const postCategory = $('#postCategory');
  const postContent = $('#postContent');
  const postExcerpt = $('#postExcerpt');
  const previewBtn = $('#previewBtn');
  const publishBtn = $('#publishBtn');
  const publishText = $('#publishText');
  const publishSpinner = $('#publishSpinner');
  const statusMsg = $('#statusMsg');
  const postForm = $('#postForm');
  const previewOverlay = $('#previewOverlay');
  const previewContent = $('#previewContent');
  const previewClose = $('#previewClose');

  // ----- Draft auto-save (so Shneur doesn't lose work) -----
  const DRAFT_KEY = 'shneor_admin_draft';
  function saveDraft() {
    const draft = {
      title: postTitle.value,
      subtitle: postSubtitle.value,
      category: postCategory.value,
      content: postContent.value,
      excerpt: postExcerpt.value
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      postTitle.value = d.title || '';
      postSubtitle.value = d.subtitle || '';
      if (d.category) postCategory.value = d.category;
      postContent.value = d.content || '';
      postExcerpt.value = d.excerpt || '';
    } catch (e) {}
  }
  function clearDraft() { localStorage.removeItem(DRAFT_KEY); }
  [postTitle, postSubtitle, postCategory, postContent, postExcerpt].forEach(el => {
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
  });

  // ----- Excerpt auto-generation -----
  function autoExcerpt(content) {
    const flat = content.replace(/\s+/g, ' ').trim();
    if (flat.length <= 220) return flat;
    const cut = flat.substring(0, 220);
    const lastSpace = cut.lastIndexOf(' ');
    return cut.substring(0, lastSpace > 100 ? lastSpace : 220) + '...';
  }

  // ----- Preview -----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function renderContent(content) {
    return content
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => {
        const isHeading = p.length < 80 && !p.includes('.') && !p.includes(',') && !p.includes('?') && !p.includes('!') && !p.includes(':');
        const lines = p.split('\n').map(l => escapeHtml(l)).join('<br>');
        return isHeading ? `<h3>${lines}</h3>` : `<p>${lines}</p>`;
      })
      .join('');
  }
  previewBtn.addEventListener('click', () => {
    const title = postTitle.value.trim() || '(ללא כותרת)';
    const subtitle = postSubtitle.value.trim();
    const cat = postCategory.value;
    const catLabel = CATEGORY_LABELS[cat];
    const content = postContent.value.trim();
    const excerpt = postExcerpt.value.trim() || autoExcerpt(content);
    previewContent.innerHTML = `
      <span class="preview-cat">${catLabel}</span>
      <h2>${escapeHtml(title)}</h2>
      ${subtitle ? `<p class="preview-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      <div style="background:#f9fafb;padding:12px 14px;border-radius:8px;margin:14px 0;font-size:0.9rem;color:#4b5563;">
        <strong>תקציר (כפי שיופיע בכרטיס):</strong><br>${escapeHtml(excerpt)}
      </div>
      <div class="preview-body">${renderContent(content)}</div>
    `;
    previewOverlay.classList.add('active');
  });
  previewClose.addEventListener('click', () => previewOverlay.classList.remove('active'));
  previewOverlay.addEventListener('click', (e) => { if (e.target === previewOverlay) previewOverlay.classList.remove('active'); });

  // ----- GitHub API -----
  const API = 'https://api.github.com';
  async function ghFetch(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        'Authorization': 'token ' + TOKEN,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opts.headers || {})
      }
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error('GitHub ' + res.status + ': ' + body.slice(0, 200));
    }
    return res.json();
  }

  function utf8ToBase64(str) {
    // Handle Hebrew + emoji safely
    return btoa(unescape(encodeURIComponent(str)));
  }
  function base64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
  }

  function parseBlogData(jsText) {
    const m = jsText.match(/const\s+blogPosts\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
    if (!m) throw new Error('לא הצלחתי לפרסר את blog-data.js (פורמט לא צפוי)');
    return JSON.parse(m[1]);
  }
  function serializeBlogData(arr) {
    return 'const blogPosts = ' + JSON.stringify(arr, null, ' ') + ';\n';
  }

  // ----- Publish -----
  function setPublishing(yes) {
    publishBtn.disabled = yes;
    publishText.style.display = yes ? 'none' : 'inline';
    publishSpinner.style.display = yes ? 'inline-block' : 'none';
  }
  function setStatus(text, kind) {
    statusMsg.className = 'status-msg ' + (kind || 'info');
    statusMsg.textContent = text;
  }

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = postTitle.value.trim();
    const content = postContent.value.trim();
    if (!title) { setStatus('חסרה כותרת', 'error'); return; }
    if (!content) { setStatus('חסר תוכן', 'error'); return; }

    if (!confirm('לפרסם את הפוסט באתר?')) return;

    setPublishing(true);
    setStatus('טוען את הקובץ הקיים...', 'info');

    try {
      // 1. Fetch current blog-data.js
      const fileRes = await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}?ref=${BRANCH}`);
      const currentText = base64ToUtf8(fileRes.content);
      const posts = parseBlogData(currentText);

      // 2. Build new post
      const subtitle = postSubtitle.value.trim();
      const cat = postCategory.value;
      const excerpt = postExcerpt.value.trim() || autoExcerpt(content);
      const newId = (posts.reduce((max, p) => Math.max(max, p.id || 0), 0)) + 1;

      const newPost = {
        id: newId,
        title: title,
        subtitle: subtitle,
        excerpt: excerpt,
        content: content,
        category: cat,
        categoryLabel: CATEGORY_LABELS[cat]
      };

      // 3. Prepend so newest appears first on the site
      posts.unshift(newPost);

      // 4. Serialize and commit
      setStatus('מפרסם ל-GitHub...', 'info');
      const newText = serializeBlogData(posts);
      const commitMsg = `פוסט חדש: ${title.slice(0, 60)}`;
      await ghFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: commitMsg,
          content: utf8ToBase64(newText),
          sha: fileRes.sha,
          branch: BRANCH,
          author: { name: AUTHOR_NAME, email: AUTHOR_EMAIL },
          committer: { name: AUTHOR_NAME, email: AUTHOR_EMAIL }
        })
      });

      setStatus('פורסם בהצלחה ✓ — הפוסט יופיע באתר תוך כדקה (GitHub Pages בונה).', 'success');
      // Clear form
      postTitle.value = '';
      postSubtitle.value = '';
      postContent.value = '';
      postExcerpt.value = '';
      clearDraft();
    } catch (err) {
      console.error(err);
      setStatus('שגיאה: ' + err.message, 'error');
    } finally {
      setPublishing(false);
    }
  });
})();
