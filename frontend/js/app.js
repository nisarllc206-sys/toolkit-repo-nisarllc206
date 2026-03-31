const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async request(method, path, body = null) {
    const options = { method, headers: this.getHeaders() };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${this.baseUrl}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  delete(path) { return this.request('DELETE', path); }
}

window.api = new ApiClient();

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function router() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const page = document.getElementById(`page-${hash}`);
  if (page) page.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.page === hash);
  });

  // Trigger page-specific load
  if (typeof window.onPageChange === 'function') {
    window.onPageChange(hash);
  }
}

window.addEventListener('hashchange', router);
document.addEventListener('DOMContentLoaded', () => {
  router();
});
