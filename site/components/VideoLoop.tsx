"use client";

import { useEffect, useRef, useState } from "react";

interface VideoLoopProps {
  /** basename under /higgsfield — e.g. "vaultdrop-hero-orrery-loop" */
  name: string;
  className?: string;
  /** hero gets priority treatment: poster is the LCP, metadata preloaded */
  priority?: boolean;
  loop?: boolean;
  /** meaningful description; empty string = decorative (audit P2-15) */
  alt?: string;
  /**
   * "inview" (default): autoplay while visible. "hover" (§5.3): poster by
   * default, play on hover/focus on fine pointers; falls back to in-view
   * playback on touch devices. Zero initial cost either way (preload none).
   */
  playMode?: "inview" | "hover";
}

/**
 * Poster-first Higgsfield clip. Poster paints immediately; the video mounts
 * only near the viewport and never under prefers-reduced-motion (the poster is
 * the experience — clips carry no text/data). Offscreen videos are paused via
 * IntersectionObserver (audit §10.4).
 */
export default function VideoLoop({
  name,
  className = "",
  priority = false,
  loop = true,
  alt = "",
  playMode = "inview",
}: VideoLoopProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [hoverMode, setHoverMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Hover mode only makes sense with a hover-capable pointer.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (playMode === "hover" && canHover) {
      setHoverMode(true);
      return; // video mounts lazily on first hover/focus
    }
    if (priority) {
      setShowVideo(true);
      return;
    }
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShowVideo(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [priority, playMode]);

  // In-view playback: pause when offscreen, resume when visible.
  useEffect(() => {
    if (!showVideo || hoverMode) return;
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [showVideo, hoverMode]);

  // Hover playback (§5.3): mount on first hover/focus, play while held.
  useEffect(() => {
    if (!hoverMode) return;
    const el = wrapRef.current;
    if (!el) return;
    const start = () => {
      setShowVideo(true);
      // play() next tick once the element exists
      requestAnimationFrame(() => videoRef.current?.play().catch(() => {}));
    };
    const stop = () => videoRef.current?.pause();
    el.addEventListener("pointerenter", start);
    el.addEventListener("pointerleave", stop);
    el.addEventListener("focusin", start);
    el.addEventListener("focusout", stop);
    return () => {
      el.removeEventListener("pointerenter", start);
      el.removeEventListener("pointerleave", stop);
      el.removeEventListener("focusin", start);
      el.removeEventListener("focusout", stop);
    };
  }, [hoverMode]);

  const poster = `/higgsfield/poster/${name}.jpg`;
  const posterSm = `/higgsfield/poster/${name}-sm.jpg`;

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        srcSet={`${posterSm} 780w, ${poster} 1600w`}
        sizes="100vw"
        alt={alt}
        {...(alt === "" ? { "aria-hidden": true } : {})}
        width={1600}
        height={900}
        className="absolute inset-0 h-full w-full object-cover"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      />
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop={loop}
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          preload={priority ? "metadata" : "none"}
          poster={poster}
        >
          <source src={`/higgsfield/video/${name}.webm`} type="video/webm" />
          <source src={`/higgsfield/video/${name}.mp4`} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
