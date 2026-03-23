import React from 'react';
import { STEPS } from '../hooks/useDocumentGenerator.js';

function StepIcon({ status }) {
  if (status === 'complete') {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40">
        <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  if (status === 'skip') {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/25">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </div>
    );
  }
  // pending
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-white/30" />
    </div>
  );
}

export default function StepIndicator({ stepStatus }) {
  const visibleSteps = STEPS.filter(s => stepStatus[s.id] !== 'skip');

  // Calculate progress percentage
  const completed = visibleSteps.filter(s => stepStatus[s.id] === 'complete').length;
  const progress = visibleSteps.length > 0 ? Math.round((completed / visibleSteps.length) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Generating your TAD...</h3>
        <span className="text-blue-400 text-sm font-medium">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-6">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const status = stepStatus[step.id] || 'pending';
          if (status === 'skip') return null;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <StepIcon status={status} />
              <span className={`text-sm transition-colors ${
                status === 'active'   ? 'text-white font-medium' :
                status === 'complete' ? 'text-emerald-400'       :
                status === 'error'    ? 'text-red-400'           :
                'text-white/40'
              }`}>
                {step.label}
              </span>
              {status === 'active' && (
                <span className="ml-auto text-blue-400 text-xs animate-pulse">Processing...</span>
              )}
              {status === 'complete' && (
                <span className="ml-auto text-emerald-400/60 text-xs">Done</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
