// Demo posts data for offline/demo mode
const DEMO_POSTS = [
  { id: '1', title: 'How AI is Transforming Content Marketing', status: 'published', platforms: ['wordpress'], createdAt: '2024-01-15T10:00:00Z', publishedAt: '2024-01-15T12:00:00Z' },
  { id: '2', title: '10 Best SEO Practices for 2024', status: 'draft', platforms: [], createdAt: '2024-01-16T09:00:00Z' },
  { id: '3', title: 'WordPress Auto-Posting Guide', status: 'scheduled', platforms: ['wordpress', 'facebook'], createdAt: '2024-01-17T08:00:00Z', scheduledAt: '2024-01-20T10:00:00Z' },
];

let allPosts = [];

function initDashboard() {
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  const usernameEl = document.getElementById('sidebar-username');
  if (usernameEl) usernameEl.textContent = user.name || 'User';

  const settingsName = document.getElementById('settings-name');
  const settingsEmail = document.getElementById('settings-email');
  if (settingsName) settingsName.value = user.name || '';
  if (settingsEmail) settingsEmail.value = user.email || '';

  loadDashboard();
  loadTemplates();
  loadToolsPage();

  window.onPageChange = (page) => {
    if (page === 'posts') loadAllPosts();
    if (page === 'wordpress') loadWordPressSites();
    if (page === 'settings') loadSubscriptionInfo();
  };

  setupNewPostForm();
  setupWordPressForm();
}

async function loadDashboard() {
  await loadPosts();
  updateStats();
}

async function loadPosts() {
  const isDemoMode = localStorage.getItem('auth_token') === 'demo-token';
  if (isDemoMode) {
    allPosts = DEMO_POSTS;
    renderRecentPosts(allPosts.slice(0, 5));
    updateStats();
    return;
  }

  try {
    const data = await window.api.get('/posts?limit=5');
    allPosts = data.data || [];
    renderRecentPosts(allPosts);
    updateStats();
  } catch (err) {
    console.warn('Using demo data:', err.message);
    allPosts = DEMO_POSTS;
    renderRecentPosts(allPosts.slice(0, 5));
    updateStats();
  }
}

function updateStats() {
  const total = allPosts.length;
  const scheduled = allPosts.filter(p => p.status === 'scheduled').length;

  const statTotal = document.getElementById('stat-total-posts');
  const statSched = document.getElementById('stat-scheduled');

  if (statTotal) statTotal.textContent = total;
  if (statSched) statSched.textContent = scheduled;
}

function renderRecentPosts(posts) {
  const tbody = document.getElementById('recent-posts-tbody');
  if (!tbody) return;

  if (!posts.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No posts yet. Create your first post!</td></tr>';
    return;
  }

  tbody.innerHTML = posts.map(post => `
    <tr>
      <td><strong>${escapeHtml(post.title)}</strong></td>
      <td><span class="status-badge status-${post.status}">${post.status}</span></td>
      <td>${formatDate(post.createdAt)}</td>
      <td>
        <button class="btn-text btn-sm" onclick="editPost('${post.id}')">Edit</button>
        <button class="btn-text btn-sm" style="color:var(--md-error)" onclick="deletePost('${post.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadAllPosts() {
  const tbody = document.getElementById('all-posts-tbody');
  if (!tbody) return;

  const isDemoMode = localStorage.getItem('auth_token') === 'demo-token';

  if (isDemoMode) {
    renderAllPostsTable(DEMO_POSTS, tbody);
    return;
  }

  tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading...</td></tr>';

  try {
    const data = await window.api.get('/posts');
    renderAllPostsTable(data.data || [], tbody);
  } catch (err) {
    renderAllPostsTable(DEMO_POSTS, tbody);
  }
}

function renderAllPostsTable(posts, tbody) {
  if (!posts.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No posts yet.</td></tr>';
    return;
  }

  tbody.innerHTML = posts.map(post => `
    <tr>
      <td><strong>${escapeHtml(post.title)}</strong></td>
      <td><span class="status-badge status-${post.status}">${post.status}</span></td>
      <td>${(post.platforms || []).map(p => `<span class="badge badge-cat">${p}</span>`).join(' ')}</td>
      <td>${formatDate(post.createdAt)}</td>
      <td>
        <button class="btn-text btn-sm" onclick="editPost('${post.id}')">Edit</button>
        <button class="btn-text btn-sm" style="color:var(--md-error)" onclick="deletePost('${post.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function setupNewPostForm() {
  const form = document.getElementById('new-post-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const status = document.getElementById('post-status').value;

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const isDemoMode = localStorage.getItem('auth_token') === 'demo-token';
    if (isDemoMode) {
      const newPost = { id: Date.now().toString(), title, content, status, platforms: [], createdAt: new Date().toISOString() };
      DEMO_POSTS.unshift(newPost);
      allPosts = DEMO_POSTS;
      closeModal('new-post-modal');
      loadDashboard();
      showToast('Post saved (demo mode)', 'success');
      form.reset();
      btn.textContent = 'Save Post';
      btn.disabled = false;
      return;
    }

    try {
      await window.api.post('/posts', { title, content, status });
      closeModal('new-post-modal');
      await loadDashboard();
      showToast('Post saved!', 'success');
      form.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = 'Save Post';
      btn.disabled = false;
    }
  });
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;

  const isDemoMode = localStorage.getItem('auth_token') === 'demo-token';
  if (isDemoMode) {
    const idx = DEMO_POSTS.findIndex(p => p.id === id);
    if (idx > -1) DEMO_POSTS.splice(idx, 1);
    allPosts = DEMO_POSTS;
    await loadDashboard();
    await loadAllPosts();
    showToast('Post deleted', 'success');
    return;
  }

  try {
    await window.api.delete(`/posts/${id}`);
    await loadDashboard();
    await loadAllPosts();
    showToast('Post deleted', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editPost(id) {
  showToast('Edit functionality: connect to backend API', 'info');
}

function loadTemplates() {
  const container = document.getElementById('templates-list');
  if (!container) return;

  const templates = [
    { id: '1', name: '📝 Blog Post', type: 'blog' },
    { id: '2', name: '🛍️ Product Description', type: 'product' },
    { id: '3', name: '📱 Social Campaign', type: 'social' },
    { id: '4', name: '📧 Email Newsletter', type: 'email' },
    { id: '5', name: '🔍 SEO Article', type: 'blog' },
  ];

  container.innerHTML = templates.map(t => `
    <button class="template-btn" onclick="useTemplate('${t.id}', '${t.name}', '${t.type}')">
      ${t.name}
    </button>
  `).join('');
}

function useTemplate(id, name, type) {
  document.getElementById('gen-type').value = type;
  document.getElementById('gen-prompt').value = `Using the ${name} template: `;
  document.getElementById('gen-prompt').focus();
  showToast(`${name} template loaded`, 'info');
}

function loadWordPressSites() {
  const container = document.getElementById('wp-sites-list');
  if (!container) return;

  const isDemoMode = localStorage.getItem('auth_token') === 'demo-token';
  if (isDemoMode) {
    container.innerHTML = `
      <div class="empty-state-card">
        <span class="material-icons">web</span>
        <p>Connect your WordPress sites to auto-publish content.</p>
        <button class="btn-filled" onclick="showAddSiteForm()">Connect WordPress Site</button>
      </div>`;
    return;
  }

  window.api.get('/wordpress/sites').then(data => {
    const sites = data.sites || [];
    if (!sites.length) {
      container.innerHTML = `
        <div class="empty-state-card">
          <span class="material-icons">web</span>
          <p>No WordPress sites connected yet.</p>
          <button class="btn-filled" onclick="showAddSiteForm()">Connect Your First Site</button>
        </div>`;
      return;
    }

    container.innerHTML = sites.map(site => `
      <div class="site-card">
        <div class="site-card-header">
          <div class="site-icon"><span class="material-icons">web</span></div>
          <div class="site-info">
            <h4>${escapeHtml(site.name || site.siteUrl)}</h4>
            <p>${escapeHtml(site.siteUrl)}</p>
          </div>
        </div>
        <div class="site-actions">
          <button class="btn-outlined btn-sm" onclick="publishToSite('${site.id}')">Publish Post</button>
          <button class="btn-text btn-sm" style="color:var(--md-error)" onclick="removeSite('${site.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }).catch(() => {
    container.innerHTML = '<div class="empty-state">Failed to load sites.</div>';
  });
}

function showAddSiteForm() {
  document.getElementById('add-site-form').style.display = 'block';
}

function hideAddSiteForm() {
  document.getElementById('add-site-form').style.display = 'none';
}

function setupWordPressForm() {
  const form = document.getElementById('wp-site-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Connecting...';
    btn.disabled = true;

    const isDemoMode = localStorage.getItem('auth_token') === 'demo-token';
    if (isDemoMode) {
      hideAddSiteForm();
      showToast('Demo mode: WordPress connection simulated', 'success');
      btn.textContent = 'Connect Site';
      btn.disabled = false;
      return;
    }

    try {
      await window.api.post('/wordpress/sites', {
        siteUrl: document.getElementById('wp-url').value,
        username: document.getElementById('wp-user').value,
        applicationPassword: document.getElementById('wp-pass').value,
        name: document.getElementById('wp-name').value,
      });
      form.reset();
      hideAddSiteForm();
      loadWordPressSites();
      showToast('WordPress site connected!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = 'Connect Site';
      btn.disabled = false;
    }
  });
}

function loadToolsPage() {
  const grid = document.getElementById('tools-grid');
  if (!grid) return;

  const tools = [
    { name: 'ChatGPT', desc: 'AI chatbot for writing and analysis', url: 'https://chat.openai.com', icon: '🤖', cat: 'Writing' },
    { name: 'Midjourney', desc: 'AI image generation from text prompts', url: 'https://midjourney.com', icon: '🎨', cat: 'Image' },
    { name: 'DALL-E 3', desc: 'OpenAI image generation model', url: 'https://openai.com/dall-e-3', icon: '🖼️', cat: 'Image' },
    { name: 'ElevenLabs', desc: 'AI voice cloning and text-to-speech', url: 'https://elevenlabs.io', icon: '🎵', cat: 'Audio' },
    { name: 'Jasper AI', desc: 'AI writing for marketing content', url: 'https://jasper.ai', icon: '📝', cat: 'Marketing' },
    { name: 'Surfer SEO', desc: 'AI SEO optimization platform', url: 'https://surferseo.com', icon: '🔍', cat: 'SEO' },
  ];

  grid.innerHTML = tools.map(t => `
    <div class="tool-card">
      <div class="tool-card-header">
        <div class="tool-emoji">${t.icon}</div>
        <span class="badge badge-cat">${t.cat}</span>
      </div>
      <h3 class="tool-card-name">${t.name}</h3>
      <p class="tool-card-desc">${t.desc}</p>
      <div class="tool-card-footer">
        <a href="${t.url}" target="_blank" rel="noopener" class="btn-outlined btn-sm">Visit →</a>
      </div>
    </div>
  `).join('');
}

function loadSubscriptionInfo() {
  const container = document.getElementById('subscription-info');
  if (!container) return;

  const isDemoMode = localStorage.getItem('auth_token') === 'demo-token';
  if (isDemoMode) {
    container.innerHTML = '<p><strong>Plan:</strong> Free (Demo)</p><p><strong>Status:</strong> Active</p>';
    return;
  }

  window.api.get('/payments/subscription').then(data => {
    const sub = data.subscription || {};
    container.innerHTML = `
      <p><strong>Plan:</strong> ${sub.plan || 'Free'}</p>
      <p><strong>Status:</strong> ${sub.status || 'Active'}</p>
      ${sub.currentPeriodEnd ? `<p><strong>Renews:</strong> ${formatDate(sub.currentPeriodEnd)}</p>` : ''}
    `;
  }).catch(() => {
    container.innerHTML = '<p>Plan: Free</p>';
  });
}

function saveSettings() {
  showToast('Settings saved', 'success');
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initDashboard === 'function' && localStorage.getItem('auth_token')) {
    // initDashboard will be called by auth.js
  }
});
