
'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { TestSuite } from '@/types';
import { VolumeProgress } from './Progress';

// Import AgoraRTC dynamically to avoid SSR issues
let AgoraRTC: any = null;
if (typeof window !== 'undefined') {
  try {
    AgoraRTC = require('agora-rtc-sdk-ng');
  } catch (e) {
    // ignore
  }
}

interface MicrophoneStepProps {
  step: TestSuite;
  onComplete?: () => void;
}

const TEST_DURATION = 7000; // ms

const MicrophoneStep: React.FC<MicrophoneStepProps> = ({ step, onComplete }) => {
  const [volume, setVolume] = useState(0);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const audioTrackRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function startTest() {
      if (!AgoraRTC) return;
      setTesting(true);
      setResult(null);
      let localAudioTrack: any;
      let totalVolume = 0;
      let sampleCount = 0;
      try {
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        audioTrackRef.current = localAudioTrack;
        intervalRef.current = setInterval(() => {
          const v = Math.floor(localAudioTrack.getVolumeLevel() * 100);
          setVolume(v);
          totalVolume += v;
          sampleCount++;
        }, 100);
        setTimeout(() => {
          if (cancelled) return;
          clearInterval(intervalRef.current);
          if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            audioTrackRef.current = null;
          }
          setTesting(false);
          const avg = sampleCount > 0 ? totalVolume / sampleCount : 0;
          if (avg < 10) {
            setResult('Can barely hear you. Please check your microphone.');
          } else {
            setResult('Microphone works well!');
          }
          // Notify parent after test completes (short delay for UI feedback)
          if (onComplete) setTimeout(onComplete, 1200);
        }, TEST_DURATION);
      } catch (err: any) {
        setTesting(false);
        setResult('Microphone access failed: ' + (err?.message || err));
      }
    }
    startTest();
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <h3 className="font-semibold mb-2">Microphone Check</h3>
      <div className="mb-4">
        <VolumeProgress level={volume} />
      </div>
      {testing && (
        <div className="text-blue-600">Testing microphone... Please speak.</div>
      )}
      {result && (
        <div className={`mt-2 p-2 rounded ${result.includes('well') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{result}</div>
      )}
    </div>
  );
};

export default MicrophoneStep;
