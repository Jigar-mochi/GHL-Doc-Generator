import React, { useRef, useState, useCallback } from 'react';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimetype, name) {
  if (!mimetype && !name) return '📄';
  const m = mimetype || '';
  const n = (name || '').toLowerCase();
  if (m.startsWith('audio/') || n.endsWith('.mp3') || n.endsWith('.wav') || n.endsWith('.m4a')) return '🎵';
  if (m.startsWith('video/') || n.endsWith('.mp4') || n.endsWith('.mov') || n.endsWith('.webm')) return '🎬';
  if (m === 'application/pdf' || n.endsWith('.pdf')) return '📕';
  if (m.includes('wordprocessingml') || n.endsWith('.docx')) return '📝';
  if (m === 'text/plain' || n.endsWith('.txt')) return '📄';
  return '📁';
}

function getFileTypeLabel(mimetype, name) {
  const m = mimetype || '';
  const n = (name || '').toLowerCase();
  if (m.startsWith('audio/')) return 'Audio File';
  if (m.startsWith('video/')) return 'Video File';
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'PDF Document';
  if (m.includes('wordprocessingml') || n.endsWith('.docx')) return 'Word Document';
  if (m === 'text/plain' || n.endsWith('.txt')) return 'Text File';
  return 'File';
}

export default function UploadZone({ file, onFileChange, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((f) => {
    if (!f) return;
    onFileChange(f);
  }, [onFileChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e) => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  }, [handleFile]);

  if (file) {
    return (
      <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 flex items-center gap-4">
        <div className="text-3xl">{getFileIcon(file.type, file.name)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm truncate">{file.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/50 text-xs">{getFileTypeLabel(file.type, file.name)}</span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/50 text-xs">{formatBytes(file.size)}</span>
          </div>
        </div>
        {!disabled && (
          <button
            onClick={() => onFileChange(null)}
            className="text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
            title="Remove file"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${dragging
          ? 'border-blue-400 bg-blue-500/15 scale-[1.01]'
          : 'border-white/20 hover:border-white/35 hover:bg-white/5'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="audio/*,video/*,.pdf,.docx,.txt"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className={`text-3xl mb-3 transition-transform ${dragging ? 'scale-110' : ''}`}>
        {dragging ? '⬇️' : '☁️'}
      </div>
      <div className="text-white/70 text-sm font-medium">
        {dragging ? 'Drop your file here' : 'Drag & drop a file, or click to browse'}
      </div>
      <div className="text-white/35 text-xs mt-1.5">
        Supports: Audio 🎵 · Video 🎬 · PDF 📕 · DOCX 📝 · TXT 📄
      </div>
      <div className="text-white/25 text-xs mt-1">
        Max 25MB for audio/video transcription
      </div>
    </div>
  );
}
