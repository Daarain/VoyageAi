"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo() {
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } catch {
      // ignore media query errors in older envs
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion || videoFailed) return;

    let mounted = true;

    const startVideo = () => {
      if (!video) return;
      try {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (mounted) setVideoReady(true);
            })
            .catch(() => {
              // Browser autoplay policy prevented playback; poster remains visible
            });
        }
      } catch {
        // Safe catch for media playback restrictions
      }
    };

    video.addEventListener("loadedmetadata", startVideo);
    startVideo();

    return () => {
      mounted = false;
      video.removeEventListener("loadedmetadata", startVideo);
    };
  }, [reducedMotion, videoFailed]);

  if (reducedMotion || videoFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/images/hero-poster.jpg"
        alt="Bulk carrier vessel arriving at port at sunset"
        className="absolute inset-0 h-full w-full object-cover object-[65%_center] md:object-center"
      />
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-poster.jpg"
        alt="Bulk carrier vessel arriving at port at sunset"
        className="absolute inset-0 h-full w-full object-cover object-[65%_center] transition-opacity duration-700 md:object-center"
        style={{ opacity: videoReady ? 0 : 1 }}
      />

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        onCanPlay={() => setVideoReady(true)}
        onError={() => setVideoFailed(true)}
        className="absolute inset-0 h-full w-full object-cover object-[65%_center] transition-opacity duration-700 md:object-center"
        style={{ opacity: videoReady ? 1 : 0 }}
      >
        <source src="/video/hero.webm" type="video/webm" onError={() => setVideoFailed(true)} />
        <source src="/video/hero.mp4" type="video/mp4" onError={() => setVideoFailed(true)} />
      </video>
    </>
  );
}
