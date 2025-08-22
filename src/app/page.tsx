'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardActions } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Stepper, { StepContent } from '@/components/ui/Stepper';
import { initialTestSuites, GITHUB_URL, validateConfig } from '@/constants/settings';
import { TestSuite } from '@/types';

// Header component
function Header({ onStart, testing }: { onStart: () => void; testing: boolean }) {
  return (
    <div className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Agora WebRTC Troubleshooting</h1>
            <a 
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-blue-700 transition-colors"
              aria-label="View GitHub Repository"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={onStart}
              variant={testing ? 'error' : 'success'}
              disabled={testing}
            >
              {testing ? 'Running Tests...' : 'Start Test'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Footer component
function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-right text-sm text-gray-600">
          SDK Version: Coming Soon
        </div>
      </div>
    </footer>
  );
}

// Cloud proxy configuration component
function ProxyConfig({ 
  isEnabled, 
  fixedMode, 
  onToggleProxy, 
  onToggleMode 
}: {
  isEnabled: boolean;
  fixedMode: boolean;
  onToggleProxy: (enabled: boolean) => void;
  onToggleMode: (fixed: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cloud Proxy
        </label>
        <div className="flex space-x-2">
          <Button
            variant={isEnabled ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onToggleProxy(true)}
          >
            Enable
          </Button>
          <Button
            variant={!isEnabled ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onToggleProxy(false)}
          >
            Disable
          </Button>
        </div>
      </div>

      {isEnabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proxy Mode
            </label>
            <div className="flex space-x-2">
              <Button
                variant={!fixedMode ? 'primary' : 'secondary'}
                size="small"
                onClick={() => onToggleMode(false)}
              >
                Default
              </Button>
              <Button
                variant={fixedMode ? 'primary' : 'secondary'}
                size="small"
                onClick={() => onToggleMode(true)}
              >
                Fixed Port
              </Button>
            </div>
          </div>

          {fixedMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700">
                  Fixed port mode requires specific firewall configuration. 
                  <a 
                    href="https://docs.agora.io/cn/Audio%20Broadcast/cloud_proxy_web?platform=Web" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline ml-1"
                  >
                    Learn more
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Start page component
function StartPage({ onStart }: { onStart: () => void }) {
  const [isEnableCloudProxy, setIsEnableCloudProxy] = useState(false);
  const [fixProxyPort, setFixProxyPort] = useState(false);

  return (
    <div className="max-w-2xl mx-auto mt-16">
      <Card variant="elevated">
        <CardHeader>
          <h2 className="text-2xl font-semibold">WebRTC Diagnostic Tests</h2>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <ProxyConfig
            isEnabled={isEnableCloudProxy}
            fixedMode={fixProxyPort}
            onToggleProxy={setIsEnableCloudProxy}
            onToggleMode={setFixProxyPort}
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              The following tests will be performed:
            </h3>
            <ul className="space-y-2">
              {initialTestSuites.map((suite) => (
                <li key={suite.id} className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {suite.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardActions>
          <Button onClick={onStart} variant="primary" size="large">
            Start Diagnostic Tests
          </Button>
        </CardActions>
      </Card>
    </div>
  );
}

// Test results page
function TestResults({ testSuites, onRestart }: { testSuites: TestSuite[]; onRestart: () => void }) {
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card variant="elevated">
        <CardHeader color="info">
          <h2 className="text-2xl font-semibold">Test Report</h2>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {testSuites.map((suite) => (
              <div key={suite.id} className="border border-gray-200 rounded-lg">
                <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                  <div className="flex-shrink-0 mr-4">
                    {suite.notError ? (
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {suite.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    {suite.extra && (
                      <div 
                        className="mt-2 text-sm text-gray-600"
                        dangerouslySetInnerHTML={{ __html: suite.extra }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardActions>
          <Button onClick={onRestart} variant="primary">
            Run Tests Again
          </Button>
        </CardActions>
      </Card>
    </div>
  );
}

// Main page component
export default function Home() {
  const [currentTestSuite, setCurrentTestSuite] = useState('-1');
  const [testing, setTesting] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>(initialTestSuites);

  const handleStart = () => {
    // Validate configuration
    const config = validateConfig();
    if (!config.isValid) {
      alert(`Configuration Error:\n${config.errors.join('\n')}`);
      return;
    }

    setTesting(true);
    setCurrentTestSuite('0');
    // TODO: Initialize Agora clients and start test sequence
  };

  const handleRestart = () => {
    setCurrentTestSuite('-1');
    setTesting(false);
    setTestSuites(initialTestSuites.map(suite => ({ 
      ...suite, 
      notError: true, 
      complete: false, 
      extra: '' 
    })));
  };

  // Show start page
  if (currentTestSuite === '-1') {
    return (
      <>
        <Header onStart={handleStart} testing={testing} />
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <StartPage onStart={handleStart} />
        </main>
        <Footer />
      </>
    );
  }

  // Show results page
  if (currentTestSuite === '6' || parseInt(currentTestSuite) > 5) {
    return (
      <>
        <Header onStart={handleStart} testing={testing} />
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <TestResults testSuites={testSuites} onRestart={handleRestart} />
        </main>
        <Footer />
      </>
    );
  }

  // Show test progress page
  return (
    <>
      <Header onStart={handleStart} testing={testing} />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Stepper 
            currentStep={currentTestSuite}
            testSuites={testSuites}
            className="mb-8"
          />
          
          <StepContent>
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Test Suite {parseInt(currentTestSuite) + 1}
              </h2>
              <p className="text-gray-600">
                Individual test components will be rendered here
              </p>
              <div className="mt-8">
                <Button onClick={() => setCurrentTestSuite((parseInt(currentTestSuite) + 1).toString())}>
                  Next Test (Temporary)
                </Button>
              </div>
            </div>
          </StepContent>

          {/* Hidden test elements for Agora SDK */}
          <div id="test-send" className="fixed -right-full w-160 h-90" />
          <div id="test-recv" className="fixed -right-full w-160 h-90" />
        </div>
      </main>
      <Footer />
    </>
  );
}