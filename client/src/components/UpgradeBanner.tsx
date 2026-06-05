import { useState } from "react";
import { Zap, ExternalLink, X } from "lucide-react";
import { strings, UPGRADE_URL } from "@/strings";

// Persistent (per-session) upgrade nudge — the lead-magnet's reason for existing.
export default function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container flex items-center justify-between gap-4 py-2 text-sm">
        <span className="flex items-center gap-2">
          <Zap className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{strings.upgrade.banner}</span>
          <span className="sm:hidden">Auto-monitor your links on Swappsy.</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-white/15 hover:bg-white/25 px-3 py-1 font-medium transition-colors"
          >
            {strings.upgrade.cta} <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-white/15 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
