import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

export default function ProfileSection({ user, compact = false }) {
  const [failedImage, setFailedImage] = useState(null);
  const name = user?.name?.trim() || "Player";
  const avatarUrl = user?.avatarUrl;
  const initials = name.split(/\s+/).slice(0, 2)
    .map((part) => part[0]).join("").toUpperCase();
  const showImage = avatarUrl && failedImage !== avatarUrl;

  return (
    <Link to="/profile" aria-label={`View ${name}'s profile`}
      className={compact
        ? "inline-flex shrink-0 rounded-full"
        : "flex min-h-20 items-center gap-3 border-t border-border px-4 py-4 hover:bg-surface-hover motion-safe:transition-colors"}>
      <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-surface-hover text-xs font-bold text-primary ${
        compact ? "size-9 border-primary/60" : "size-11 border-[#8396a8]"
      }`}>
        {showImage ? (
          <img src={avatarUrl} alt="" onError={() => setFailedImage(avatarUrl)}
            className="h-full w-full object-cover" />
        ) : <span aria-hidden="true">{initials}</span>}
      </span>
      {!compact && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="mt-0.5 block text-xs text-muted">View profile</span>
          </span>
          <ChevronRight size={17} aria-hidden="true" className="shrink-0 text-muted" />
        </>
      )}
    </Link>
  );
}