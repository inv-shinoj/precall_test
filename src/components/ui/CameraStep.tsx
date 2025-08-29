import React, { useEffect, useRef, useState } from 'react';
import type { TestSuite } from '@/types';
import { profileArray } from '@/constants/settings';

// Import AgoraRTC dynamically to avoid SSR issues
let AgoraRTC: any = null;
if (typeof window !== 'undefined') {
  try {
    AgoraRTC = require('agora-rtc-sdk-ng');
  } catch (e) {
    // ignore
  }
}

interface CameraStepProps {
  step: TestSuite;
}



type ProfileStatus = 'pending' | 'resolve' | 'reject';

interface ProfileResult {
  resolution: string;
  width: number;
  height: number;
  status: ProfileStatus;
  error?: string;
}

const CameraStep: React.FC<CameraStepProps> = ({ step }) => {
  const [results, setResults] = useState<ProfileResult[]>(profileArray.map(p => ({ ...p, status: 'pending' as ProfileStatus })));
  const [testing, setTesting] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const videoRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function runTests() {
      if (!AgoraRTC) return;
      setTesting(true);
      let supported = 0;
      const newResults: ProfileResult[] = [];
      for (let i = 0; i < profileArray.length; i++) {
        const profile = profileArray[i];
        if (cancelled) break;
        let localVideoTrack: any = null;
        let status: ProfileStatus = 'pending';
        let error = '';
        try {
          // Explicitly set constraints for each resolution
          localVideoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: {
              width: profile.width,
              height: profile.height
            }
          });
          trackRef.current = localVideoTrack;
          // Play video hidden
          if (videoRef.current) {
            localVideoTrack.play(videoRef.current);
          }
          // Wait for video to be ready and retry reading dimensions
          let vw = 0, vh = 0;
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise(res => setTimeout(res, 150));
            const videoElem = videoRef.current?.querySelector('video');
            if (videoElem) {
              vw = videoElem.videoWidth;
              vh = videoElem.videoHeight;
              if (vw && vh) break;
            }
          }
          if (vw === profile.width && vh === profile.height) {
            status = 'resolve';
            supported++;
          } else {
            status = 'reject';
            error = `Got ${vw}x${vh}`;
          }
        } catch (e: any) {
          status = 'reject';
          error = e?.message || String(e);
        } finally {
          if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.close();
            trackRef.current = null;
          }
        }
        // Update only the tested row, keep others as is
        setResults(prev => prev.map((r, idx) => idx === i ? { ...profile, status, error } : r));
        newResults.push({ ...profile, status, error });
      }
      setTesting(false);
      // Summary
  const percent = Math.round((supported / profileArray.length) * 100);
  setSummary(`${supported}/${profileArray.length} resolutions supported (${percent}%)`);
    }
    runTests();
    return () => {
      cancelled = true;
      if (trackRef.current) {
        trackRef.current.stop();
        trackRef.current.close();
        trackRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <h3 className="font-semibold mb-2">Camera Resolution Check</h3>
      <div ref={videoRef} style={{ width: 1, height: 1, overflow: 'hidden', position: 'absolute', left: -9999 }} />
      <ul className="mb-2">
        {results.map((r, i) => (
          <li key={r.resolution} className="flex items-center gap-2">
            <span>{r.width} * {r.height}</span>
            {r.status === 'resolve' && <span className="text-green-600 text-xl">&#10003;</span>}
            {r.status === 'reject' && <span className="text-red-600 text-xl">&#10007;</span>}
            {r.status === 'pending' && <span className="text-gray-400 text-xl">&#8230;</span>}
          </li>
        ))}
      </ul>
      {testing && <div className="text-blue-600">Testing camera resolutions...</div>}
      {!testing && summary && (
        <div className="mt-2 p-2 rounded bg-gray-50 text-gray-800 border">{summary}</div>
      )}
    </div>
  );
};

export default CameraStep;
