import React from 'react';
import type { TestSuite } from '@/types';

interface TestReportProps {
  testSuites: TestSuite[];
  profiles: { width: number; height: number; status: string }[];
}

const statusIcon = (ok: boolean) => ok ? (
  <span className="text-green-600 text-lg">&#10003;</span>
) : (
  <span className="text-red-600 text-lg">&#10007;</span>
);

const TestReport: React.FC<TestReportProps> = ({ testSuites, profiles }) => {
  return (
    <div className="max-w-xl mx-auto bg-white rounded shadow border">
      <div className="bg-blue-500 text-white text-lg font-semibold px-4 py-2 rounded-t">Test Report</div>
      <ul className="divide-y">
        {testSuites.map(suite => (
          <li key={suite.id} className="p-4">
            <div className="flex items-center gap-2 font-medium">
              {statusIcon(suite.notError)}
              <span>{suite.label}</span>
            </div>
            {suite.id === '3' && (
              <div className="mt-2 ml-6">
                {profiles.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{p.width} * {p.height}</span>
                    {p.status === 'resolve' && <span className="text-green-600">support</span>}
                    {p.status === 'reject' && <span className="text-red-600">not support</span>}
                    {p.status === 'pending' && <span className="text-gray-400">pending</span>}
                  </div>
                ))}
              </div>
            )}
            {suite.extra && suite.id !== '3' && (
              <div className="ml-6 text-xs text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: suite.extra }} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestReport;
