import React, { useState } from "react";
import type { TestSuite } from "@/types";

interface TestReportProps {
  testSuites: TestSuite[];
  profiles: { width: number; height: number; status: string }[];
}

const StatusIcon = ({ ok }: { ok: boolean }) =>
  ok ? (
    <span className="text-green-600 text-lg">&#10003;</span>
  ) : (
    <span className="text-red-600 text-lg">&#10007;</span>
  );

const StatusBadge = ({ status }: { status: string }) => {
  const base = "px-2 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "resolve":
      return <span className={`${base} bg-green-100 text-green-700`}>Support</span>;
    case "reject":
      return <span className={`${base} bg-red-100 text-red-700`}>Not Support</span>;
    default:
      return <span className={`${base} bg-gray-100 text-gray-500`}>Pending</span>;
  }
};

const TestReport: React.FC<TestReportProps> = ({ testSuites, profiles }) => {
  const [openSuite, setOpenSuite] = useState<string | null>(null);

  const toggleSuite = (id: string) => {
    setOpenSuite((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto bg-white rounded-2xl shadow border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-base sm:text-lg font-semibold px-3 sm:px-6 py-3">
        Test Report
      </div>

      <ul className="divide-y">
        {testSuites.map((suite) => {
          const isOpen = openSuite === suite.id;
          return (
            <li key={suite.id} className="p-0">
              {/* Clickable header */}
              <button
                onClick={() => toggleSuite(suite.id)}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 font-medium text-sm sm:text-base">
                  <StatusIcon ok={suite.notError} />
                  <span>{suite.label}</span>
                </div>
                <span
                  className={`transform transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  ▶
                </span>
              </button>

              {/* Expandable content */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-4">
                  {suite.id === "3" && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {profiles.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs sm:text-sm border rounded-lg px-2 py-1"
                        >
                          <span className="text-gray-700">
                            {p.width} × {p.height}
                          </span>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}

                  {suite.extra && suite.id !== "3" && (
                    <div
                      className="text-xs sm:text-sm text-gray-500 italic mt-2"
                      dangerouslySetInnerHTML={{ __html: suite.extra }}
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TestReport;
