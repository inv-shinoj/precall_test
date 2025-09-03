
// app/page.tsx
'use client';
import AgoraRTC, { IMicrophoneAudioTrack, ICameraVideoTrack, IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { checkProfile, destructAll } from '@/utils/agoraUtils';
import AgoraRTM from 'agora-rtm-sdk';
import React, { useMemo, useReducer, useCallback, useRef, useEffect } from 'react';
import Toolbar from '@/components/ui/Toolbar';
import Stepper from '@/components/ui/Stepper';
import StepContent from '@/components/ui/StepContent';
import TestReport from '@/components/ui/TestReport';
import Footer from '@/components/ui/Footer';
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
  SKEY,
  TEST_TIMEOUTS,
  KEY_RESOLUTIONS,
  TEST_THRESHOLDS,
  NETWORK_QUALITY
} from '@/constants/settings';
import { reducer, getInitialState } from '@/state/reducer';


// ---------- Page ----------
export default function Page() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  // Snackbar/Toast state
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');
  // Dialog/Modal state for retry
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMsg, setDialogMsg] = React.useState('');

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
  const rtmMessageListenerRef = useRef<any>(null);
  const rtmTestMessagesRef = useRef<any[]>([]);

  // Keep state ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);


  // Clean up all Agora/RTM resources and timers (moved to utils)
  const destructAllCallback = useCallback(async () => {
    await destructAll({
      localAudioTrackRef,
      localVideoTrackRef,
      sendClientRef,
      recvClientRef,
      rtmClientRef,
      detectIntervalRef,
      connectivityIntervalRef,
      rtmTestIntervalRef,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destructAllCallback();
      setSnackbarOpen(false);
      setDialogOpen(false);
    };
  }, [destructAllCallback]);

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
    try {
      if (!sendClientRef.current) {
        sendClientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      }
      const client = sendClientRef.current!;
      await client.setClientRole("host");
      await client.join(APP_ID, channel, SKEY, sendId);

      localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "1080p_1" });

      localVideoTrackRef.current.play(DOM_IDS.TEST_SEND);
      await client.publish([localAudioTrackRef.current, localVideoTrackRef.current]);
    } catch (err: any) {
      // Log error and rethrow for upstream handling
      console.error("Error initializing send client:", err);
      throw new Error(err.message || err);
    }
  }, [channel, rtmUserId, sendId]);

  // Initialize receive client
  const initRecvClient = useCallback(async () => {
    try {
      if (!recvClientRef.current) {
        recvClientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      }
      const client = recvClientRef.current!;
      await client.setClientRole("audience");
      await client.join(APP_ID, channel, RKEY, recvId);

      client.on("user-published", async (user, mediaType) => {
        try {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && user.videoTrack) {
            user.videoTrack.play(DOM_IDS.TEST_RECV);
            remoteUsersRef.current[user.uid] = user;
          }
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.setVolume(0); // mute remote audio
          }
        } catch (err) {
          console.error("Error subscribing to user media:", err);
        }
      });

      client.on("user-unpublished", (user) => {
        delete remoteUsersRef.current[user.uid];
        if (state.currentTestSuite === "4" && state.testing) {
          if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
          dispatch({ type: "UPDATE_TEST_SUITE", payload: { id: "4", updates: { notError: false, extra: "User disconnected during test" } } });
        }
      });

      client.on("connection-state-change", (curState) => {
        if (state.currentTestSuite === "4" && state.testing && (curState === "DISCONNECTED" || curState === "DISCONNECTING")) {
          if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
          dispatch({ type: "UPDATE_TEST_SUITE", payload: { id: "4", updates: { notError: false, extra: "Unexpected connection lost" } } });
        }
      });
    } catch (err: any) {
      console.error("Error initializing receive client:", err);
      throw new Error(err.message || err);
    }
  }, [channel, state.currentTestSuite, state.testing, recvId]);

  /* Checks */

  // handle rtm check
  const finishRTMTest = useCallback(() => {
    const testSuiteId = '5';
    const rtmStatus = stateRef.current.rtmStatus;
    const rtmMetrics = stateRef.current.rtmMetrics;
    let testSuite = stateRef.current.testSuites.find(s => s.id === testSuiteId);
    let extra = '';
    let notError = false;
    if (rtmStatus.login === 'success' && rtmStatus.channel === 'success') {
      if (rtmMetrics.messagesSent > 0) {
        const finalSuccessRate = Math.round((rtmMetrics.messagesReceived / rtmMetrics.messagesSent) * 100);
        if (finalSuccessRate >= TEST_THRESHOLDS.RTM_SUCCESS_RATE) {
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
  dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: 'final' });
      // Optionally: cleanup RTM client here
      setTimeout(() => {
        dispatch({ type: 'SET_RENDER_CHART', payload: false });
      }, 1500);
    }, TEST_TIMEOUTS.RTM_MESSAGE_INTERVAL);
  }, [dispatch]);

  // handle rtm check
  const handleRTMCheck = useCallback(async () => {
    const testSuiteId = '5';
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: testSuiteId });
    dispatch({ type: 'UPDATE_RTM_STATUS', payload: { login: 'pending', channel: 'pending', messaging: 'pending' } });
    dispatch({ type: 'UPDATE_RTM_METRICS', payload: { messagesSent: 0, messagesReceived: 0, successRate: 0, avgLatency: 0, latencies: [] } });
    rtmTestMessagesRef.current = [];
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
      rtmMessageListenerRef.current = (eventArgs: any) => {
        if (eventArgs.channelName === channelName) {
          const message = eventArgs.message;
          // Find test message and update metrics (no direct mutation)
          const idx = rtmTestMessagesRef.current.findIndex((msg) => message.includes(msg.id) && msg.receivedAt === 0);
          if (idx !== -1) {
            const testMsg = { ...rtmTestMessagesRef.current[idx], receivedAt: Date.now() };
            testMsg.latency = testMsg.receivedAt - testMsg.sentAt;
            rtmTestMessagesRef.current = [
              ...rtmTestMessagesRef.current.slice(0, idx),
              testMsg,
              ...rtmTestMessagesRef.current.slice(idx + 1)
            ];
            const newLatencies = [...stateRef.current.rtmMetrics.latencies, testMsg.latency];
            const avgLatency = Math.round(newLatencies.reduce((a, b) => a + b, 0) / newLatencies.length);
            dispatch({ type: 'UPDATE_RTM_METRICS', payload: { messagesReceived: stateRef.current.rtmMetrics.messagesReceived + 1, latencies: newLatencies, avgLatency } });
            const successRate = Math.round((stateRef.current.rtmMetrics.messagesReceived + 1) / stateRef.current.rtmMetrics.messagesSent * 100);
            dispatch({ type: 'UPDATE_RTM_METRICS', payload: { successRate } });
          }
        }
      };
      rtmClientRef.current.addEventListener('message', rtmMessageListenerRef.current);
      await rtmClientRef.current.subscribe(channelName);
      dispatch({ type: 'UPDATE_RTM_STATUS', payload: { channel: 'success' } });
      // Messaging test
      dispatch({ type: 'UPDATE_RTM_STATUS', payload: { messaging: 'pending' } });
      let messageCount = 0;
      rtmTestIntervalRef.current = setInterval(async () => {
        try {
          messageCount++;
          const messageId = `test_${Date.now()}_${messageCount}`;
          const testMessage = { id: messageId, sentAt: Date.now(), receivedAt: 0, latency: 0 };
          rtmTestMessagesRef.current = [...rtmTestMessagesRef.current, testMessage];
          await rtmClientRef.current.publish(channelName, `RTM Test Message ${messageId}`);
          dispatch({ type: 'UPDATE_RTM_METRICS', payload: { messagesSent: stateRef.current.rtmMetrics.messagesSent + 1 } });
        } catch (error) {
          // handle error
        }
      }, TEST_TIMEOUTS.RTM_MESSAGE_INTERVAL);
      setTimeout(() => {
        finishRTMTest();
      }, TEST_TIMEOUTS.RTM_CHECK);
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
  //
        Object.values(remoteVideoStats).forEach(userStats => {
          videoBitrate += userStats.receiveBitrate || 0;
          videoPacketLoss = Math.max(videoPacketLoss, userStats.packetLossRate || 0);
        });

        Object.values(remoteAudioStats).forEach(userStats => {
          //
          audioBitrate += userStats.receiveBitrate || 0;
          //
          audioPacketLoss = Math.max(audioPacketLoss, userStats.packetLossRate || 0);
        });
  //
        
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
  //

        statsIndexRef.current += 1;
      } catch (err) {
        console.warn("Failed to get stats:", err);
      }
    }, TEST_TIMEOUTS.STATS_INTERVAL);

  } catch (err: any) {
    dispatch({
      type: "UPDATE_TEST_SUITE",
      payload: { id: testSuiteId, updates: { notError: false, extra: err.message || String(err) } }
    });
    return;
  }

  // Stop test after connectivity check timeout
  setTimeout(() => {
    if (connectivityIntervalRef.current) clearInterval(connectivityIntervalRef.current);
    dispatch({ type: "SET_TESTING", payload: false });

    setTimeout(() => {
      // Use stateRef.current instead of state to get the most current values
      const bitrateRows = stateRef.current.bitrateData.rows;
      const packetRows = stateRef.current.packetsData.rows;

  //

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
          if (videoBitrate < NETWORK_QUALITY.FAIR.minVideoBitrate || audioBitrate < NETWORK_QUALITY.FAIR.minAudioBitrate) quality = "Poor";
          else if (videoBitrate < NETWORK_QUALITY.GOOD.minVideoBitrate || audioBitrate < NETWORK_QUALITY.GOOD.minAudioBitrate) quality = "Fair";
          else if (videoBitrate > NETWORK_QUALITY.EXCELLENT.minVideoBitrate && audioBitrate > NETWORK_QUALITY.EXCELLENT.minAudioBitrate) quality = "Excellent";

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
  }, TEST_TIMEOUTS.CONNECTIVITY_CHECK);

}, [initRecvClient, initSendClient, handleRTMCheck]);

  // checkProfile is now imported from utils/agoraUtils

  // Camera check
  const handleCameraCheck = useCallback(async () => {
  const testSuiteId = '3';
  dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: testSuiteId });

  let successCount = 0;
  const totalCount = state.profiles.length;
  const errors: string[] = [];

  for (const [index, profile] of state.profiles.entries()) {
    try {
      await checkProfile(profile, localVideoTrackRef);
      successCount++;
    } catch (error: any) {
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
  const keyResolutionsWorking = state.profiles.filter(profile =>
    KEY_RESOLUTIONS.some(
      key => profile.width === key.width && profile.height === key.height && profile.status === 'resolve'
    )
  ).length;

  const successRate = totalCount > 0 ? successCount / totalCount : 0;

  const overallNotError = keyResolutionsWorking >= TEST_THRESHOLDS.KEY_RESOLUTIONS_REQUIRED || successRate >= TEST_THRESHOLDS.MINIMUM_SUCCESS_RATE;

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



  // Handle compatibility check completion from CompatibilityStep
  const handleCompatibilityComplete = useCallback((isSupported: boolean) => {
    const testSuiteId = '0';
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
    // Move to microphone check step (step id '1')
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '1' });
  }, []);


  // Handlers
  const startTest = useCallback(async () => {
    if (!APP_ID) {
      console.error('APP_ID missing. Set NEXT_PUBLIC_APP_ID.');
    }
    // Reset all test state before starting a new test (like restore in Vue)
    dispatch({ type: 'RESET_STATE' });
    // Always cleanup all Agora/RTM resources before starting a new test
    await destructAllCallback();
    dispatch({ type: 'SET_TESTING', payload: true });
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '0' });
    // CompatibilityStep will handle the check and progression
  }, [destructAllCallback]);

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

  // Advance to speaker check after microphone test
  const handleMicrophoneComplete = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_TEST_SUITE', payload: '2' });
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900 p-4 md:p-8 font-sans">
      <Toolbar
        language={state.language}
        languageDisabled={state.languageDisabled || state.testing}
        isEnableCloudProxy={state.isEnableCloudProxy}
        fixProxyPort={state.fixProxyPort}
        testing={state.testing}
        onSwitchLanguage={switchLanguage}
        onToggleCloudProxy={toggleCloudProxy}
        onSetProxyModeFixed={setProxyModeFixed}
        onStartTest={startTest}
        onResetTest={resetTest}
      />
      <div className="grid md:grid-cols-[240px,1fr] gap-8">
        <Stepper
          testSuites={state.testSuites}
          currentTestSuite={state.currentTestSuite}
          onStepClick={onStepClick}
        />
        {state.currentTestSuite === 'final' ? (
          <TestReport testSuites={state.testSuites} profiles={state.profiles} />
        ) : (
          <StepContent
            currentStep={currentStep}
            resolveSpeakerCheck={resolveSpeakerCheck}
            rejectSpeakerCheck={rejectSpeakerCheck}
            onMicrophoneComplete={handleMicrophoneComplete}
            onCompatibilityComplete={handleCompatibilityComplete}
            DOM_IDS={DOM_IDS}
            snackbarOpen={snackbarOpen}
            setSnackbarOpen={setSnackbarOpen}
            snackbarMsg={snackbarMsg}
            setSnackbarMsg={setSnackbarMsg}
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            dialogMsg={dialogMsg}
            setDialogMsg={setDialogMsg}
          />
        )}
      </div>
      {/* Snackbar/Toast */}
      {snackbarOpen && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50">
          {snackbarMsg}
          <button className="ml-4 text-sm underline" onClick={() => setSnackbarOpen(false)}>Close</button>
        </div>
      )}
      {/* Dialog/Modal for retry or info */}
      {dialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <div className="mb-4">{dialogMsg}</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setDialogOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      <Footer APP_ID={APP_ID} SUPPORTED_LANGUAGES={SUPPORTED_LANGUAGES} sdkVersion={state.sdkVersion} />
    </main>
  );
}
