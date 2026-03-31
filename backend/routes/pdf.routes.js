const express = require('express');
const router = express.Router();
const pdfService = require('../services/pdfService');

// Merge PDFs
router.post('/merge', async (req, res) => {
  try {
    const { pdfPaths, outputName } = req.body;

    if (!pdfPaths || !Array.isArray(pdfPaths) || pdfPaths.length === 0) {
      return res.status(400).json({ error: 'pdfPaths array is required' });
    }

    const result = await pdfService.mergePDFs(pdfPaths, `./output/${outputName || 'merged'}.pdf`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extract text
router.post('/extract-text', async (req, res) => {
  try {
    const { pdfPath } = req.body;

    if (!pdfPath) {
      return res.status(400).json({ error: 'pdfPath is required' });
    }

    const result = await pdfService.extractText(pdfPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compress PDF
router.post('/compress', async (req, res) => {
  try {
    const { inputPath, quality } = req.body;

    if (!inputPath) {
      return res.status(400).json({ error: 'inputPath is required' });
    }

    const result = await pdfService.compressPDF(inputPath, `./output/compressed.pdf`, quality);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add watermark
router.post('/watermark', async (req, res) => {
  try {
    const { inputPath, watermarkText } = req.body;

    if (!inputPath || !watermarkText) {
      return res.status(400).json({ error: 'inputPath and watermarkText are required' });
    }

    const result = await pdfService.addWatermark(inputPath, `./output/watermarked.pdf`, watermarkText);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
