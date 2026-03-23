import { useState, useCallback } from 'react';
import { generateDocument } from '../lib/api.js';

export const STEPS = [
  { id: 'upload',       label: 'Uploading & Analyzing Input' },
  { id: 'transcribe',   label: 'Transcribing Audio/Video' },
  { id: 'ai',           label: 'Generating Document Content with AI' },
  { id: 'documents',    label: 'Creating PDF & DOCX Files' },
  { id: 'drive',        label: 'Uploading to Google Drive' },
];

// Approximate timing weights for step simulation (ms)
const STEP_DURATIONS = {
  upload:     3000,
  transcribe: 8000,
  ai:         15000,
  documents:  5000,
  drive:      5000,
};

export default function useDocumentGenerator(hasFile, fileIsMedia) {
  const [loading, setLoading]         = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // step id string
  const [stepStatus, setStepStatus]   = useState({});   // { stepId: 'pending'|'active'|'complete'|'skip' }
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);

  const resetState = useCallback(() => {
    setLoading(false);
    setCurrentStep(null);
    setStepStatus({});
    setResult(null);
    setError(null);
  }, []);

  const generateDoc = useCallback(async (formData) => {
    resetState();
    setLoading(true);
    setError(null);

    // Determine which steps to show
    const activeSteps = STEPS.filter(s => {
      if (s.id === 'transcribe' && !fileIsMedia) return false;
      return true;
    });

    // Initialise all as pending
    const initialStatus = {};
    STEPS.forEach(s => { initialStatus[s.id] = 'pending'; });
    if (!fileIsMedia) initialStatus['transcribe'] = 'skip';
    setStepStatus(initialStatus);

    // Step simulation timer
    let stepIndex = 0;
    const stepTimers = [];
    let resolved = false;

    const advanceStep = () => {
      if (resolved || stepIndex >= activeSteps.length) return;
      const step = activeSteps[stepIndex];

      setStepStatus(prev => ({ ...prev, [step.id]: 'active' }));
      setCurrentStep(step.id);

      const duration = STEP_DURATIONS[step.id] || 4000;
      const timer = setTimeout(() => {
        if (!resolved) {
          setStepStatus(prev => ({ ...prev, [step.id]: 'complete' }));
          stepIndex++;
          advanceStep();
        }
      }, duration);
      stepTimers.push(timer);
    };

    advanceStep();

    try {
      const data = await generateDocument(formData);
      resolved = true;
      stepTimers.forEach(clearTimeout);

      // Mark all active steps as complete
      const finalStatus = {};
      STEPS.forEach(s => {
        finalStatus[s.id] = s.id === 'transcribe' && !fileIsMedia ? 'skip' : 'complete';
      });
      setStepStatus(finalStatus);
      setCurrentStep(null);
      setResult(data);
    } catch (err) {
      resolved = true;
      stepTimers.forEach(clearTimeout);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'An unexpected error occurred. Please try again.';

      setError(msg);

      // Mark current step as error
      setStepStatus(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          if (next[k] === 'active') next[k] = 'error';
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [fileIsMedia, resetState]);

  return {
    loading,
    currentStep,
    stepStatus,
    result,
    error,
    generateDoc,
    resetState,
  };
}
