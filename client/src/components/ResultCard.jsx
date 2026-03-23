import React from 'react';
import Button from './ui/Button.jsx';
import Badge from './ui/Badge.jsx';

function LinkRow({ label, icon, viewLink, downloadLink }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <span className="text-white/80 text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {viewLink && (
          <a
            href={viewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-300 bg-blue-500/15 border border-blue-500/25 hover:bg-blue-500/25 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </a>
        )}
        {downloadLink && (
          <a
            href={downloadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        )}
      </div>
    </div>
  );
}

export default function ResultCard({ result, onReset }) {
  if (!result) return null;

  const date = new Date(result.generatedAt);
  const formatted = date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl flex-shrink-0">
          ✅
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-base">Document Generated Successfully!</h3>
          <p className="text-white/50 text-xs mt-0.5">{formatted}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Badge variant="info">
          <span className="font-medium">Client:</span> {result.clientName}
        </Badge>
        <Badge variant="info">
          <span className="font-medium">Project:</span> {result.projectName}
        </Badge>
      </div>

      {/* Google Drive folder link */}
      {result.drive?.projectFolderLink && (
        <a
          href={result.drive.projectFolderLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all mb-3 group"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-yellow-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <span className="text-white/70 text-sm group-hover:text-white transition-colors flex-1">Open Project Folder in Google Drive</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {/* File links */}
      <div className="space-y-2 mb-5">
        <LinkRow
          label="PDF Document"
          icon="📕"
          viewLink={result.drive?.pdf?.viewLink}
          downloadLink={result.drive?.pdf?.downloadLink}
        />
        <LinkRow
          label="Word Document (DOCX)"
          icon="📝"
          viewLink={result.drive?.docx?.viewLink}
          downloadLink={result.drive?.docx?.downloadLink}
        />
      </div>

      {/* Reset button */}
      <Button variant="secondary" fullWidth onClick={onReset}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Generate Another Document
      </Button>
    </div>
  );
}
