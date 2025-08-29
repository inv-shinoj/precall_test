import React from 'react';
import type { TestSuite } from '@/types';

interface CompatibilityStepProps {
  step: TestSuite;
  onComplete?: (isSupported: boolean) => void;
}


import { useEffect } from 'react';

const CompatibilityStep: React.FC<CompatibilityStepProps> = ({ step, onComplete }) => {
  useEffect(() => {
    let cancelled = false;
    async function runCheck() {
      // Only run on client
      if (typeof window === 'undefined') return;
      let AgoraRTC = (window as any).AgoraRTC;
      if (!AgoraRTC) {
        try {
          // Dynamically import if not present
          AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
          (window as any).AgoraRTC = AgoraRTC;
        } catch (e) {
          AgoraRTC = null;
        }
      }
      setTimeout(() => {
        if (cancelled) return;
        const isSupported = AgoraRTC ? AgoraRTC.checkSystemRequirements() : false;
        if (onComplete) onComplete(isSupported);
      }, 1200);
    }
    runCheck();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <h3 className="font-semibold mb-2">Browser Compatibility Check</h3>
      <div className={`mb-2 p-2 rounded ${step.notError === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
        <div dangerouslySetInnerHTML={{ __html: step.extra || '' }} />
      </div>
    </div>
  );
};

export default CompatibilityStep;
