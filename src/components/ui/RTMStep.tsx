import React from 'react';
import type { TestSuite } from '@/types';

interface RTMStepProps {
  step: TestSuite;
}

const RTMStep: React.FC<RTMStepProps> = ({ step }) => (
  <div>
    <h3 className="font-semibold mb-2">RTM Messaging Check</h3>
    <div className={`mb-2 p-2 rounded ${step.notError === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
      <div dangerouslySetInnerHTML={{ __html: step.extra || '' }} />
    </div>
  </div>
);

export default RTMStep;
