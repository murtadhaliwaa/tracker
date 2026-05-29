"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PlayerCard } from "@/components/gamification/player-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BarChart3,
  BookOpen,
  Brain,
  Flame,
  Gamepad2,
  Menu,
  Settings,
  ScrollText,
  Trophy,
  User,
  X,
  Shield,
  Sword,
} from "lucide-react";

const links = [
  "dashboard",
  "profile",
  "habits",
  "stats",
  "courses",
  "mind",
  "review",
  "achievements",
  "settings",
] as const;

const mobileQuickLinks = ["dashboard", "habits", "stats", "mind", "settings"] as const;

type LinkKey = (typeof links)[number];

function useDisplayTitle(playerTitle: string) {
  const tTitles = useTranslations("common.levelTitles");
  return ["Novice", "Seeker", "Scholar", "Adept", "Expert", "Master", "Legend", "Champion", "Sage"].includes(
    playerTitle,
  )
    ? tTitles(playerTitle as "Novice" | "Seeker" | "Scholar" | "Sage" | "Master" | "Legend")
    : playerTitle;
}

export function AppShell({
  children,
  playerName,
  playerLevel,
  playerTitle,
  currentXP,
  xpToNextLevel,
  avatarStyle,
  streakDays,
  freezesAvailable,
}: {
  children: React.ReactNode;
  playerName: string | null;
  playerLevel: number;
  playerTitle: string;
  currentXP: number;
  xpToNextLevel: number;
  avatarStyle?: string | null;
  streakDays: number;
  freezesAvailable: number;
}) {
  const t = useTranslations("nav");
  const ts = useTranslations("shell");
  const locale = useLocale();
  const pathname = usePathname();
  const isAr = locale === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);

  const displayTitle = useDisplayTitle(playerTitle);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const iconFor = (key: LinkKey) => {
    switch (key) {
      case "dashboard":
        return <Flame className="size-4 shrink-0" />;
      case "profile":
        return <User className="size-4 shrink-0" />;
      case "habits":
        return <Gamepad2 className="size-4 shrink-0" />;
      case "stats":
        return <BarChart3 className="size-4 shrink-0" />;
      case "courses":
        return <BookOpen className="size-4 shrink-0" />;
      case "mind":
        return <Brain className="size-4 shrink-0" />;
      case "review":
        return <ScrollText className="size-4 shrink-0" />;
      case "achievements":
        return <Trophy className="size-4 shrink-0" />;
      case "settings":
        return <Settings className="size-4 shrink-0" />;
      default:
        return <Sword className="size-4 shrink-0" />;
    }
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "rpg-nav-item flex h-11 items-center gap-3 pe-2 ps-5 transition",
      active
        ? "rpg-nav-link-active text-rpg-gold"
        : "rounded-lg text-[#888899] hover:bg-white/[0.03] hover:text-rpg-text",
    );

  const streakBadgeClass =
    "flex items-center gap-1 rounded-full border border-rpg-border bg-rpg-card transition hover:border-rpg-gold/40 hover:bg-rpg-gold/5 active:scale-95";

  const streakBadge = (compact = false) => (
    <button
      type="button"
      aria-label={ts("streakBadgeTitle")}
      onClick={() => setStreakInfoOpen(true)}
      className={cn(streakBadgeClass, compact ? "px-2 py-1" : "px-3 py-2")}
    >
      <Shield className={cn("shrink-0 text-rpg-gold", compact ? "size-3.5" : "size-4")} />
      {compact ? (
        <span className="text-[10px] font-medium text-rpg-gold">{streakDays}</span>
      ) : (
        <p className="text-xs font-medium text-rpg-gold">{ts("streakCount", { count: streakDays })}</p>
      )}
    </button>
  );

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      <p
        className="flex items-center gap-2 font-heading text-[20px] tracking-wide"
        style={{ color: "#f0c040" }}
      >
        <Sword className="size-5 text-rpg-gold" />
        LIFE RPG
      </p>

      <PlayerCard
        playerName={playerName}
        playerTitle={displayTitle}
        playerLevel={playerLevel}
        currentXP={currentXP}
        xpToNextLevel={xpToNextLevel}
        avatarStyle={avatarStyle}
        isRtl={isAr}
        nameFallback={ts("player")}
      />

      <nav className="mt-6 flex flex-col gap-1">
        {links.map((key) => {
          const href = `/${locale}/${key}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              prefetch={false}
              onClick={onNavigate}
              className={navLinkClass(active)}
            >
              <span className={cn(active ? "text-rpg-gold" : "text-[#888899]")}>{iconFor(key)}</span>
              <span className="leading-snug">{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-5">{streakBadge()}</div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile top bar */}
      <header
        className={cn(
          "sticky top-0 z-40 flex h-14 items-center justify-between border-b border-rpg-border bg-rpg-sidebar/95 px-4 backdrop-blur-md md:hidden",
          isAr && "flex-row-reverse",
        )}
      >
        <button
          type="button"
          aria-label={ts("openMenu")}
          onClick={() => setMenuOpen(true)}
          className="flex size-10 items-center justify-center rounded-lg text-rpg-gold hover:bg-white/5"
        >
          <Menu className="size-5" />
        </button>

        <p className="flex items-center gap-1.5 font-heading text-base tracking-wide text-rpg-gold">
          <Sword className="size-4" />
          LIFE RPG
        </p>

        {streakBadge(true)}
      </header>

      {/* Mobile slide-out menu */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={ts("closeMenu")}
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className={cn(
              "absolute top-0 flex h-full w-[min(100vw-3rem,320px)] flex-col border-rpg-border bg-rpg-sidebar p-5 shadow-2xl",
              isAr ? "right-0 border-l animate-in slide-in-from-right duration-200" : "left-0 border-r animate-in slide-in-from-left duration-200",
            )}
          >
            <button
              type="button"
              aria-label={ts("closeMenu")}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "absolute top-4 flex size-9 items-center justify-center rounded-lg text-[#888899] hover:bg-white/5 hover:text-rpg-text",
                isAr ? "left-4" : "right-4",
              )}
            >
              <X className="size-5" />
            </button>

            <div className="relative flex h-full flex-col overflow-y-auto pt-10">
              {sidebarContent(() => setMenuOpen(false))}
            </div>
          </aside>
        </div>
      ) : null}

      <div className={cn("mx-auto flex max-w-7xl", isAr && "rpg-shell-row")}>
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-[100dvh] w-[280px] shrink-0 border-rpg-border bg-rpg-sidebar md:flex md:flex-col",
            isAr ? "border-l" : "border-r",
          )}
        >
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-32 bg-[linear-gradient(to_bottom,rgba(124,58,237,0.08),transparent)]" />
          <div className="relative flex h-full flex-col overflow-y-auto p-5">{sidebarContent()}</div>
        </aside>

        <main
          key={pathname}
          className="rpg-page-transition min-w-0 flex-1 overflow-x-hidden px-4 pb-24 pt-4 md:px-10 md:pb-8 md:pt-8"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-rpg-border bg-rpg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden",
          isAr && "direction-rtl",
        )}
        aria-label={ts("mobileNav")}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
          {mobileQuickLinks.map((key) => {
            const href = `/${locale}/${key}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                prefetch={false}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition",
                  active ? "text-rpg-gold" : "text-[#888899]",
                )}
              >
                <span className={cn(active && "text-rpg-gold")}>{iconFor(key)}</span>
                <span className="w-full truncate text-center text-[10px] leading-tight">{t(key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AlertDialog open={streakInfoOpen} onOpenChange={setStreakInfoOpen}>
        <AlertDialogContent className="border-rpg-border bg-rpg-card sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rpg-gold">
              <Shield className="size-5" />
              {ts("streakBadgeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-rpg-secondary">
              <span className="block">{ts("streakBadgeDescription")}</span>
              <span className="block">{ts("streakBadgeBenefit", { count: freezesAvailable })}</span>
              <span className="block text-sm text-rpg-gold">
                {ts("streakCount", { count: streakDays })}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-rpg-gold text-[#0a0a0f] hover:bg-rpg-gold/90">
              {ts("streakBadgeGotIt")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
