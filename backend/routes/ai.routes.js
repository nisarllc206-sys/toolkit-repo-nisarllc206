const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');

// Generate code from prompt
router.post('/generate-code', async (req, res) => {
  try {
    const { prompt, platform, model = 'gpt-4' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const enhancedPrompt = `Generate production-ready ${platform || 'application'} code based on: ${prompt}`;

    const result = await openaiService.generateCode(enhancedPrompt, model);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with PDF
router.post('/chat-pdf', async (req, res) => {
  try {
    const { userMessage, pdfContext } = req.body;

    if (!userMessage || !pdfContext) {
      return res.status(400).json({ error: 'Message and PDF context required' });
    }

    const response = await openaiService.chatWithPDF(userMessage, pdfContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate PR description
router.post('/generate-pr-description', async (req, res) => {
  try {
    const { changes } = req.body;

    if (!changes) {
      return res.status(400).json({ error: 'Changes required' });
    }

    const description = await openaiService.generateDescription(changes);
    res.json({ success: true, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
