import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { TEST_TIMEOUTS } from '@/constants/settings';

interface BrowserCompatibilityCheckProps {
  testSuites: any[];
  setTestSuites: (suites: any[]) => void;
  handleMicrophoneCheck: () => void;
}

const BrowserCompatibilityCheck: React.FC<BrowserCompatibilityCheckProps> = ({
  testSuites,
  setTestSuites,
  handleMicrophoneCheck,
  
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [browserInfo] = useState(navigator.userAgent.split(' ')[0] || 'Current Browser');

  useEffect(() => {
    handleCompatibilityCheck();
  }, []);

  const handleCompatibilityCheck = () => {
    setTimeout(() => {
      const updatedTestSuites = testSuites.map(suite => {
        if (suite.id === "0") {
          const notError = AgoraRTC.checkSystemRequirements();
          return {
            ...suite,
            notError,
            extra: notError ? "Fully supported" : "Some functions may be limited"
          };
        }
        return suite;
      });
      
      setTestSuites(updatedTestSuites);
      setIsChecking(false);
      
      // Small delay to show result before moving to next test
      setTimeout(() => {
        handleMicrophoneCheck();
      }, TEST_TIMEOUTS.RESOLUTION_CHECK);
    }, TEST_TIMEOUTS.BROWSER_CHECK);
  };

  const currentTestSuite = testSuites.find(suite => suite.id === "0");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg h-full">
          <div className="flex items-start space-x-3">
            <div className="bg-white bg-opacity-20 rounded-full p-2 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">
                Browser Compatibility Check
              </h3>
              <p className="text-blue-100 leading-relaxed">
                Verifying your browser supports all WebRTC features required for audio, video, and real-time communication. This includes media access, peer connections, and codec support.
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">Checking</span>
              <span className="text-blue-600">{browserInfo}</span>
            </h3>
            
            {isChecking ? (
              <div className="space-y-4">
                {/* Animated progress bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full animate-pulse transition-all duration-300 w-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-sm">Analyzing browser capabilities...</span>
                </div>

                {/* Feature checklist */}
                <div className="mt-6 space-y-2">
                  <div className="text-xs text-gray-500 mb-2">Checking features:</div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>WebRTC Support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <span>Media Access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                      <span>Codec Support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                      <span>Network Protocols</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result indicator */}
                <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                  currentTestSuite?.notError 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-orange-50 text-orange-700'
                }`}>
                  <div className="flex-shrink-0">
                    {currentTestSuite?.notError ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {currentTestSuite?.notError ? 'Fully Compatible' : 'Limited Support'}
                    </div>
                    <div className="text-sm mt-1">
                      {currentTestSuite?.extra}
                    </div>
                  </div>
                </div>

                {/* Additional info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <div className="font-medium mb-1">Browser Details:</div>
                  <div>SDK Version: {AgoraRTC.VERSION}</div>
                  <div className="truncate">User Agent: {navigator.userAgent}</div>
                </div>
              </div>
            )}
          </div>

          {/* Progress footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Step 1 of 6</span>
              <span>{isChecking ? 'Testing...' : 'Complete'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserCompatibilityCheck;