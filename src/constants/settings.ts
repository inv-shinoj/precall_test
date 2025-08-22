import { VideoProfile, TestSuite, ProxyConfig } from '@/types';

// Video resolution profiles for testing
export const profileArray: VideoProfile[] = [
  { resolution: '120p_1', width: 160, height: 120, status: 'pending' },
  { resolution: '144p_1', width: 256, height: 144, status: 'pending' },
  { resolution: '240p_1', width: 320, height: 240, status: 'pending' },
  { resolution: '360p_1', width: 640, height: 360, status: 'pending' },
  { resolution: '480p_1', width: 640, height: 480, status: 'pending' },
  { resolution: '720p_1', width: 1280, height: 720, status: 'pending' },
  { resolution: '1080p_1', width: 1920, height: 1080, status: 'pending' }
];

// Agora configuration from environment variables
export const APP_ID = process.env.NEXT_PUBLIC_APP_ID || '';
export const SKEY = process.env.NEXT_PUBLIC_SKEY || '';
export const RKEY = process.env.NEXT_PUBLIC_RKEY || '';
export const RTM_TOKEN = process.env.NEXT_PUBLIC_RTM_TOKEN || '';

// Test configuration defaults
export const DEFAULT_CHANNEL = 'testChannel';
export const DEFAULT_SENDER_ID = 1234561;
export const DEFAULT_RECEIVER_ID = 1234562;
export const DEFAULT_RTM_USER_ID = 'testuser2';

// Test suite definitions
export const initialTestSuites: TestSuite[] = [
  {
    id: '0',
    label: 'browser_compatibility',
    notError: true,
    complete: false,
    extra: ''
  },
  {
    id: '1',
    label: 'microphone',
    notError: true,
    complete: false,
    extra: ''
  },
  {
    id: '2',
    label: 'speaker',
    notError: true,
    complete: false,
    extra: ''
  },
  {
    id: '3',
    label: 'resolution',
    notError: true,
    complete: false,
    extra: ''
  },
  {
    id: '4',
    label: 'connection',
    notError: true,
    complete: false,
    extra: ''
  },
  {
    id: '5',
    label: 'rtm_messaging',
    notError: true,
    complete: false,
    extra: ''
  }
];

// Cloud proxy configuration defaults
export const defaultProxyConfig: ProxyConfig = {
  isEnabled: false,
  mode: 'default'
};

export const proxyConfigs = {
  default: {
    proxyServer: 3,
    turnServer: { mode: 3 }
  },
  fixed: {
    proxyServer: 2,
    turnServer: { mode: 2 }
  }
};

// Test timing configurations (in milliseconds)
export const TEST_TIMEOUTS = {
  BROWSER_CHECK: 3000,
  MICROPHONE_CHECK: 7000,
  RESOLUTION_CHECK: 1000,
  CONNECTIVITY_CHECK: 24000,
  RTM_CHECK: 12000,
  STATS_INTERVAL: 1000,
  RTM_MESSAGE_INTERVAL: 2000
} as const;

// Key resolutions for validation
export const KEY_RESOLUTIONS = [
  { width: 640, height: 480 },   // 480p
  { width: 1280, height: 720 },  // 720p
  { width: 1920, height: 1080 }  // 1080p
];

// Test success thresholds
export const TEST_THRESHOLDS = {
  MINIMUM_VOLUME: 10,
  MINIMUM_SUCCESS_RATE: 0.6,
  RTM_SUCCESS_RATE: 70,
  KEY_RESOLUTIONS_REQUIRED: 2
} as const;

// Network quality thresholds
export const NETWORK_QUALITY = {
  EXCELLENT: {
    minVideoBitrate: 1000,
    minAudioBitrate: 25
  },
  GOOD: {
    minVideoBitrate: 500,
    minAudioBitrate: 20
  },
  FAIR: {
    minVideoBitrate: 100,
    minAudioBitrate: 10
  }
} as const;

// Chart configuration defaults
export const CHART_CONFIG = {
  grid: {
    left: 50
  },
  bitrateSettings: {
    yAxisName: ['Bitrate (kbps)']
  },
  packetLossSettings: {
    yAxisType: ['percent'],
    yAxisName: ['Packet Loss']
  }
} as const;

// Audio file path for speaker test
export const SAMPLE_AUDIO_PATH = '/assets/music.mp3';

// GitHub repository URL
export const GITHUB_URL = 'https://github.com/AgoraIO/Tools/tree/master/TroubleShooting/Agora-WebRTC-Troubleshooting';

// Supported languages
export const SUPPORTED_LANGUAGES = ['zh', 'en'] as const;

// Error codes for debugging
export const ERROR_CODES = {
  BROWSER_NOT_SUPPORTED: 'BROWSER_001',
  MICROPHONE_ACCESS_DENIED: 'MIC_001',
  MICROPHONE_NO_INPUT: 'MIC_002',
  SPEAKER_TEST_FAILED: 'SPK_001',
  CAMERA_ACCESS_DENIED: 'CAM_001',
  RESOLUTION_NOT_SUPPORTED: 'RES_001',
  CONNECTION_FAILED: 'NET_001',
  RTM_LOGIN_FAILED: 'RTM_001',
  RTM_CHANNEL_FAILED: 'RTM_002',
  RTM_MESSAGE_FAILED: 'RTM_003'
} as const;

// Validation functions
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!APP_ID) {
    errors.push('APP_ID is required');
  }
  
  if (!SKEY) {
    errors.push('SKEY is required');
  }
  
  if (!RKEY) {
    errors.push('RKEY is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Profile for modal testing
export const PROFILE_FOR_TRY = [
  {
    resolution: '480p_1',
    isSuccess: false
  },
  {
    resolution: '720p_1',
    isSuccess: false
  },
  {
    resolution: '1080p_1',
    isSuccess: false
  }
];

// Test element IDs for DOM manipulation
export const DOM_IDS = {
  TEST_SEND: 'test-send',
  TEST_RECV: 'test-recv',
  MODAL_VIDEO: 'modal-video',
  SAMPLE_MUSIC: 'sampleMusic'
} as const;