// Core test suite types
export interface TestSuite {
  id: string;
  label: string;
  notError: boolean;
  complete?: boolean;
  extra: string;
}

// Video resolution profile types
export interface VideoProfile {
  resolution: string;
  width: number;
  height: number;
  status: 'pending' | 'resolve' | 'reject';
}

// Browser and device information
export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  userAgent: string;
}

// Audio/Video track types for Agora SDK
export interface LocalTracks {
  audioTrack: any; // AgoraRTC.ILocalAudioTrack
  videoTrack: any; // AgoraRTC.ILocalVideoTrack
}

export interface RemoteUser {
  uid: number | string;
  audioTrack?: any;
  videoTrack?: any;
  hasAudio: boolean;
  hasVideo: boolean;
}

// Statistics and metrics types
export interface BitrateData {
  columns: string[];
  rows: BitrateRow[];
}

export interface BitrateRow {
  index: number;
  tVideoBitrate: number | string;
  tAudioBitrate: number | string;
}

export interface PacketLossData {
  columns: string[];
  rows: PacketLossRow[];
}

export interface PacketLossRow {
  index: number;
  tVideoPacketLoss: number | string;
  tAudioPacketLoss: number | string;
}

export interface RTCStats {
  videoBitrate: number;
  audioBitrate: number;
  videoPacketLoss: number;
  audioPacketLoss: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

// RTM (Real-time Messaging) types
export interface RTMStatus {
  login: 'pending' | 'success' | 'failed';
  channel: 'pending' | 'success' | 'failed';
  messaging: 'pending' | 'success' | 'failed';
}

export interface RTMMetrics {
  messagesSent: number;
  messagesReceived: number;
  successRate: number;
  avgLatency: number;
  latencies: number[];
}

export interface RTMTestMessage {
  id: string;
  sentAt: number;
  receivedAt: number;
  latency: number;
}

// Cloud proxy configuration
export interface ProxyConfig {
  isEnabled: boolean;
  mode: 'default' | 'fixed';
  proxyServer?: number;
  turnServer?: {
    mode: number;
  };
}

// Language and internationalization
export type Language = 'zh' | 'en';

export interface I18nTexts {
  toolbar_title: string;
  language: string;
  start_text: string;
  running: string;
  following_step: string;
  cloudProxy: string;
  cloudProxy_enable: string;
  cloudProxy_disable: string;
  cloudProxy_mode: string;
  cloudProxy_default: string;
  cloudProxy_fix: string;
  cloudProxy_tips: string;
  cloudProxy_tips_link: string;
  test_report: string;
  browser_check: string;
  support_desc: string;
  checking: string;
  microphone_check: string;
  microphone_check_desc: string;
  microphone_volume_check_desc: string;
  speacker_check: string;
  speaker_check_desc: string;
  yes: string;
  no: string;
  sample_music: string;
  sample_music_desc: string;
  resolution_check: string;
  resolution_check_desc: string;
  resolution_list: string;
  network_check_desc: string;
  rtm_check: string;
  rtm_check_desc: string;
  rtm_status: string;
  rtm_login_status: string;
  rtm_channel_status: string;
  rtm_message_status: string;
  messages_sent: string;
  messages_received: string;
  success_rate: string;
  avg_latency: string;
  rtm_messaging: string;
  notice: string;
  close: string;
  videoText: string;
  Version: string;
  // Additional text keys from your Vue app
  fully_supported: string;
  some_functions_may_be_limited: string;
  can_barely_hear_you: string;
  microphone_works_well: string;
  speaker_works_well: string;
  speaker_wrong: string;
  support: string;
  not_support: string;
  poor_connection: string;
  bitrate: string;
  Video_Bitrate: string;
  Audio_Bitrate: string;
  packet_loss: string;
  Video_Packet_Loss: string;
  Audio_Packet_Loss: string;
}

// Test configuration and settings
export interface TestConfig {
  appId: string;
  sendKey?: string;
  recvKey?: string;
  rtmToken?: string;
  channel: string;
  senderId: number;
  receiverId: number;
  rtmUserId: string;
}

// Chart configuration
export interface ChartSettings {
  yAxisName?: string[];
  yAxisType?: string[];
  labelMap?: Record<string, string>;
}

export interface ChartGrid {
  left: number;
  right?: number;
  top?: number;
  bottom?: number;
}

// Application state types
export interface AppState {
  currentTestSuite: string;
  testing: boolean;
  language: Language;
  languageDisabled: boolean;
  browserInfo: string;
  sdkVersion: string;
  inputVolume: number;
  renderChart: boolean;
  showVideo: boolean;
  dialog: boolean;
  snackbar: boolean;
  isEnableCloudProxy: boolean;
  fixProxyPort: boolean;
  profiles: VideoProfile[];
  testSuites: TestSuite[];
  bitrateData: BitrateData;
  packetsData: PacketLossData;
  rtmStatus: RTMStatus;
  rtmMetrics: RTMMetrics;
  rtmTestMessages: RTMTestMessage[];
  errMsgForTry: string;
  currentProfile: number;
}

// Action types for state management
export type TestAction = 
  | { type: 'SET_CURRENT_TEST_SUITE'; payload: string }
  | { type: 'SET_TESTING'; payload: boolean }
  | { type: 'SWITCH_LANGUAGE' }
  | { type: 'SET_LANGUAGE_DISABLED'; payload: boolean }
  | { type: 'SET_INPUT_VOLUME'; payload: number }
  | { type: 'SET_RENDER_CHART'; payload: boolean }
  | { type: 'UPDATE_TEST_SUITE'; payload: { id: string; updates: Partial<TestSuite> } }
  | { type: 'UPDATE_PROFILE_STATUS'; payload: { index: number; status: VideoProfile['status'] } }
  | { type: 'ADD_BITRATE_DATA'; payload: BitrateRow }
  | { type: 'ADD_PACKET_DATA'; payload: PacketLossRow }
  | { type: 'UPDATE_RTM_STATUS'; payload: Partial<RTMStatus> }
  | { type: 'UPDATE_RTM_METRICS'; payload: Partial<RTMMetrics> }
  | { type: 'RESET_STATE' }
  | { type: 'SET_PROXY_CONFIG'; payload: Partial<ProxyConfig> };

// Component prop types
export interface TestStepperProps {
  currentStep: string;
  testSuites: TestSuite[];
  onStepClick?: (stepId: string) => void;
}

export interface TestResultsProps {
  testSuites: TestSuite[];
  onRestart: () => void;
}

export interface MediaTestProps {
  onNext: () => void;
  onError: (error: string) => void;
  testSuite: TestSuite;
}

// Agora SDK client types (simplified)
export interface AgoraClients {
  sendClient: any; // AgoraRTC.IAgoraRTCClient
  recvClient: any; // AgoraRTC.IAgoraRTCClient
  rtmClient: any;  // AgoraRTM.RTMClient
}

// Error types
export interface TestError {
  code: string;
  message: string;
  step: string;
  timestamp: number;
}

// Hook return types
export interface UseTestSuiteReturn {
  state: AppState;
  dispatch: React.Dispatch<TestAction>;
  startTest: () => void;
  resetTest: () => void;
  nextStep: () => void;
}

export interface UseAgoraReturn {
  clients: AgoraClients | null;
  localTracks: LocalTracks | null;
  remoteUsers: Record<string, RemoteUser>;
  initialize: (config: TestConfig) => Promise<void>;
  cleanup: () => Promise<void>;
  createLocalTracks: () => Promise<LocalTracks>;
  publishTracks: (tracks: LocalTracks) => Promise<void>;
}

export interface UseRTMReturn {
  rtmClient: any;
  status: RTMStatus;
  metrics: RTMMetrics;
  initialize: (config: TestConfig) => Promise<void>;
  sendMessage: (channelName: string, message: string) => Promise<void>;
  cleanup: () => Promise<void>;
}