// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Navbar shadow on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 20) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
        const top = section.offsetTop - 100;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
            navItems.forEach(a => {
                a.classList.remove('active');
                if (a.getAttribute('href') === '#' + id) a.classList.add('active');
            });
        }
    });
});

// Blog rendering
const POSTS_PER_PAGE = 9;
let visiblePosts = POSTS_PER_PAGE;
let currentFilter = 'all';
let currentSearch = '';
const blogGrid = document.getElementById('blogGrid');
const loadMoreBtn = document.getElementById('loadMore');
const searchInput = document.getElementById('blogSearch');
const resultsCount = document.getElementById('resultsCount');

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getFiltered() {
    let list = currentFilter === 'all'
        ? blogPosts
        : blogPosts.filter(p => p.category === currentFilter);
    if (currentSearch) {
        const q = currentSearch.toLowerCase();
        list = list.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.subtitle || '').toLowerCase().includes(q) ||
            p.excerpt.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q)
        );
    }
    return list;
}

function renderBlog() {
    const filtered = getFiltered();
    const toShow = filtered.slice(0, visiblePosts);

    if (resultsCount) {
        resultsCount.textContent = filtered.length === 1
            ? 'מאמר אחד'
            : `${filtered.length} מאמרים`;
    }

    if (toShow.length === 0) {
        blogGrid.innerHTML = `
            <div class="blog-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <p>לא נמצאו מאמרים</p>
                <span>נסו חיפוש אחר או בחרו קטגוריה אחרת</span>
            </div>
        `;
        loadMoreBtn.style.display = 'none';
        return;
    }

    blogGrid.innerHTML = toShow.map((post, idx) => {
        const illus = (typeof blogIllustrations !== 'undefined' && blogIllustrations[post.id])
            ? `<div class="blog-card-illustration">${blogIllustrations[post.id]}</div>`
            : '';
        return `
        <article class="blog-card${illus ? ' has-illustration' : ''}" onclick="openBlogModal(${post.id})" style="animation-delay:${idx * 30}ms">
            ${illus}
            <div class="blog-card-header">
                <span class="blog-card-category cat-${post.category}">${post.categoryLabel}</span>
                <h3>${escapeHtml(post.title)}</h3>
                ${post.subtitle ? `<p class="blog-card-subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
            </div>
            <div class="blog-card-body">
                <p>${escapeHtml(post.excerpt)}</p>
            </div>
            <div class="blog-card-footer">
                <span class="read-more">קראו עוד <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></span>
            </div>
        </article>`;
    }).join('');

    loadMoreBtn.style.display = visiblePosts >= filtered.length ? 'none' : 'inline-flex';
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        visiblePosts = POSTS_PER_PAGE;
        renderBlog();
    });
});

loadMoreBtn.addEventListener('click', () => {
    visiblePosts += POSTS_PER_PAGE;
    renderBlog();
});

// Search with debounce
let searchTimeout;
if (searchInput) {
    searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value.trim();
            visiblePosts = POSTS_PER_PAGE;
            renderBlog();
        }, 200);
    });
}

// Blog Modal
function openBlogModal(id) {
    const post = blogPosts.find(p => p.id === id);
    if (!post) return;

    let modal = document.getElementById('blogModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'blogModal';
        modal.className = 'blog-modal';
        document.body.appendChild(modal);
    }

    const paragraphs = post.content
        .split('\n\n')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
            // Detect a heading-like short line (no period at end, short)
            const isHeading = p.length < 80 && !p.includes('.') && !p.includes(',') && !p.includes('?') && !p.includes('!') && !p.includes(':');
            const lines = p.split('\n').map(l => escapeHtml(l)).join('<br>');
            return isHeading
                ? `<h3 class="blog-section-heading">${lines}</h3>`
                : `<p>${lines}</p>`;
        })
        .join('');

    const modalIllus = (typeof blogIllustrations !== 'undefined' && blogIllustrations[post.id])
        ? `<div class="blog-modal-illustration">${blogIllustrations[post.id]}</div>`
        : '';

    modal.innerHTML = `
        <div class="blog-modal-content">
            <button class="blog-modal-close" onclick="closeBlogModal()" aria-label="סגור">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            ${modalIllus}
            <div class="blog-modal-meta">
                <span class="blog-card-category cat-${post.category}">${post.categoryLabel}</span>
            </div>
            <h2>${escapeHtml(post.title)}</h2>
            ${post.subtitle ? `<p class="blog-modal-subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
            <div class="blog-divider"></div>
            <div class="blog-full-text">${paragraphs}</div>
            <div class="blog-modal-author">
                <div class="author-avatar">ש</div>
                <div>
                    <div class="author-name">שניאור רוכברגר</div>
                    <div class="author-role">מחנך וחוקר</div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeBlogModal();
    });
}

function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBlogModal();
});

// Smooth reveal on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.section').forEach(section => {
    section.classList.add('reveal');
    observer.observe(section);
});

// Gallery toggle
let galleryExpanded = false;
function toggleGallery() {
    galleryExpanded = !galleryExpanded;
    const allItems = document.querySelectorAll('.gallery-item');
    const btn = document.getElementById('galleryToggle');

    allItems.forEach((el, i) => {
        if (i >= 6) {
            if (galleryExpanded) {
                el.style.display = 'block';
                el.style.animation = `fadeInUp 0.4s ease ${(i - 6) * 35}ms backwards`;
            } else {
                el.style.display = 'none';
                el.style.animation = '';
            }
        }
    });

    if (galleryExpanded) {
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg> הסתר תמונות`;
    } else {
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> לכל התמונות`;
        document.getElementById('social')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

// Gallery lightbox – use event delegation so it works for dynamically shown images
let lightboxIndex = 0;
const galleryImages = [];

function initGalleryLightbox() {
    // Collect all image srcs
    document.querySelectorAll('.gallery-item img').forEach(img => galleryImages.push(img.src));

    // Event delegation on the grid container
    const grid = document.getElementById('galleryGrid');
    if (grid) {
        grid.addEventListener('click', e => {
            const item = e.target.closest('.gallery-item');
            if (!item) return;
            const items = Array.from(document.querySelectorAll('.gallery-item'));
            openLightbox(items.indexOf(item));
        });
    }
}

function openLightbox(idx) {
    lightboxIndex = idx;
    let lb = document.getElementById('galleryLightbox');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'galleryLightbox';
        lb.className = 'gallery-lightbox';
        lb.innerHTML = `
            <div class="lightbox-inner">
                <img id="lightboxImg" src="" alt="תמונה">
            </div>
            <button class="lightbox-close" onclick="closeLightbox()" aria-label="סגור">✕</button>
            <button class="lightbox-nav lightbox-prev" onclick="lightboxNav(-1)" aria-label="הבא">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="lightbox-nav lightbox-next" onclick="lightboxNav(1)" aria-label="הקודם">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="lightbox-counter" id="lightboxCounter"></div>
        `;
        document.body.appendChild(lb);
        lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    }
    updateLightbox();
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateLightbox() {
    const img = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    if (img) img.src = galleryImages[lightboxIndex];
    if (counter) counter.textContent = `${lightboxIndex + 1} / ${galleryImages.length}`;
}

function lightboxNav(dir) {
    lightboxIndex = (lightboxIndex + dir + galleryImages.length) % galleryImages.length;
    updateLightbox();
}

function closeLightbox() {
    const lb = document.getElementById('galleryLightbox');
    if (lb) { lb.classList.remove('active'); document.body.style.overflow = ''; }
}

document.addEventListener('keydown', e => {
    if (document.getElementById('galleryLightbox')?.classList.contains('active')) {
        if (e.key === 'ArrowRight') lightboxNav(-1);
        if (e.key === 'ArrowLeft') lightboxNav(1);
        if (e.key === 'Escape') closeLightbox();
    }
});

// Contact form – sends email via Web3Forms API
async function submitContactForm(e) {
    e.preventDefault();
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    const btn = form.querySelector('.form-submit');

    const name    = document.getElementById('contactName').value.trim();
    const phone   = document.getElementById('contactPhone').value.trim();
    const email   = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject');
    const subjectText = subject.options[subject.selectedIndex].text;
    const message = document.getElementById('contactMessage').value.trim();

    btn.disabled = true;
    btn.style.opacity = '0.7';

    const payload = {
        access_key: 'WEB3FORMS_ACCESS_KEY',
        subject: 'פנייה חדשה מהאתר – ' + (subjectText !== 'בחר נושא...' ? subjectText : 'כללי'),
        from_name: name,
        replyto: email || undefined,
        message: [
            'שם: ' + name,
            phone   ? 'טלפון: ' + phone   : '',
            email   ? 'אימייל: ' + email   : '',
            'נושא: ' + (subjectText !== 'בחר נושא...' ? subjectText : 'כללי'),
            '',
            message
        ].filter(Boolean).join('\n')
    };

    try {
        const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            btn.style.display = 'none';
            success.style.display = 'flex';
            form.reset();
            setTimeout(() => {
                btn.style.display = 'flex';
                btn.disabled = false;
                btn.style.opacity = '';
                success.style.display = 'none';
            }, 5000);
        } else {
            throw new Error(data.message || 'שגיאה');
        }
    } catch (err) {
        console.error('Form error:', err);
        // Fallback to WhatsApp if email fails
        const waText = encodeURIComponent(
            `שלום שניאור, שמי ${name}${phone ? ', מספרי ' + phone : ''}.\n` +
            `נושא: ${subjectText !== 'בחר נושא...' ? subjectText : 'פנייה כללית'}\n\n${message}`
        );
        window.open(`https://wa.me/972543407902?text=${waText}`, '_blank');
        btn.disabled = false;
        btn.style.opacity = '';
    }
}

// Init
renderBlog();
initGalleryLightbox();

// Update stats on home with real count
const blogCountEl = document.getElementById('blogCount');
if (blogCountEl) blogCountEl.textContent = blogPosts.length + '+';
