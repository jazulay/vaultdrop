"use client";

import { useEffect, useRef, useState } from "react";

interface VideoLoopProps {
  /** basename under /higgsfield — e.g. "vaultdrop-hero-orrery-loop" */
  name: string;
  className?: string;
  /** hero gets priority treatment: poster is the LCP, metadata preloaded */
  priority?: boolean;
  loop?: boolean;
}

/**
 * Poster-first Higgsfield clip. Poster paints immediately; the video element
 * mounts only when near the viewport (unless priority) and only when the
 * user hasn't asked for reduced motion — in which case the poster IS the
 * experience (information parity: these clips carry no text/data).
 */
export default function VideoLoop({
  name,
  className = "",
  priority = false,
  loop = true,
}: VideoLoopProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  }, [priority]);

  const poster = `/higgsfield/poster/${name}.jpg`;
  const posterSm = `/higgsfield/poster/${name}-sm.jpg`;

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        srcSet={`${posterSm} 780w, ${poster} 1600w`}
        sizes="100vw"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      />
      {showVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop={loop}
          playsInline
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
