const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

class AuthService {
  static async login(email, password) {
    const data = await window.api.post('/auth/login', { email, password });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  static async register(email, password, name) {
    const data = await window.api.post('/auth/register', { email, password, name });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  static logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
  }

  static getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  static getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static isAuthenticated() {
    return !!AuthService.getToken();
  }
}

function switchTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
  } else {
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
    tabLogin?.classList.remove('active');
    tabRegister?.classList.add('active');
  }
}

function enterDemoMode() {
  // Store a mock token and user for demo
  localStorage.setItem(AUTH_TOKEN_KEY, 'demo-token');
  localStorage.setItem(USER_KEY, JSON.stringify({
    id: 'demo',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'free',
    subscription: { plan: 'free', status: 'active' },
  }));
  closeModal('auth-modal');
  const app = document.getElementById('main-app');
  if (app) app.style.display = 'flex';
  initDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const btn = loginForm.querySelector('button[type="submit"]');
      btn.textContent = 'Signing in...';
      btn.disabled = true;
      try {
        await AuthService.login(email, password);
        closeModal('auth-modal');
        document.getElementById('main-app').style.display = 'flex';
        initDashboard();
      } catch (error) {
        showToast(error.message || 'Login failed', 'error');
      } finally {
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const btn = registerForm.querySelector('button[type="submit"]');
      btn.textContent = 'Creating...';
      btn.disabled = true;
      try {
        await AuthService.register(email, password, name);
        closeModal('auth-modal');
        document.getElementById('main-app').style.display = 'flex';
        initDashboard();
      } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
      } finally {
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => AuthService.logout());
  }

  // Auto-login if token exists
  if (AuthService.isAuthenticated()) {
    closeModal('auth-modal');
    const app = document.getElementById('main-app');
    if (app) app.style.display = 'flex';
    if (typeof initDashboard === 'function') initDashboard();
  }
});
