import React from 'react';
import type { TestSuite } from '@/types';
import CompatibilityStep from './CompatibilityStep';
import MicrophoneStep from './MicrophoneStep';
import SpeakerStep from './SpeakerStep';
import CameraStep from './CameraStep';
import ConnectivityStep from './ConnectivityStep';
import RTMStep from './RTMStep';

interface StepContentProps {
  currentStep?: TestSuite;
  resolveSpeakerCheck: () => void;
  rejectSpeakerCheck: () => void;
  onMicrophoneComplete?: () => void;
  onCompatibilityComplete?: (isSupported: boolean) => void;
  DOM_IDS: { TEST_SEND: string; TEST_RECV: string };
  snackbarOpen: boolean;
  setSnackbarOpen: (open: boolean) => void;
  snackbarMsg: string;
  setSnackbarMsg: (msg: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  dialogMsg: string;
  setDialogMsg: (msg: string) => void;
}

const StepContent: React.FC<StepContentProps> = ({
  currentStep,
  resolveSpeakerCheck,
  rejectSpeakerCheck,
  onMicrophoneComplete,
  onCompatibilityComplete,
  DOM_IDS,
  snackbarOpen,
  setSnackbarOpen,
  snackbarMsg,
  setSnackbarMsg,
  dialogOpen,
  setDialogOpen,
  dialogMsg,
  setDialogMsg,
}) => {
  let content = null;
  switch (currentStep?.id) {
    case '0':
      content = <CompatibilityStep step={currentStep} onComplete={onCompatibilityComplete} />;
      break;
    case '1':
      content = <MicrophoneStep step={currentStep} onComplete={onMicrophoneComplete} />;
      break;
    case '2':
      content = (
        <SpeakerStep
          step={currentStep}
          resolveSpeakerCheck={resolveSpeakerCheck}
          rejectSpeakerCheck={rejectSpeakerCheck}
        />
      );
      break;
    case '3':
      content = <CameraStep step={currentStep} />;
      break;
    case '4':
      content = <ConnectivityStep step={currentStep} />;
      break;
    case '5':
      content = <RTMStep step={currentStep} />;
      break;
    default:
      content = (
        <div className="text-sm text-gray-500 leading-relaxed">
          <div className="mb-2">Test steps:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Browser/permission checks</li>
            <li>Mic &amp; Speaker tests</li>
            <li>Resolution tests</li>
            <li>Connectivity stats</li>
            <li>RTM messaging</li>
          </ul>
          <div className="mt-4 text-xs text-gray-400">
            Step content will appear here as you progress.
          </div>
        </div>
      );
  }
  return (
    <section className="border border-gray-200 rounded-lg p-6 min-h-[320px] bg-white shadow-sm flex flex-col justify-center">
      {content}
      {/* Hidden test elements for Agora SDK (keep in DOM) */}
      <div id={DOM_IDS.TEST_SEND} className="fixed -right-full w-[160px] h-[90px]" />
      <div id={DOM_IDS.TEST_RECV} className="fixed -right-full w-[160px] h-[90px]" />
    </section>
  );
};

export default StepContent;
