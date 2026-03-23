import groqClient from '../config/groq.js';

const AUDIO_VIDEO_MIMETYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac',
  'audio/aac', 'audio/m4a', 'audio/webm',
  'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska',
];

export function isAudioOrVideo(mimetype) {
  return (
    AUDIO_VIDEO_MIMETYPES.includes(mimetype) ||
    mimetype.startsWith('audio/') ||
    mimetype.startsWith('video/')
  );
}

export async function transcribeBuffer(buffer, filename, mimetype) {
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB Whisper limit
  if (buffer.length > MAX_SIZE) {
    const err = new Error('Audio/video file exceeds the 25MB limit for transcription.');
    err.status = 413;
    throw err;
  }

  // Node 18+ supports File globally via 'buffer' module
  const { File } = await import('buffer');
  const file = new File([buffer], filename, { type: mimetype });

  const transcription = await groqClient.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'text',
  });

  // Groq returns a string when response_format is 'text'
  return typeof transcription === 'string' ? transcription : transcription.text;
}
