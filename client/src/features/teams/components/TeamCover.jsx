import { useState } from "react";
import { initials } from "../../../utils/data";

export default function TeamCover({
  src,
  name = "Team",
  className = "h-44",
  children,
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={`relative isolate overflow-hidden bg-linear-to-br from-surface-hover to-background ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="font-display text-8xl italic tracking-wider text-primary/20">
          {initials(name)}
        </span>
      </div>

      {showImage && (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {showImage && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent"
        />
      )}

      <div className="relative h-full">{children}</div>
    </div>
  );
}