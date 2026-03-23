import { google } from 'googleapis';
import { Readable } from 'stream';
import { getOAuth2ClientForSession } from '../config/google.js';

const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

async function getDriveClient(sessionId) {
  const auth = getOAuth2ClientForSession(sessionId);
  if (!auth) {
    const err = new Error('Not authenticated with Google Drive');
    err.status = 401;
    err.code = 'NOT_AUTHENTICATED';
    throw err;
  }
  return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(drive, folderName) {
  // Search for existing folder
  const searchRes = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${PARENT_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name, webViewLink)',
    spaces: 'drive',
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    const folder = searchRes.data.files[0];
    return {
      id: folder.id,
      webViewLink: `https://drive.google.com/drive/folders/${folder.id}`,
    };
  }

  // Create new folder
  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [PARENT_FOLDER_ID],
    },
    fields: 'id, name',
  });

  const folderId = createRes.data.id;
  return {
    id: folderId,
    webViewLink: `https://drive.google.com/drive/folders/${folderId}`,
  };
}

async function uploadFile(drive, folderId, filename, mimeType, buffer) {
  const bufferStream = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: bufferStream,
    },
    fields: 'id, name, webViewLink, webContentLink',
  });

  const fileId = res.data.id;

  // Set file permission to anyone reader
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    fileId,
    webViewLink: res.data.webViewLink,
    webContentLink: res.data.webContentLink,
    directDownloadLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

export async function uploadDocuments(sessionId, projectName, clientName, pdfBuffer, docxBuffer) {
  const drive = await getDriveClient(sessionId);

  const folderName = `${projectName || 'Project'} - ${clientName || 'Client'}`;
  const folder = await findOrCreateFolder(drive, folderName);

  const safeName = `${(projectName || 'TAD').replace(/[^a-zA-Z0-9\s-]/g, '')}_${new Date().toISOString().split('T')[0]}`;

  const [pdfResult, docxResult] = await Promise.all([
    uploadFile(drive, folder.id, `${safeName}.pdf`, 'application/pdf', pdfBuffer),
    uploadFile(
      drive, folder.id,
      `${safeName}.docx`,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      docxBuffer
    ),
  ]);

  return {
    projectFolderId: folder.id,
    projectFolderLink: folder.webViewLink,
    pdf: pdfResult,
    docx: docxResult,
  };
}
