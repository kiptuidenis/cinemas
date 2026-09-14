import React, { useState, useEffect, useRef } from "react";

export const CinemaRow3DAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Background tab & battery optimization: pause video when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        background: "#08090D",
        borderTopLeftRadius: 48,
        borderBottomLeftRadius: 48,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ======================================================================
          HTML5 VIDEO ENGINE (Industry Standard: Streaming, Loop, Muted, PlaysInline)
          ====================================================================== */}
      <video
        ref={videoRef}
        src="/videos/signup-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        onCanPlayThrough={() => setIsLoaded(true)}
        onLoadedData={() => setIsLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          inset: 0,
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* ======================================================================
          CINEMATIC FRAMING & INNER VIGNETTE OVERLAY
          ====================================================================== */}
      {/* Soft inner vignette and edge gradient for seamless blending */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(8, 9, 13, 0.25) 0%, transparent 12%, transparent 88%, rgba(8, 9, 13, 0.25) 100%), linear-gradient(180deg, rgba(8, 9, 13, 0.2) 0%, transparent 10%, transparent 88%, rgba(8, 9, 13, 0.35) 100%)",
          boxShadow: "inset 0 0 60px rgba(8, 9, 13, 0.4)",
        }}
      />
    </div>
  );
};

export const CinemaVideoShowcase = CinemaRow3DAnimation;
export default CinemaRow3DAnimation;
