import type { AppState, TestAction, TestSuite, Language } from '@/types';
import { defaultProxyConfig, initialTestSuites, profileArray } from '@/constants/settings';

// ---------- Reducer ----------
export function reducer(state: AppState, action: TestAction): AppState {
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
export function getInitialState(): AppState {
  return {
  currentTestSuite: '-1',
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