import { useTheme } from "next-themes";
import { Moon, Sun, LogOut } from "lucide-react";
import UpgradeBanner from "@/components/UpgradeBanner";
import LinkGrid from "@/components/LinkGrid";
import { useAuth } from "@/lib/auth";
import { strings, UPGRADE_URL } from "@/strings";

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — navy brand surface, orange accent */}
      <header className="bg-brand-navy text-white">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3 font-semibold">
            <img
              src="/swappsy-logo.png"
              alt="Swappsy"
              className="h-7 w-auto brightness-0 invert"
            />
            <span className="hidden border-l border-white/20 pl-3 text-sm text-white/80 sm:inline">
              Link Tracker
            </span>
          </div>
          <div className="flex items-center gap-1">
            {user && <span className="text-xs text-white/60 mr-2 hidden sm:inline">{user.email}</span>}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <UpgradeBanner />

      <main className="container flex-1 py-8">
        <LinkGrid />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <a href={UPGRADE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
          {strings.footer.poweredBy} · swappsy.net
        </a>
        <span className="mx-2">·</span>
        AGPL-3.0
      </footer>
    </div>
  );
}
