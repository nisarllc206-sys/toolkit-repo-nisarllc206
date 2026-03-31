'use strict';

/**
 * Cache Monitor — polls the /api/ai/cache-stats endpoint and updates
 * the dashboard widgets with live cache performance data.
 */

const API_BASE = window.AI_API_BASE || '/api/ai';
const POLL_INTERVAL = parseInt(window.AI_CACHE_POLL_INTERVAL, 10) || 60_000; // 60 seconds (configurable)

class CacheMonitor {
  constructor() {
    this._intervalId = null;
    this._lastStats = null;
  }

  /** Fetch the latest stats from the server. */
  async fetchStats() {
    const res = await fetch(`${API_BASE}/cache-stats`);
    if (!res.ok) throw new Error(`Cache stats request failed: ${res.status}`);
    return res.json();
  }

  /** Render stats into DOM elements. Uses data attributes for targeting. */
  render(stats) {
    this._lastStats = stats;

    this._setText('[data-cache-total]',  stats.totalRequests);
    this._setText('[data-cache-hits]',   stats.cacheHits);
    this._setText('[data-cache-misses]', stats.cacheMisses);
    this._setText('[data-cache-rate]',   stats.hitRate);
    this._setText('[data-cache-saved]',  `$${stats.costSaved.toFixed(4)}`);
    this._setText('[data-cache-entries]', stats.activeEntries);

    // Progress bar
    const bar = document.querySelector('.hit-rate-fill');
    if (bar) {
      const pct = parseFloat(stats.hitRate) || 0;
      bar.style.width = `${Math.min(pct, 100)}%`;
    }

    // Top prompts table
    const tbody = document.querySelector('[data-cache-top-body]');
    if (tbody && stats.topCachedPrompts) {
      tbody.innerHTML = stats.topCachedPrompts.map((p) => `
        <tr>
          <td>${this._esc(p.promptType)}</td>
          <td>${p.hitCount}</td>
          <td>${p.savedTokens.toLocaleString()}</td>
          <td>$${(p.costSaved || 0).toFixed(4)}</td>
        </tr>
      `).join('');
    }

    this._dispatchEvent('cacheStatsUpdated', stats);
  }

  /** Start automatic polling. */
  start() {
    if (this._intervalId) return;
    this._refresh();
    this._intervalId = setInterval(() => this._refresh(), POLL_INTERVAL);
  }

  /** Stop polling. */
  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  async _refresh() {
    try {
      const stats = await this.fetchStats();
      this.render(stats);
    } catch (err) {
      console.warn('[CacheMonitor] Refresh failed:', err.message);
    }
  }

  _setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _dispatchEvent(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

window.cacheMonitor = new CacheMonitor();

document.addEventListener('DOMContentLoaded', () => {
  window.cacheMonitor.start();
});
