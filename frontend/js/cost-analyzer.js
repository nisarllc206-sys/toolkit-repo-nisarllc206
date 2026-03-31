'use strict';

/**
 * Cost Analyzer — fetches the /api/ai/cost-analysis report and renders
 * a visual cost-comparison chart for Claude vs OpenAI.
 */

const API_BASE = window.AI_API_BASE || '/api/ai';

class CostAnalyzer {
  constructor() {
    this._data = null;
  }

  async fetchReport() {
    const res = await fetch(`${API_BASE}/cost-analysis`);
    if (!res.ok) throw new Error(`Cost analysis request failed: ${res.status}`);
    return res.json();
  }

  render(data) {
    this._data = data;

    // Per-request cost labels
    this._setText('[data-cost-claude-single]', `$${data.perRequest.claude.toFixed(6)}`);
    this._setText('[data-cost-openai-single]', `$${data.perRequest.openai.toFixed(6)}`);

    // With-caching totals
    this._setText('[data-cost-claude-cached]', `$${data.withCaching.claude.toFixed(6)}`);
    this._setText('[data-cost-openai-total]',  `$${data.withCaching.openai.toFixed(6)}`);
    this._setText('[data-cost-savings-abs]',   `$${data.withCaching.savingsVsOpenAI.toFixed(6)}`);
    this._setText('[data-cost-savings-pct]',   `${data.withCaching.savingsPct.toFixed(1)}%`);

    // Bar chart
    this._renderBars(data);

    document.dispatchEvent(new CustomEvent('costAnalysisUpdated', { detail: data }));
  }

  _renderBars(data) {
    const claudeBar = document.querySelector('.cost-bar.claude');
    const openaiBar = document.querySelector('.cost-bar.openai');

    if (!claudeBar || !openaiBar) return;

    const maxCost = Math.max(data.withCaching.claude, data.withCaching.openai, 0.000001);
    const maxHeightPx = 120;

    claudeBar.style.height = `${(data.withCaching.claude / maxCost) * maxHeightPx}px`;
    openaiBar.style.height = `${(data.withCaching.openai / maxCost) * maxHeightPx}px`;

    // Value labels
    const claudeVal = document.querySelector('[data-bar-claude-val]');
    const openaiVal = document.querySelector('[data-bar-openai-val]');
    if (claudeVal) claudeVal.textContent = `$${data.withCaching.claude.toFixed(5)}`;
    if (openaiVal) openaiVal.textContent = `$${data.withCaching.openai.toFixed(5)}`;
  }

  async load() {
    try {
      const data = await this.fetchReport();
      this.render(data);
    } catch (err) {
      console.warn('[CostAnalyzer] Failed to load report:', err.message);
    }
  }

  _setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }
}

window.costAnalyzer = new CostAnalyzer();

document.addEventListener('DOMContentLoaded', () => {
  window.costAnalyzer.load();
});
