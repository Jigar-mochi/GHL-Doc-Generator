import express from 'express';
import { uploadMiddleware } from '../middleware/upload.js';
import { isAudioOrVideo, transcribeBuffer } from '../services/transcriptionService.js';
import { generateTAD } from '../services/aiService.js';
import { generatePDF, generateDOCX } from '../services/documentService.js';
import { uploadDocuments } from '../services/driveService.js';

const router = express.Router();

// POST /api/generate
router.post('/', uploadMiddleware, async (req, res) => {
  try {
    const { clientName, projectName, message } = req.body;
    const file = req.file;

    // ── STEP 1: INPUT VALIDATION ─────────────────────────
    if (!message && !file) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Please provide either a message/notes or upload a file.',
      });
    }

    // Check authentication
    const sessionId = req.cookies?.sid;
    if (!sessionId) {
      return res.status(401).json({ error: 'NOT_AUTHENTICATED', message: 'Please connect Google Drive first.' });
    }

    // ── STEP 2: TRANSCRIPTION / TEXT EXTRACTION ─────────
    let extractedText = '';

    if (file) {
      const mime = file.mimetype;

      if (isAudioOrVideo(mime)) {
        // Audio/video transcription via Groq Whisper
        console.log(`Transcribing ${file.originalname} (${mime}, ${file.size} bytes)...`);
        try {
          extractedText = await transcribeBuffer(file.buffer, file.originalname, mime);
          console.log('Transcription complete, length:', extractedText.length);
        } catch (err) {
          if (err.status === 413) return res.status(413).json({ error: 'FILE_TOO_LARGE', message: err.message });
          throw err;
        }
      } else if (mime === 'application/pdf' || file.originalname?.endsWith('.pdf')) {
        // PDF text extraction
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await pdfParse(file.buffer);
        extractedText = parsed.text;
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname?.endsWith('.docx')
      ) {
        // DOCX text extraction
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      } else if (mime === 'text/plain' || file.originalname?.endsWith('.txt')) {
        extractedText = file.buffer.toString('utf8');
      } else {
        return res.status(415).json({
          error: 'UNSUPPORTED_FILE_TYPE',
          message: `File type "${mime}" is not supported. Please upload audio, video, PDF, DOCX, or TXT.`,
        });
      }
    }

    // Combine all text input
    const combinedContent = [message, extractedText].filter(Boolean).join('\n\n');

    if (!combinedContent.trim()) {
      return res.status(400).json({ error: 'NO_CONTENT', message: 'No readable content found. Please provide text or a valid file.' });
    }

    // ── STEP 3: AI DOCUMENT GENERATION ──────────────────
    console.log('Generating TAD with Groq AI...');
    const tad = await generateTAD(clientName, projectName, combinedContent);
    console.log('TAD generated for:', tad.clientName, '/', tad.projectName);

    // ── STEP 4: DOCUMENT GENERATION IN MEMORY ───────────
    console.log('Generating PDF and DOCX...');
    const [pdfBuffer, docxBuffer] = await Promise.all([
      generatePDF(tad),
      generateDOCX(tad),
    ]);
    console.log(`PDF: ${pdfBuffer.length} bytes | DOCX: ${docxBuffer.length} bytes`);

    // ── STEP 5: GOOGLE DRIVE UPLOAD ──────────────────────
    console.log('Uploading to Google Drive...');
    let driveResult;
    try {
      driveResult = await uploadDocuments(sessionId, tad.projectName, tad.clientName, pdfBuffer, docxBuffer);
    } catch (err) {
      if (err.status === 401 || err.code === 'NOT_AUTHENTICATED') {
        return res.status(401).json({ error: 'NOT_AUTHENTICATED', message: 'Google Drive session expired. Please reconnect.' });
      }
      console.error('Drive upload error:', err);
      return res.status(502).json({ error: 'DRIVE_UPLOAD_FAILED', message: 'Failed to upload files to Google Drive.' });
    }

    // ── STEP 6: RESPONSE ──────────────────────────────────
    const documentTitle = `${tad.projectName} - Technical Approach Document`;

    res.json({
      success: true,
      clientName: tad.clientName,
      projectName: tad.projectName,
      documentTitle,
      generatedAt: new Date().toISOString(),
      drive: {
        projectFolderLink: driveResult.projectFolderLink,
        pdf: {
          viewLink: driveResult.pdf.webViewLink,
          downloadLink: driveResult.pdf.directDownloadLink,
        },
        docx: {
          viewLink: driveResult.docx.webViewLink,
          downloadLink: driveResult.docx.directDownloadLink,
        },
      },
    });
  } catch (err) {
    console.error('Generate route error:', err.stack || err);
    if (err.status) {
      return res.status(err.status).json({ error: err.code || 'ERROR', message: err.message });
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.' });
  }
});

export default router;
