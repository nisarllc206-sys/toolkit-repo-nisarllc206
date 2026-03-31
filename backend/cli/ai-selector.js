#!/usr/bin/env node
'use strict';

/**
 * CLI tool for managing AI model preferences and cache.
 *
 * Usage:
 *   node cli/ai-selector.js --status
 *   node cli/ai-selector.js --set claude
 *   node cli/ai-selector.js --set openai
 *   node cli/ai-selector.js --set auto
 *   node cli/ai-selector.js --cache-stats
 *   node cli/ai-selector.js --clear-cache
 *   node cli/ai-selector.js --cost-report
 */

// Resolve paths relative to this file so the CLI works from any directory.
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

const AICacheStats = require(path.join(rootDir, 'models/AICacheStats'));
const { calculateCost, estimateCacheSavings } = require(path.join(rootDir, 'config/costCalculator'));
const { PRICING, AI_SELECTION_LOGIC } = require(path.join(rootDir, 'config/aiModels'));

// ─── Preference storage (in-process; swap for Firestore in production) ────────

let _currentPreference = process.env.DEFAULT_AI_MODEL || 'auto';

function getPreference() {
  return _currentPreference;
}

function setPreference(model) {
  const allowed = ['claude', 'openai', 'auto'];
  if (!allowed.includes(model)) {
    console.error(`❌  Invalid model "${model}". Choose from: ${allowed.join(', ')}`);
    process.exit(1);
  }
  _currentPreference = model;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function printStatus() {
  const pref = getPreference();
  console.log('\n🤖  AI Model Preference');
  console.log('─────────────────────────────────────────');
  console.log(`  Current:  ${pref}`);
  console.log('\n  Content-type routing:');
  for (const [type, rule] of Object.entries(AI_SELECTION_LOGIC)) {
    console.log(`    ${type.padEnd(20)} preferred=${rule.preferred}  fallback=${rule.fallback}`);
  }
  console.log('');
}

function printCacheStats() {
  const stats = AICacheStats.getStats();
  console.log('\n📊  Cache Statistics');
  console.log('─────────────────────────────────────────');
  console.log(`  Total requests : ${stats.totalRequests}`);
  console.log(`  Cache hits     : ${stats.cacheHits}`);
  console.log(`  Cache misses   : ${stats.cacheMisses}`);
  console.log(`  Hit rate       : ${stats.hitRate}`);
  console.log(`  Cost saved     : $${stats.costSaved.toFixed(4)}`);
  console.log(`  Active entries : ${stats.activeEntries}`);

  if (stats.topCachedPrompts.length > 0) {
    console.log('\n  Top cached prompts:');
    for (const p of stats.topCachedPrompts) {
      console.log(`    ${p.promptType.padEnd(20)} hits=${p.hitCount}  savedTokens=${p.savedTokens}`);
    }
  }
  console.log('');
}

function printCostReport() {
  const inputTokens = 2000;
  const outputTokens = 500;
  const reuses = 5;

  const claudeSingle = calculateCost('claude', { inputTokens, outputTokens });
  const openaiSingle = calculateCost('openai', { inputTokens, outputTokens });

  const claudeCached = calculateCost('claude', {
    inputTokens,
    outputTokens,
    cacheWriteTokens: inputTokens,
  });
  const claudeReads = calculateCost('claude', {
    inputTokens: 0,
    outputTokens,
    cacheReadTokens: inputTokens,
  });

  const totalCacheCost = claudeCached.total + claudeReads.total * (reuses - 1);
  const totalNoCacheClaude = claudeSingle.total * reuses;
  const totalNoCache = openaiSingle.total * reuses;
  const savings = estimateCacheSavings(inputTokens, reuses - 1);

  console.log('\n💰  Cost Report (example: 2 000-token blog, 5 requests)');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`  Claude single request  : $${claudeSingle.total.toFixed(6)}`);
  console.log(`  OpenAI single request  : $${openaiSingle.total.toFixed(6)}`);
  console.log('');
  console.log(`  Claude (5×, no cache)  : $${totalNoCacheClaude.toFixed(6)}`);
  console.log(`  Claude (5×, cached)    : $${totalCacheCost.toFixed(6)}`);
  console.log(`  OpenAI (5×, no cache)  : $${totalNoCache.toFixed(6)}`);
  console.log('');
  console.log(`  Savings vs OpenAI      : $${(totalNoCache - totalCacheCost).toFixed(6)}`);
  console.log(`  Cache savings (Claude) : $${savings.toFixed(6)}`);
  console.log('');
  console.log('  Pricing (per 1 000 tokens):');
  for (const [model, p] of Object.entries(PRICING)) {
    console.log(`    ${model.padEnd(8)} input=$${p.input}  output=$${p.output}`);
  }
  console.log('');
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`
Usage: node cli/ai-selector.js <command>

Commands:
  --status          Show current AI preference and routing rules
  --set <model>     Set AI preference (claude | openai | auto)
  --cache-stats     Display cache performance statistics
  --clear-cache     Clear the in-memory prompt cache
  --cost-report     Show cost comparison report
  --help            Show this help message
`);
  process.exit(0);
}

if (args.includes('--status')) {
  printStatus();
} else if (args.includes('--set')) {
  const idx = args.indexOf('--set');
  const model = args[idx + 1];
  setPreference(model);
  console.log(`✅  AI preference set to: ${model}`);
} else if (args.includes('--cache-stats')) {
  printCacheStats();
} else if (args.includes('--clear-cache')) {
  AICacheStats.clearCache();
  console.log('✅  Cache cleared.');
} else if (args.includes('--cost-report')) {
  printCostReport();
} else {
  console.error(`❌  Unknown command. Run with --help for usage.`);
  process.exit(1);
}
