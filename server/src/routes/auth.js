import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createOAuth2Client, tokenStore, SCOPES } from '../config/google.js';

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// GET /api/auth/url — returns Google OAuth2 consent URL
router.get('/url', (req, res) => {
  try {
    const oauth2Client = createOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
    res.json({ authUrl });
  } catch (err) {
    console.error('Error generating auth URL:', err);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// GET /api/auth/callback — exchange code for tokens
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`${CLIENT_URL}?auth=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${CLIENT_URL}?auth=error&reason=no_code`);
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    let sessionId = req.cookies?.sid;
    if (!sessionId) {
      sessionId = uuidv4();
    }

    tokenStore.set(sessionId, tokens);

    res.cookie('sid', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.redirect(`${CLIENT_URL}?auth=success`);
  } catch (err) {
    console.error('Token exchange error:', err);
    res.redirect(`${CLIENT_URL}?auth=error&reason=token_exchange_failed`);
  }
});

// GET /api/auth/status — check if authenticated
router.get('/status', (req, res) => {
  const sessionId = req.cookies?.sid;
  if (sessionId && tokenStore.has(sessionId)) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// GET /api/auth/logout — clear session
router.get('/logout', (req, res) => {
  const sessionId = req.cookies?.sid;
  if (sessionId) {
    tokenStore.delete(sessionId);
  }
  res.clearCookie('sid');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
