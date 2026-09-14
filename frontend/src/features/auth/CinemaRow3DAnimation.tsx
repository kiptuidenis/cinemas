import React, { useState, useEffect, useRef } from "react";

export const CinemaRow3DAnimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Autoplay guarantee for mobile devices (iOS Safari & Android Chrome)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      try {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined && typeof playPromise?.catch === "function") {
          playPromise.catch(() => {
            // Autoplay policy or low-power mode handling
          });
        }
      } catch {
        // Fallback for non-standard test environments
      }
    }
  }, []);

  // Background tab & battery optimization: pause video when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else {
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined && typeof playPromise?.catch === "function") {
            playPromise.catch(() => {
              // Autoplay policy fallback
            });
          }
        } catch {
          // Fallback
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Check for prefers-reduced-motion safely
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      try {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mediaQuery && mediaQuery.matches && videoRef.current) {
          videoRef.current.pause();
        }
      } catch {
        // matchMedia unsupported or throwing
      }
    }
  }, []);

  return (
    <div
      className="cinema-video-container"
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
