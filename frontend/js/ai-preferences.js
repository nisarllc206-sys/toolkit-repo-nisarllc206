'use strict';

/**
 * AI Preferences UI — manages the AI model selection controls in the
 * dashboard and persists the user's choice via the REST API.
 */

const API_BASE = window.AI_API_BASE || '/api/ai';

class AIPreferences {
  constructor() {
    this._current = localStorage.getItem('ai_preference') || 'auto';
    this._listeners = [];
  }

  /** Current preference: 'claude' | 'openai' | 'auto' */
  get current() {
    return this._current;
  }

  /**
   * Set the preference and optionally persist it to the server.
   * @param {'claude'|'openai'|'auto'} model
   * @param {boolean} [persist=true]
   */
  async set(model, persist = true) {
    const allowed = ['claude', 'openai', 'auto'];
    if (!allowed.includes(model)) {
      console.error(`[AIPreferences] Invalid model: ${model}`);
      return;
    }

    this._current = model;
    localStorage.setItem('ai_preference', model);
    this._notify();

    if (persist) {
      try {
        await fetch(`${API_BASE}/preferences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredModel: model }),
        });
      } catch (err) {
        console.warn('[AIPreferences] Failed to persist preference:', err.message);
      }
    }
  }

  /** Subscribe to preference changes. */
  onChange(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  }

  _notify() {
    for (const fn of this._listeners) {
      try { fn(this._current); } catch (_) { /* ignore */ }
    }
  }

  /**
   * Bind the UI selector buttons.
   * Expects elements with `data-ai-model` attributes.
   */
  bindUI() {
    const buttons = document.querySelectorAll('[data-ai-model]');

    const refresh = (active) => {
      buttons.forEach((btn) => {
        const model = btn.dataset.aiModel;
        btn.classList.remove('active-claude', 'active-openai', 'active-auto');
        if (model === active) {
          btn.classList.add(`active-${model}`);
        }
      });
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => this.set(btn.dataset.aiModel));
    });

    this.onChange(refresh);
    refresh(this._current);
  }
}

// Singleton
window.aiPreferences = new AIPreferences();

document.addEventListener('DOMContentLoaded', () => {
  window.aiPreferences.bindUI();
});
