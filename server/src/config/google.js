import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// In-memory session token store: Map<sessionId, tokens>
export const tokenStore = new Map();

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getOAuth2ClientForSession(sessionId) {
  const tokens = tokenStore.get(sessionId);
  if (!tokens) return null;

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Auto-refresh handling
  oauth2Client.on('tokens', (newTokens) => {
    const merged = { ...tokenStore.get(sessionId), ...newTokens };
    tokenStore.set(sessionId, merged);
  });

  return oauth2Client;
}

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
