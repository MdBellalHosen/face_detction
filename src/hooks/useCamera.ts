import { useCallback, useEffect, useRef, useState } from 'react';

export type Facing = 'user' | 'environment';
export type CameraStatus = 'idle' | 'starting' | 'active' | 'error';
export type CameraError = 'denied' | 'notFound' | 'unsupported' | 'other';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestId = useRef(0);
  const facingRef = useRef<Facing>('user');

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<CameraError | null>(null);
  const [facing, setFacing] = useState<Facing>('user');
  const [canSwitch, setCanSwitch] = useState(false);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    requestId.current += 1; // cancel any pending start()
    releaseStream();
    setStatus('idle');
  }, [releaseStream]);

  const start = useCallback(
    async (mode?: Facing) => {
      const wanted = mode ?? facingRef.current;
      const id = ++requestId.current;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('unsupported');
        setStatus('error');
        return;
      }

      releaseStream();
      setStatus('starting');
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // HD picture so the preview is sharp on high-density phone screens.
          video: {
            facingMode: { ideal: wanted },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        // A newer start()/stop() happened while we were waiting for permission.
        if (id !== requestId.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }

        // Ask for continuous autofocus where supported (Chrome on Android); ignored elsewhere.
        const track = stream.getVideoTracks()[0];
        await track
          ?.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] })
          .catch(() => undefined);

        const actual = track?.getSettings().facingMode;
        const resolved: Facing = actual === 'environment' || actual === 'user' ? actual : wanted;
        facingRef.current = resolved;
        setFacing(resolved);

        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1);

        setStatus('active');
      } catch (err) {
        if (id !== requestId.current) return;
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError') setError('denied');
        else if (name === 'NotFoundError' || name === 'OverconstrainedError') setError('notFound');
        else setError('other');
        setStatus('error');
      }
    },
    [releaseStream],
  );

  const switchCamera = useCallback(() => {
    void start(facingRef.current === 'user' ? 'environment' : 'user');
  }, [start]);

  // Always release the camera when the component using this hook unmounts.
  useEffect(() => {
    return () => {
      requestId.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return { videoRef, status, error, facing, canSwitch, start, stop, switchCamera };
}
