// app/page.tsx
'use client';
import AgoraRTC, { IMicrophoneAudioTrack, ICameraVideoTrack, IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import React, { useMemo, useReducer, useCallback, useRef, useEffect } from 'react';
import {
  APP_ID,
  defaultProxyConfig,
  initialTestSuites,
  profileArray,
  SUPPORTED_LANGUAGES,
  DOM_IDS,
  DEFAULT_CHANNEL,
  DEFAULT_RECEIVER_ID,
  DEFAULT_SENDER_ID,
  DEFAULT_RTM_USER_ID,
  RKEY,
  SKEY
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

  const microphoneCheckTimerRef = useRef<number | null>(null);
  const sendClientRef = useRef<IAgoraRTCClient | null>(null);
  const recvClientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const remoteUsersRef = useRef<Record<string, any>>({});
  const connectivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);
  const rtmClientRef = useRef<any>(null);
  const rtmTestIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep state ref updated
  useEffect(() => {
  stateRef.current = state;
}, [state]);

  const channel = DEFAULT_CHANNEL;
  const sendId = DEFAULT_SENDER_ID;
  const recvId = DEFAULT_RECEIVER_ID;
  const rtmUserId = DEFAULT_RTM_USER_ID;

  // Derived values
  const currentStep = useMemo(
    () => state.testSuites.find(s => s.id === state.currentTestSuite),
    [state.testSuites, state.currentTestSuite]
  );

  
  // Initialize send client
  const initSendClient = useCallback(async () => {
  if (!sendClientRef.current) {
    sendClientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
  }
  const client = sendClientRef.current!;
  try {
    await client.setClientRole("host");
    console.error(APP_ID);
    await client.join(APP_ID, channel, SKEY, sendId);

    localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "1080p_1" });

    localVideoTrackRef.current.play(DOM_IDS.TEST_SEND);
    await client.publish([localAudioTrackRef.current, localVideoTrackRef.current]);
  } catch (err: any) {
    console.error(APP_ID);
    throw new Error(err.message || err);
  }
}, [channel, rtmUserId, sendId]);

  // Initialize receive client
  const initRecvClient = useCallback(async () => {
  if (!recvClientRef.current) {
    recvClientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
  }
  const client = recvClientRef.current!;
  try {
    await client.setClientRole("audience");
    await client.join(APP_ID, channel, RKEY, recvId);

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "video" && user.videoTrack) {
        user.videoTrack.play(DOM_IDS.TEST_RECV);
        remoteUsersRef.current[user.uid] = user;
      }

      if (mediaType === "audio" && user.audioTrack) {
        user.audioTrack.setVolume(0); // mute remote audio
      }
    });

    client.on("user-unpublished", (user) => {
      delete remoteUsersRef.current[user.uid];
      if (state.currentTestSuite === "4" && state.testing) {
        console.warn("User unpublished during active test");
        if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
        dispatch({ type: "UPDATE_TEST_SUITE", payload: { id: "4", updates: { notError: false, extra: "User disconnected during test" } } });
      }
    });

    client.on("connection-state-change", (curState) => {
      if (state.currentTestSuite === "4" && state.testing && (curState === "DISCONNECTED" || curState === "DISCONNECTING")) {
        console.warn("Unexpected disconnect");
        if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
        dispatch({ type: "UPDATE_TEST_SUITE", payload: { id: "4", updates: { notError: false, extra: "Unexpected connection lost" } } });
      }
    });
  } catch (err: any) {
    throw new Error(err.message || err);
  }
}, [channel, state.currentTestSuite, state.testing, recvId]);

  /* Checks */

  // handle rtm check
  const finishRTMTest = useCallback(() => {
    if (rtmTestIntervalRef.current) clearInterval(rtmTestIntervalRef.current);
    const testSuiteId = '5';
    const rtmStatus = stateRef.current.rtmStatus;
    const rtmMetrics = stateRef.current.rtmMetrics;
    let testSuite = stateRef.current.testSuites.find(s => s.id === testSuiteId);
    let extra = '';
    let notError = false;
    if (rtmStatus.login === 'success' && rtmStatus.channel === 'success') {
      if (rtmMetrics.messagesSent > 0) {
        const finalSuccessRate = Math.round((rtmMetrics.messagesReceived / rtmMetrics.messagesSent) * 100);
        if (finalSuccessRate >= 70) {
          notError = true;
          extra = `RTM Login: Success</br>Channel Join: Success</br>Messages Sent: ${rtmMetrics.messagesSent}</br>Messages Received: ${rtmMetrics.messagesReceived}</br>Success Rate: ${finalSuccessRate}%</br>Average Latency: ${rtmMetrics.avgLatency}ms</br><strong>RTM functionality working well</strong>`;
        } else {
          extra = `RTM messaging has issues</br>Success Rate: ${finalSuccessRate}% (below 70% threshold)</br>Messages Sent: ${rtmMetrics.messagesSent}</br>Messages Received: ${rtmMetrics.messagesReceived}`;
        }
      } else {
        extra = 'No RTM messages were sent during test';
      }
    } else {
      extra = testSuite?.extra || 'RTM login or channel join failed';
    }
    dispatch({
      type: 'UPDATE_TEST_SUITE',
      payload: { id: testSuiteId, updates: { notError, extra } },
    });
    setTimeout(() => {
      dispatch({ type: 'SET_TESTING', payload: false });
      dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '6' });
      // Optionally: cleanup RTM client here
      setTimeout(() => {
        dispatch({ type: 'SET_RENDER_CHART', payload: false });
      }, 1500);
    }, 2000);
  }, [dispatch]);

  // handle rtm check
  const handleRTMCheck = useCallback(async () => {
    const testSuiteId = '5';
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: testSuiteId });
    dispatch({ type: 'UPDATE_RTM_STATUS', payload: { login: 'pending', channel: 'pending', messaging: 'pending' } });
    dispatch({ type: 'UPDATE_RTM_METRICS', payload: { messagesSent: 0, messagesReceived: 0, successRate: 0, avgLatency: 0, latencies: [] } });
    try {
      if (!AgoraRTM || !AgoraRTM.RTM) throw new Error('AgoraRTM SDK v2.x RTM class is not loaded');
      rtmClientRef.current = new AgoraRTM.RTM(APP_ID, rtmUserId);
      // Login
      try {
        await rtmClientRef.current.login({ token: process.env.NEXT_PUBLIC_RTM_TOKEN || null, uid: rtmUserId });
        dispatch({ type: 'UPDATE_RTM_STATUS', payload: { login: 'success' } });
      } catch (error: any) {
        dispatch({ type: 'UPDATE_RTM_STATUS', payload: { login: 'failed' } });
        dispatch({ type: 'UPDATE_TEST_SUITE', payload: { id: testSuiteId, updates: { notError: false, extra: `Login failed: ${error.message}` } } });
        finishRTMTest();
        return;
      }
      // Channel subscribe
      const channelName = channel + '_rtm';
      try {
        rtmClientRef.current.addEventListener('message', (eventArgs: any) => {
          if (eventArgs.channelName === channelName) {
            const message = eventArgs.message;
            // Find test message and update metrics
            let testMsg = stateRef.current.rtmTestMessages.find((msg: any) => message.includes(msg.id) && msg.receivedAt === 0);
            if (testMsg) {
              testMsg.receivedAt = Date.now();
              testMsg.latency = testMsg.receivedAt - testMsg.sentAt;
              const newLatencies = [...stateRef.current.rtmMetrics.latencies, testMsg.latency];
              const avgLatency = Math.round(newLatencies.reduce((a, b) => a + b, 0) / newLatencies.length);
              dispatch({ type: 'UPDATE_RTM_METRICS', payload: { messagesReceived: stateRef.current.rtmMetrics.messagesReceived + 1, latencies: newLatencies, avgLatency } });
              const successRate = Math.round((stateRef.current.rtmMetrics.messagesReceived + 1) / stateRef.current.rtmMetrics.messagesSent * 100);
              dispatch({ type: 'UPDATE_RTM_METRICS', payload: { successRate } });
            }
          }
        });
        await rtmClientRef.current.subscribe(channelName);
        dispatch({ type: 'UPDATE_RTM_STATUS', payload: { channel: 'success' } });
      } catch (error: any) {
        dispatch({ type: 'UPDATE_RTM_STATUS', payload: { channel: 'failed' } });
        dispatch({ type: 'UPDATE_TEST_SUITE', payload: { id: testSuiteId, updates: { notError: false, extra: `Channel subscribe failed: ${error.message}` } } });
        finishRTMTest();
        return;
      }
      // Messaging test
      dispatch({ type: 'UPDATE_RTM_STATUS', payload: { messaging: 'pending' } });
      let messageCount = 0;
      rtmTestIntervalRef.current = setInterval(async () => {
        try {
          messageCount++;
          const messageId = `test_${Date.now()}_${messageCount}`;
          const testMessage = { id: messageId, sentAt: Date.now(), receivedAt: 0, latency: 0 };
          stateRef.current.rtmTestMessages.push(testMessage);
          await rtmClientRef.current.publish(channelName, `RTM Test Message ${messageId}`);
          dispatch({ type: 'UPDATE_RTM_METRICS', payload: { messagesSent: stateRef.current.rtmMetrics.messagesSent + 1 } });
        } catch (error) {
          // handle error
        }
      }, 2000);
      setTimeout(() => {
        finishRTMTest();
      }, 12000);
    } catch (error: any) {
      dispatch({ type: 'UPDATE_RTM_STATUS', payload: { login: 'failed', channel: 'failed', messaging: 'failed' } });
      dispatch({ type: 'UPDATE_TEST_SUITE', payload: { id: testSuiteId, updates: { notError: false, extra: `RTM test failed: ${error.message}` } } });
      finishRTMTest();
    }
  }, [dispatch, channel, rtmUserId, finishRTMTest]);

  // Handle connectivity check
const handleConnectivityCheck = useCallback(async () => {
  const testSuiteId = "4";
  dispatch({ type: "SET_CURRENT_TEST_SUITE", payload: testSuiteId });

  const statsIndexRef = { current: 1 };

  try {
    // Initialize clients
    await initRecvClient();
    await initSendClient();

    dispatch({ type: "SET_RENDER_CHART", payload: true });

    // Start collecting stats every 1s
    connectivityIntervalRef.current = setInterval(async () => {
      try {
        if (!recvClientRef.current) return;

        const rtcStats = await recvClientRef.current.getRTCStats();
        const remoteAudioStats = await recvClientRef.current.getRemoteAudioStats();
        const remoteVideoStats = await recvClientRef.current.getRemoteVideoStats();

        let videoBitrate = 0;
        let audioBitrate = 0;
        let videoPacketLoss = 0;
        let audioPacketLoss = 0;
        console.log(remoteVideoStats, remoteAudioStats)
        Object.values(remoteVideoStats).forEach(userStats => {
          videoBitrate += userStats.receiveBitrate || 0;
          videoPacketLoss = Math.max(videoPacketLoss, userStats.packetLossRate || 0);
        });

        Object.values(remoteAudioStats).forEach(userStats => {
          console.log("userstats", userStats)
          audioBitrate += userStats.receiveBitrate || 0;
          console.log("audioBitrate Object:", audioBitrate)
          audioPacketLoss = Math.max(audioPacketLoss, userStats.packetLossRate || 0);
        });
        console.log("audioBitrate outside object:", audioBitrate);
        
        dispatch({
          type: "ADD_BITRATE_DATA",
          payload: {
            index: statsIndexRef.current,
            tVideoBitrate: (videoBitrate / 1000).toFixed(2),
            tAudioBitrate: (audioBitrate / 1000).toFixed(2)
          }
        });

        dispatch({
          type: "ADD_PACKET_DATA",
          payload: {
            index: statsIndexRef.current,
            tVideoPacketLoss: videoPacketLoss,
            tAudioPacketLoss: audioPacketLoss
          }
        });
        console.log("videoPacketLoss:", videoPacketLoss, "audioPacketLoss:", audioPacketLoss);

        statsIndexRef.current += 1;
      } catch (err) {
        console.warn("Failed to get stats:", err);
      }
    }, 1000);

  } catch (err: any) {
    dispatch({
      type: "UPDATE_TEST_SUITE",
      payload: { id: testSuiteId, updates: { notError: false, extra: err.message || String(err) } }
    });
    return;
  }

  // Stop test after 24 seconds
  setTimeout(() => {
    if (connectivityIntervalRef.current) clearInterval(connectivityIntervalRef.current);
    dispatch({ type: "SET_TESTING", payload: false });

    setTimeout(() => {
      // Use stateRef.current instead of state to get the most current values
      const bitrateRows = stateRef.current.bitrateData.rows;
      const packetRows = stateRef.current.packetsData.rows;

      console.log("Current bitrate rows:", bitrateRows);
      console.log("Current packet rows:", packetRows);

      let extra = "";
      let notError = true;

      if (bitrateRows.length <= 1 || packetRows.length <= 1) {
        extra = "Poor connection: insufficient data";
        notError = false;
      } else {
        const lastBitrate = bitrateRows[bitrateRows.length - 1];
        const lastPacket = packetRows[packetRows.length - 1];

        let videoBitrate = Number(lastBitrate.tVideoBitrate);
        let audioBitrate = Number(lastBitrate.tAudioBitrate);
        let videoPacketLoss = lastPacket.tVideoPacketLoss;
        let audioPacketLoss = lastPacket.tAudioPacketLoss;

        if (videoBitrate <= 0 || audioBitrate <= 0) {
          extra += "<strong>Connection failed: No data transmission</strong>";
          notError = false;
        } else {
          let quality = "Good";
          if (videoBitrate < 100 || audioBitrate < 10) quality = "Poor";
          else if (videoBitrate < 500 || audioBitrate < 20) quality = "Fair";
          else if (videoBitrate > 1000 && audioBitrate > 25) quality = "Excellent";

          videoPacketLoss = videoPacketLoss !== "-" ? (Number(videoPacketLoss) * 100).toFixed(2) : "-";
          audioPacketLoss = audioPacketLoss !== "-" ? (Number(audioPacketLoss) * 100).toFixed(2) : "-";

          extra = `
            Video Bitrate: ${videoBitrate} kbps </br>
            Audio Bitrate: ${audioBitrate} kbps </br>
            Video Packet Loss: ${videoPacketLoss} % </br>
            Audio Packet Loss: ${audioPacketLoss} % </br>
            <strong>Connection Quality: ${quality}</strong>
          `;
        }
      }

      dispatch({
        type: "UPDATE_TEST_SUITE",
        payload: { id: testSuiteId, updates: { extra, notError } }
      });

      // Proceed to RTM test
      handleRTMCheck();
    }, 1500);
  }, 24000);

}, [initRecvClient, initSendClient, handleRTMCheck]);

  const checkProfile = useCallback(
  async (profile: { width: number; height: number; resolution: string; status?: string }) => {
    try {
      // Stop & close existing track
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      // Create new video track with specific profile
      localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: profile.resolution,
      });

      // Play the video track
      localVideoTrackRef.current.play('test-send');

      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          const videoElement = document.querySelector<HTMLVideoElement>('#test-send video');

          if (videoElement) {
            const videoArea = videoElement.videoWidth * videoElement.videoHeight;
            const profileArea = profile.width * profile.height;

            if (videoArea === profileArea) {
              profile.status = 'resolve';
              resolve();
            } else {
              profile.status = 'reject';
              reject(new Error('Resolution mismatched'));
            }
          } else {
            profile.status = 'reject';
            reject(new Error('Video element not found'));
          }
        }, 1000);
      });
    } catch (error: any) {
      profile.status = 'reject';
      throw error;
    }
  },
  []
  );

  // Camera check
  const handleCameraCheck = useCallback(async () => {
  const testSuiteId = '3';
  dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: testSuiteId });

  let successCount = 0;
  const totalCount = state.profiles.length;
  const errors: string[] = [];

  for (const [index, profile] of state.profiles.entries()) {
    try {
      await checkProfile(profile);
      successCount++;
    } catch (error: any) {
      console.warn(
        `Resolution ${profile.width}x${profile.height} failed:`,
        error?.message ?? error
      );
      errors.push(
        `${profile.width}x${profile.height}: ${error?.message ?? error}`
      );
    } finally {
      // Stop & clean video track
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
    }
  }

  // Build detailed results display
  const details = state.profiles.map(profile => {
    const supportText = profile.status === 'resolve' ? 'Supported' : 'Not Supported';
    return `${profile.width} * ${profile.height} ${supportText}`;
  }).join('<br/>');

  // Determine overall success
  const keyResolutions = [
    { width: 640, height: 480 },   // 480p
    { width: 1280, height: 720 },  // 720p
    { width: 1920, height: 1080 }  // 1080p
  ];

  const keyResolutionsWorking = state.profiles.filter(profile =>
    keyResolutions.some(
      key => profile.width === key.width && profile.height === key.height && profile.status === 'resolve'
    )
  ).length;

  const successRate = totalCount > 0 ? successCount / totalCount : 0;

  const overallNotError = keyResolutionsWorking >= 2 || successRate >= 0.6;

  const summaryText = overallNotError
    ? `Summary: ${successCount}/${totalCount} resolutions supported (${Math.round(successRate * 100)}%)`
    : `Too few resolutions supported: ${successCount}/${totalCount} (${Math.round(successRate * 100)}%)`;

  dispatch({
    type: 'UPDATE_TEST_SUITE',
    payload: {
      id: testSuiteId,
      updates: {
        extra: details + '<br/><br/><strong>' + summaryText + '</strong>',
        notError: overallNotError,
      },
    },
  });

  if (errors.length > 0) {
    console.warn('Resolution test errors:', errors);
  }

  // Move to connectivity check after a short delay
  setTimeout(() => {
    handleConnectivityCheck?.();
  }, 1500);
}, [state.profiles, checkProfile, handleConnectivityCheck]);

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
