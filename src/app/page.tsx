// app/page.tsx
'use client';
import AgoraRTC, { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import React, { useMemo, useReducer, useCallback, useRef } from 'react';
import {
  APP_ID,
  defaultProxyConfig,
  initialTestSuites,
  profileArray,
  SUPPORTED_LANGUAGES,
  DOM_IDS,
} from '@/constants/settings';
import type { AppState, TestAction, TestSuite, Language } from '@/types';

// ---------- Reducer ----------
function reducer(state: AppState, action: TestAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_TEST_SUITE':
      return { ...state, currentTestSuite: action.payload };
    case 'SET_TESTING':
      return { ...state, testing: action.payload };
    case 'SWITCH_LANGUAGE': {
      const next: Language = state.language === 'en' ? 'zh' : 'en';
      return { ...state, language: next };
    }
    case 'SET_LANGUAGE_DISABLED':
      return { ...state, languageDisabled: action.payload };
    case 'SET_RENDER_CHART':
      return { ...state, renderChart: action.payload };
    case 'UPDATE_TEST_SUITE': {
      const { id, updates } = action.payload;
      const testSuites = state.testSuites.map(ts =>
        ts.id === id ? { ...ts, ...updates } : ts
      );
      return { ...state, testSuites };
    }
    case 'UPDATE_PROFILE_STATUS': {
      const { index, status } = action.payload;
      const profiles = state.profiles.map((p, i) =>
        i === index ? { ...p, status } : p
      );
      return { ...state, profiles };
    }
    case 'ADD_BITRATE_DATA':
      return {
        ...state,
        bitrateData: { ...state.bitrateData, rows: [...state.bitrateData.rows, action.payload] },
      };
    case 'ADD_PACKET_DATA':
      return {
        ...state,
        packetsData: { ...state.packetsData, rows: [...state.packetsData.rows, action.payload] },
      };
    case 'UPDATE_RTM_STATUS':
      return { ...state, rtmStatus: { ...state.rtmStatus, ...action.payload } };
    case 'UPDATE_RTM_METRICS':
      return { ...state, rtmMetrics: { ...state.rtmMetrics, ...action.payload } };
    case 'SET_PROXY_CONFIG':
      return {
        ...state,
        isEnableCloudProxy: action.payload.isEnabled ?? state.isEnableCloudProxy,
        fixProxyPort: (action.payload.mode ?? (state.fixProxyPort ? 'fixed' : 'default')) === 'fixed',
      };
    case 'RESET_STATE':
      return getInitialState();
    default:
      return state;
  }
}

// ---------- Initial State ----------
function getInitialState(): AppState {
  return {
    currentTestSuite: '0',
    testing: false,
    language: 'en',
    languageDisabled: false,
    browserInfo: '',
    sdkVersion: '',
    inputVolume: 0,
    renderChart: false,
    showVideo: false,
    dialog: false,
    snackbar: false,
    isEnableCloudProxy: defaultProxyConfig.isEnabled,
    fixProxyPort: defaultProxyConfig.mode === 'fixed',
    profiles: profileArray.map(p => ({ ...p, status: 'pending' })),
    testSuites: initialTestSuites.map(s => ({ ...s })),
    bitrateData: { columns: ['index', 'tVideoBitrate', 'tAudioBitrate'], rows: [] },
    packetsData: { columns: ['index', 'tVideoPacketLoss', 'tAudioPacketLoss'], rows: [] },
    rtmStatus: { login: 'pending', channel: 'pending', messaging: 'pending' },
    rtmMetrics: { messagesSent: 0, messagesReceived: 0, successRate: 0, avgLatency: 0, latencies: [] },
    rtmTestMessages: [],
    errMsgForTry: '',
    currentProfile: 0,
  };
}





// ---------- Page ----------
export default function Page() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const microphoneCheckTimerRef = useRef<number | null>(null);

  // Derived values
  const currentStep = useMemo(
    () => state.testSuites.find(s => s.id === state.currentTestSuite),
    [state.testSuites, state.currentTestSuite]
  );

  // Checks

  // Camera check
  const handleCameraCheck = useCallback(() => {
    console.log("Camera checking...");
    // dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '3' });
  }, []);

  // Speaker check
const handleSpeakerCheck = useCallback(() => {
  dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '2' });
}, []);

const resolveSpeakerCheck = useCallback(() => {
  const testSuiteId = '2';
  const audioEl = document.querySelector<HTMLAudioElement>('#sampleMusic');

  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }

  dispatch({
    type: 'UPDATE_TEST_SUITE',
    payload: {
      id: testSuiteId,
      updates: {
        notError: true,
        extra: 'Speaker works well',
      },
    },
  });

  // Proceed to next step, e.g., camera check
  handleCameraCheck?.();
}, [handleCameraCheck]);

const rejectSpeakerCheck = useCallback(() => {
  const testSuiteId = '2';
  const audioEl = document.querySelector<HTMLAudioElement>('#sampleMusic');

  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }

  dispatch({
    type: 'UPDATE_TEST_SUITE',
    payload: {
      id: testSuiteId,
      updates: {
        notError: false,
        extra: 'Speaker not working properly',
      },
    },
  });

  handleCameraCheck?.();
}, [handleCameraCheck]);


  // Microphone Check
  const handleMicrophoneCheck = useCallback(async () => {
  // Set current test suite to "1"
  dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '1' });
  const testSuiteId = '1';

  try {
    // Create microphone audio track
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localAudioTrackRef.current = localAudioTrack;

    let totalVolume = 0;
    let sampleCount = 0;

    // Monitor audio level every 100ms
    microphoneCheckTimerRef.current = window.setInterval(() => {
      if (!localAudioTrackRef.current) return;
      const volumeLevel = localAudioTrackRef.current.getVolumeLevel();
      const inputVolume = Math.floor(volumeLevel * 100);
      totalVolume += inputVolume;
      sampleCount++;

      // Optionally, you can store the latest inputVolume in state if you want UI feedback
      // dispatch({ type: 'SET_INPUT_VOLUME', payload: inputVolume });
    }, 100);

    // Run check for 7 seconds
    setTimeout(() => {
      if (microphoneCheckTimerRef.current !== null) {
        window.clearInterval(microphoneCheckTimerRef.current);
        microphoneCheckTimerRef.current = null;
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      const averageVolume = sampleCount > 0 ? totalVolume / sampleCount : 0;

      dispatch({
        type: 'UPDATE_TEST_SUITE',
        payload: {
          id: testSuiteId,
          updates: {
            notError: averageVolume >= 10,
            extra: averageVolume < 10 ? 'Can barely hear you' : 'Microphone works well',
          },
        },
      });

      // Proceed to speaker check (stub for now)
      handleSpeakerCheck();
    }, 7000);

  } catch (error: any) {
    dispatch({
      type: 'UPDATE_TEST_SUITE',
      payload: {
        id: testSuiteId,
        updates: {
          notError: false,
          extra: error.message,
        },
      },
    });

    handleSpeakerCheck();
  }
}, []);

  // Compatibility Check
  const handleCompatibilityCheck = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '0' });
    const testSuiteId = '0';

    setTimeout(() => {
      const isSupported = AgoraRTC.checkSystemRequirements();

      dispatch({
        type: 'UPDATE_TEST_SUITE',
        payload: {
          id: testSuiteId,
          updates: {
            notError: isSupported,
            extra: isSupported ? 'Fully supported' : 'Some functions may be limited',
          },
        },
      });

      handleMicrophoneCheck();
    }, 3000);
  }, [handleMicrophoneCheck]);


  // Handlers
  const startTest = useCallback(() => {
    if (!APP_ID) {
      // We’ll surface better validation in step 2
      console.error('APP_ID missing. Set NEXT_PUBLIC_APP_ID.');
    }
    dispatch({ type: 'SET_TESTING', payload: true });
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '0' });
    handleCompatibilityCheck();
  }, []);

  const resetTest = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const switchLanguage = useCallback(() => {
    dispatch({ type: 'SWITCH_LANGUAGE' });
  }, []);

  const toggleCloudProxy = useCallback(() => {
    dispatch({
      type: 'SET_PROXY_CONFIG',
      payload: { isEnabled: !state.isEnableCloudProxy, mode: state.fixProxyPort ? 'fixed' : 'default' },
    });
  }, [state.isEnableCloudProxy, state.fixProxyPort]);

  const setProxyModeFixed = useCallback((fixed: boolean) => {
    dispatch({ type: 'SET_PROXY_CONFIG', payload: { mode: fixed ? 'fixed' : 'default' } });
  }, []);

  const onStepClick = useCallback((stepId: string) => {
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: stepId });
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Toolbar */}
      <header className="flex items-center justify-between gap-4 border-b pb-4 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">Agora Precall Test</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={switchLanguage}
            disabled={state.languageDisabled}
            className="px-3 py-1 rounded border hover:bg-gray-50"
          >
            Language: {state.language.toUpperCase()}
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm">Cloud Proxy</label>
            <input
              type="checkbox"
              checked={state.isEnableCloudProxy}
              onChange={toggleCloudProxy}
              className="h-4 w-4"
            />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={state.fixProxyPort ? 'fixed' : 'default'}
              onChange={(e) => setProxyModeFixed(e.target.value === 'fixed')}
              disabled={!state.isEnableCloudProxy}
            >
              <option value="default">default</option>
              <option value="fixed">fixed</option>
            </select>
          </div>

          <button
            type="button"
            onClick={startTest}
            className="px-3 py-1 rounded bg-black text-white hover:opacity-90"
          >
            {state.testing ? 'Restart' : 'Start'}
          </button>

          {state.testing && (
            <button
              type="button"
              onClick={resetTest}
              className="px-3 py-1 rounded border hover:bg-gray-50"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="grid md:grid-cols-[260px,1fr] gap-6">
        {/* Stepper */}
        <nav className="border rounded-lg p-3">
          <ol className="space-y-1">
            {state.testSuites.map((s: TestSuite) => {
              const active = s.id === state.currentTestSuite;
              const statusClass = s.complete ? 'text-green-700' : s.notError ? 'text-gray-700' : 'text-red-700';
              return (
                <li key={s.id}>
                  <button
                    onClick={() => onStepClick(s.id)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${active ? 'bg-gray-100' : ''}`}
                  >
                    <div className={`text-sm font-medium ${statusClass}`}>
                      {s.label.replaceAll('_', ' ')}
                    </div>
                    {s.extra ? <div className="text-xs text-gray-500">{s.extra}</div> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step Content (placeholder for now) */}
        {/* Step Content */}
<section className="border rounded-lg p-4 min-h-[320px]">
  <h2 className="text-lg font-semibold mb-3">
    Step: {currentStep?.label ?? 'unknown'}
  </h2>

  {currentStep?.id === '2' ? (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Speaker description + buttons */}
      <div className="flex-1 border rounded-lg p-4 bg-blue-100">
        <p className="mb-4">
          Please listen to the sample audio and confirm if you can hear it clearly.
        </p>
        <div className="flex gap-2">
          <button
            onClick={resolveSpeakerCheck}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Yes
          </button>
          <button
            onClick={rejectSpeakerCheck}
            className="px-4 py-2 rounded border"
          >
            No
          </button>
        </div>
      </div>

      {/* Sample Audio */}
      <div className="flex-1 border rounded-lg p-4">
        <audio id="sampleMusic" controls className="w-full">
          <source src="music.mp3" type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  ) : (
    <p className="text-sm text-gray-600">
      This is the placeholder for the actual test component. In Step 2 we’ll wire real logic:
      <br />• Browser/permission checks (step 0)
      <br />• Mic & Speaker tests (steps 1–2)
      <br />• Resolution tests (step 3)
      <br />• Connectivity stats (step 4)
      <br />• RTM messaging (step 5)
    </p>
  )}

  {/* Hidden test elements for Agora SDK (keep in DOM) */}
  <div id={DOM_IDS.TEST_SEND} className="fixed -right-full w-[160px] h-[90px]" />
  <div id={DOM_IDS.TEST_RECV} className="fixed -right-full w-[160px] h-[90px]" />
</section>

      </div>

      {/* Footer (optional – layout.tsx might already have one) */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        {`APP_ID set: ${APP_ID ? 'yes' : 'no'}`} • Languages: {SUPPORTED_LANGUAGES.join(', ').toUpperCase()}
      </footer>
    </main>
  );
}
