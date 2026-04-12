// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
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
let visiblePosts = 6;
let currentFilter = 'all';
const blogGrid = document.getElementById('blogGrid');
const loadMoreBtn = document.getElementById('loadMore');

function renderBlog() {
    const filtered = currentFilter === 'all'
        ? blogPosts
        : blogPosts.filter(p => p.category === currentFilter);
    const toShow = filtered.slice(0, visiblePosts);

    blogGrid.innerHTML = toShow.map(post => `
        <div class="blog-card" onclick="openBlogModal(${post.id})">
            <div class="blog-card-header">
                <span class="blog-card-category">${post.categoryLabel}</span>
                <h3>${post.title}</h3>
            </div>
            <div class="blog-card-body">
                <p>${post.excerpt}</p>
            </div>
            <div class="blog-card-footer">
                <span class="read-more">קראו עוד &larr;</span>
            </div>
        </div>
    `).join('');

    loadMoreBtn.style.display = visiblePosts >= filtered.length ? 'none' : 'block';
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        visiblePosts = 6;
        renderBlog();
    });
});

loadMoreBtn.addEventListener('click', () => {
    visiblePosts += 6;
    renderBlog();
});

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

    modal.innerHTML = `
        <div class="blog-modal-content">
            <button class="blog-modal-close" onclick="closeBlogModal()">&times;</button>
            <span class="blog-card-category" style="margin-bottom:16px;display:inline-block">${post.categoryLabel}</span>
            <h2>${post.title}</h2>
            <div class="blog-full-text">${post.content.split('\n\n').map(p => '<p>' + p + '</p>').join('')}</div>
            <p style="margin-top:24px;font-weight:600;color:var(--primary)">שניאור</p>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

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
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Init
renderBlog();
