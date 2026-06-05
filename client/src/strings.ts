// All user-facing copy lives here so a future i18n pass is a single-file change.
export const strings = {
  appName: "Swappsy Link Tracker",
  tagline: "Track the links you exchange — pending, live, or removed.",
  upgrade: {
    banner: "Tired of checking links by hand? Swappsy auto-monitors them and emails you the moment one disappears.",
    cta: "Upgrade",
  },
  footer: {
    poweredBy: "Powered by Swappsy",
  },
  status: {
    pending: "Pending",
    live: "Live",
    removed: "Removed",
  },
} as const;

export const UPGRADE_URL = "https://swappsy.net";
