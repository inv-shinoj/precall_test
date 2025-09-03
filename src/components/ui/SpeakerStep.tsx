import React from 'react';
import { SAMPLE_AUDIO_PATH, DOM_IDS } from '@/constants/settings';
import type { TestSuite } from '@/types';

interface SpeakerStepProps {
  step: TestSuite;
  resolveSpeakerCheck: () => void;
  rejectSpeakerCheck: () => void;
}

const SpeakerStep: React.FC<SpeakerStepProps> = ({ step, resolveSpeakerCheck, rejectSpeakerCheck }) => (
  <div>
    <h3 className="font-semibold mb-2">Speaker Check</h3>
    <div className={`mb-2 p-2 rounded ${step.notError === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
      <div dangerouslySetInnerHTML={{ __html: step.extra || '' }} />
    </div>
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 border border-gray-100 rounded-lg p-6 bg-blue-50 flex flex-col justify-between">
        <p className="mb-6 text-sm text-gray-700">
          Please listen to the sample audio and confirm if you can hear it clearly.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resolveSpeakerCheck}
            className="px-5 py-2 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
          >
            Yes
          </button>
          <button
            onClick={rejectSpeakerCheck}
            className="px-5 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
          >
            No
          </button>
        </div>
      </div>
      <div className="flex-1 border border-gray-100 rounded-lg p-6 flex items-center justify-center bg-white">
        <audio id={DOM_IDS.SAMPLE_MUSIC} controls className="w-full">
          <source src={SAMPLE_AUDIO_PATH} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  </div>
);

export default SpeakerStep;
