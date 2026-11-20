import { useEffect, useState, type ReactNode, type RefObject } from 'react';

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  mirror: boolean;
  paused: boolean;
  active: boolean;
  /** Overlay content (loading / error messages). */
  children?: ReactNode;
}

/** Live video with a canvas on top for the face box. */
export function CameraView({ videoRef, canvasRef, mirror, paused, active, children }: Props) {
  const [ratio, setRatio] = useState(3 / 4);

  // Freeze / unfreeze the picture when the user pauses.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active) return;
    if (paused) video.pause();
    else void video.play().catch(() => undefined);
  }, [paused, active, videoRef]);

  return (
    // Keep the video's true shape, but never taller than 60% of the screen.
    <div
      className="camera"
      style={{ aspectRatio: String(ratio), width: `min(100%, calc(60dvh * ${ratio}))` }}
    >
      <div className={`camera__layer${mirror ? ' camera__layer--mirror' : ''}`}>
        <video
          ref={videoRef}
          className="camera__video"
          autoPlay
          muted
          playsInline
          onLoadedMetadata={(e) => {
            const { videoWidth, videoHeight } = e.currentTarget;
            if (videoWidth && videoHeight) setRatio(videoWidth / videoHeight);
          }}
        />
        <canvas ref={canvasRef} className="camera__canvas" />
      </div>
      {children}
    </div>
  );
}
