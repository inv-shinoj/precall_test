import AgoraRTC, { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { TEST_TIMEOUTS, DOM_IDS } from '@/constants/settings';

/**
 * Utility to check if a camera profile (resolution) is supported.
 * @param profile - The profile object with width, height, and resolution.
 * @param localVideoTrackRef - Ref to the local video track.
 * @returns Promise that resolves if supported, rejects if not.
 */
export async function checkProfile(
  profile: { width: number; height: number; resolution: string; status?: string },
  localVideoTrackRef: React.MutableRefObject<ICameraVideoTrack | null>
): Promise<void> {
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
    localVideoTrackRef.current.play(DOM_IDS.TEST_SEND);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const videoElement = document.querySelector<HTMLVideoElement>(`#${DOM_IDS.TEST_SEND} video`);
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
      }, TEST_TIMEOUTS.RESOLUTION_CHECK);
    });
  } catch (error: any) {
    profile.status = 'reject';
    throw error;
  }
}

/**
 * Utility to clean up all Agora/RTM resources and timers.
 */
export async function destructAll(
  refs: {
    localAudioTrackRef: React.MutableRefObject<IMicrophoneAudioTrack | null>;
    localVideoTrackRef: React.MutableRefObject<ICameraVideoTrack | null>;
    sendClientRef: React.MutableRefObject<IAgoraRTCClient | null>;
    recvClientRef: React.MutableRefObject<IAgoraRTCClient | null>;
    rtmClientRef: React.MutableRefObject<any>;
    detectIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
    connectivityIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
    rtmTestIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  }
): Promise<void> {
  // Stop and close local tracks
  if (refs.localAudioTrackRef.current) {
    refs.localAudioTrackRef.current.stop();
    refs.localAudioTrackRef.current.close();
    refs.localAudioTrackRef.current = null;
  }
  if (refs.localVideoTrackRef.current) {
    refs.localVideoTrackRef.current.stop();
    refs.localVideoTrackRef.current.close();
    refs.localVideoTrackRef.current = null;
  }
  // Leave Agora clients
  if (refs.sendClientRef.current) {
    try { await refs.sendClientRef.current.leave(); } catch {}
    refs.sendClientRef.current = null;
  }
  if (refs.recvClientRef.current) {
    try { await refs.recvClientRef.current.leave(); } catch {}
    refs.recvClientRef.current = null;
  }
  // RTM cleanup
  if (refs.rtmClientRef.current) {
    try { await refs.rtmClientRef.current.logout?.(); } catch {}
    refs.rtmClientRef.current = null;
  }
  // Clear intervals/timers
  if (refs.detectIntervalRef.current) { clearInterval(refs.detectIntervalRef.current); refs.detectIntervalRef.current = null; }
  if (refs.connectivityIntervalRef.current) { clearInterval(refs.connectivityIntervalRef.current); refs.connectivityIntervalRef.current = null; }
  if (refs.rtmTestIntervalRef.current) { clearInterval(refs.rtmTestIntervalRef.current); refs.rtmTestIntervalRef.current = null; }
}
