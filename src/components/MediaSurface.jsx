import { useEffect, useEffectEvent, useRef } from "react";

const mediaStyle = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain",
  background: "#000",
  userSelect: "none",
  pointerEvents: "none",
};

export function MediaSurface({ media, onSurfaceReady }) {
  const videoRef = useRef(null);
  const reportSurfaceReady = useEffectEvent((width, height) => {
    onSurfaceReady?.(width, height);
  });

  useEffect(() => {
    if (media?.kind !== "stream") return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    const handleLoadedMetadata = () => {
      reportSurfaceReady(video.videoWidth, video.videoHeight);
    };

    video.srcObject = media.stream;
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    const playPromise = video.play();
    playPromise?.catch(() => {});

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      if (video.srcObject === media.stream) {
        video.srcObject = null;
      }
    };
  }, [media]);

  if (!media) return null;

  if (media.kind === "image") {
    return (
      <img
        src={media.src}
        alt=""
        draggable={false}
        onLoad={(event) =>
          reportSurfaceReady(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
        }
        style={mediaStyle}
      />
    );
  }

  if (media.kind === "stream") {
    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={mediaStyle}
      />
    );
  }

  return null;
}
