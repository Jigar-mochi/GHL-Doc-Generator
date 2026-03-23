import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header.jsx';
import UploadZone from '../components/UploadZone.jsx';
import StepIndicator from '../components/StepIndicator.jsx';
import ResultCard from '../components/ResultCard.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Label from '../components/ui/Label.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import useDocumentGenerator from '../hooks/useDocumentGenerator.js';
import { getAuthStatus, getAuthUrl } from '../lib/api.js';

// ── Simple Toast ─────────────────────────────────────────────
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up">
      <div className="flex items-start gap-3 bg-red-900/90 border border-red-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
        <span className="text-red-400 mt-0.5 flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </span>
        <p className="text-red-200 text-sm flex-1">{message}</p>
        <button onClick={onDismiss} className="text-red-400 hover:text-red-200 flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Auth Banner ───────────────────────────────────────────────
function AuthBanner({ onConnect }) {
  return (
    <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-400 flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-amber-200 text-sm flex-1">
        Please connect your Google Drive to enable document upload and sharing.
      </p>
      <button
        onClick={onConnect}
        className="text-amber-300 text-sm font-medium hover:text-amber-100 underline underline-offset-2 whitespace-nowrap"
      >
        Connect now →
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Home({ darkMode, setDarkMode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [clientName, setClientName]       = useState('');
  const [projectName, setProjectName]     = useState('');
  const [message, setMessage]             = useState('');
  const [file, setFile]                   = useState(null);
  const [toast, setToast]                 = useState(null);

  const fileIsMedia = file && (file.type.startsWith('audio/') || file.type.startsWith('video/'));

  const { loading, stepStatus, result, error, generateDoc, resetState } =
    useDocumentGenerator(!!file, !!fileIsMedia);

  // ── Auth check on mount + after OAuth redirect ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authenticated: auth } = await getAuthStatus();
        setAuthenticated(auth);
      } catch {
        setAuthenticated(false);
      }
    };
    checkAuth();

    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      checkAuth();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('auth') === 'error') {
      const reason = params.get('reason') || 'unknown';
      setToast(`Google authentication failed: ${reason}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Show errors as toasts ──
  useEffect(() => {
    if (error) {
      setToast(error);
    }
  }, [error]);

  const handleConnect = async () => {
    try {
      const url = await getAuthUrl();
      window.location.href = url;
    } catch {
      setToast('Failed to get Google auth URL. Check server configuration.');
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!authenticated) {
      setToast('Please connect Google Drive first.');
      return;
    }
    if (!message.trim() && !file) {
      setToast('Please provide a message, notes, or upload a file.');
      return;
    }

    const formData = new FormData();
    if (clientName.trim()) formData.append('clientName', clientName.trim());
    if (projectName.trim()) formData.append('projectName', projectName.trim());
    if (message.trim()) formData.append('message', message.trim());
    if (file) formData.append('file', file);

    await generateDoc(formData);
  }, [authenticated, message, file, clientName, projectName, generateDoc]);

  const handleReset = useCallback(() => {
    resetState();
    setClientName('');
    setProjectName('');
    setMessage('');
    setFile(null);
  }, [resetState]);

  const showForm = !loading && !result;
  const showSteps = loading;
  const showResult = !!result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-800/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header
          authenticated={authenticated}
          onAuthChange={setAuthenticated}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main className="max-w-2xl mx-auto px-6 pb-20">
          {/* Hero */}
          <div className="text-center mb-10 mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Powered by Groq AI + Llama 3.3
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
              Technical Approach<br />
              <span className="text-gradient">Document Generator</span>
            </h1>
            <p className="text-white/50 text-base max-w-md mx-auto">
              Upload a call recording or paste client notes — get a professional TAD exported to Google Drive in minutes.
            </p>
          </div>

          {/* Auth banner when not connected */}
          {!authenticated && <AuthBanner onConnect={handleConnect} />}

          {/* Form */}
          {showForm && (
            <div className="space-y-5 animate-fade-in">
              {/* Client + Project names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. CRM Automation Setup"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Message / notes */}
              <div>
                <Label htmlFor="message">Client Message / Call Notes</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Paste client's email, chat message, or call notes here..."
                  rows={6}
                  disabled={loading}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs font-medium">OR UPLOAD A FILE</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Upload zone */}
              <UploadZone file={file} onFileChange={setFile} disabled={loading} />

              {/* Generate button */}
              <Button
                fullWidth
                size="lg"
                loading={loading}
                disabled={loading || (!message.trim() && !file)}
                onClick={handleGenerate}
                className="mt-2"
              >
                {loading ? 'Generating...' : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Technical Approach Document
                  </>
                )}
              </Button>

              {/* Helper text */}
              {!authenticated && (
                <p className="text-center text-amber-400/70 text-xs">
                  ⚠️ Connect Google Drive before generating — documents are saved there automatically.
                </p>
              )}
            </div>
          )}

          {/* Step progress */}
          {showSteps && (
            <StepIndicator stepStatus={stepStatus} />
          )}

          {/* Result */}
          {showResult && (
            <ResultCard result={result} onReset={handleReset} />
          )}

          {/* Feature cards */}
          {showForm && (
            <div className="grid grid-cols-3 gap-3 mt-10">
              {[
                { icon: '🎙️', title: 'Audio Transcription', desc: 'Upload call recordings — Groq Whisper converts speech to text instantly.' },
                { icon: '🤖', title: 'AI-Powered TAD', desc: 'Llama 3.3-70b extracts requirements and writes a 17-section professional document.' },
                { icon: '☁️', title: 'Google Drive Export', desc: 'PDF & DOCX uploaded automatically to a dedicated project folder.' },
              ].map(f => (
                <div key={f.title} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-white text-xs font-semibold mb-1">{f.title}</div>
                  <div className="text-white/40 text-xs leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
