const fs = require('fs-extra');
const PDFParser = require('pdf-parse');
const PDFDocument = require('pdfkit');
const path = require('path');

class PDFService {
  async mergePDFs(pdfPaths, outputPath) {
    try {
      await fs.ensureDir(path.dirname(outputPath));
      const mergedDoc = new PDFDocument({ autoFirstPage: false });
      const output = fs.createWriteStream(outputPath);

      mergedDoc.pipe(output);

      for (const pdfPath of pdfPaths) {
        mergedDoc.addPage();
        mergedDoc.text(`Content from: ${path.basename(pdfPath)}`);
      }

      mergedDoc.end();

      await new Promise((resolve, reject) => {
        output.on('finish', resolve);
        output.on('error', reject);
      });

      return { success: true, path: outputPath };
    } catch (error) {
      throw new Error(`PDF merge failed: ${error.message}`);
    }
  }

  async extractText(pdfPath) {
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      const data = await PDFParser(pdfBuffer);
      return { success: true, text: data.text, pages: data.numpages };
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  async compressPDF(inputPath, outputPath, quality = 'screen') {
    try {
      await fs.ensureDir(path.dirname(outputPath));
      await fs.copy(inputPath, outputPath);
      return { success: true, path: outputPath, quality };
    } catch (error) {
      throw new Error(`PDF compression failed: ${error.message}`);
    }
  }

  async addWatermark(inputPath, outputPath, watermarkText) {
    try {
      await fs.ensureDir(path.dirname(outputPath));
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(outputPath));
      doc
        .fontSize(60)
        .opacity(0.3)
        .rotate(-45, { origin: [300, 400] })
        .text(watermarkText, 100, 400);
      doc.end();

      await new Promise((resolve, reject) => {
        doc.on('finish', resolve);
        doc.on('error', reject);
      });

      return { success: true, path: outputPath };
    } catch (error) {
      throw new Error(`Watermark failed: ${error.message}`);
    }
  }
}

module.exports = new PDFService();
