import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── ERROR HANDLER ────────────────────────────────────────────
app.use(errorHandler);

// ── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`TAD Generator server running on http://localhost:${PORT}`);
  console.log(`Client URL: ${CLIENT_URL}`);
  console.log(`Groq API Key: ${process.env.GROQ_API_KEY ? '✓ Set' : '✗ NOT SET'}`);
  console.log(`Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ NOT SET'}`);
  console.log(`Drive Parent Folder: ${process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID ? '✓ Set' : '✗ NOT SET'}`);
});

export default app;
