import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    'audio/', 'video/',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const isAllowed = allowed.some(type => file.mimetype.startsWith(type));

  if (isAllowed) {
    cb(null, true);
  } else {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.message = `File type "${file.mimetype}" is not supported.`;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (Whisper enforces 25MB separately)
  },
});

export const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'FILE_TOO_LARGE', message: 'File exceeds the maximum allowed size of 100MB.' });
      }
      return res.status(400).json({ error: 'UPLOAD_ERROR', message: err.message });
    }
    if (err) {
      return res.status(500).json({ error: 'UPLOAD_ERROR', message: err.message });
    }
    next();
  });
};
