"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PlayerCard } from "@/components/gamification/player-card";
import {
  BarChart3,
  BookOpen,
  Flame,
  Gamepad2,
  Settings,
  ScrollText,
  Trophy,
  Brain,
  Sword,
  Shield,
  User,
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

export function AppShell({
  children,
  playerName,
  playerLevel,
  playerTitle,
  currentXP,
  xpToNextLevel,
  avatarStyle,
  streakDays,
}: {
  children: React.ReactNode;
  playerName: string | null;
  playerLevel: number;
  playerTitle: string;
  currentXP: number;
  xpToNextLevel: number;
  avatarStyle?: string | null;
  streakDays: number;
}) {
  const t = useTranslations("nav");
  const ts = useTranslations("shell");
  const tTitles = useTranslations("common.levelTitles");
  const locale = useLocale();
  const pathname = usePathname();
  const isAr = locale === "ar";

  const displayTitle = [
    "Novice",
    "Seeker",
    "Scholar",
    "Adept",
    "Expert",
    "Master",
    "Legend",
    "Champion",
    "Sage",
  ].includes(playerTitle)
    ? tTitles(playerTitle as "Novice" | "Seeker" | "Scholar" | "Sage" | "Master" | "Legend")
    : playerTitle;

  const iconFor = (key: (typeof links)[number]) => {
    switch (key) {
      case "dashboard":
        return <Flame className="size-4" />;
      case "profile":
        return <User className="size-4" />;
      case "habits":
        return <Gamepad2 className="size-4" />;
      case "stats":
        return <BarChart3 className="size-4" />;
      case "courses":
        return <BookOpen className="size-4" />;
      case "mind":
        return <Brain className="size-4" />;
      case "review":
        return <ScrollText className="size-4" />;
      case "achievements":
        return <Trophy className="size-4" />;
      case "settings":
        return <Settings className="size-4" />;
      default:
        return <Sword className="size-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className={cn("mx-auto flex max-w-7xl", isAr && "rpg-shell-row")}>
        <aside
          className={cn(
            "sticky top-0 h-[100dvh] w-[280px] shrink-0 border-rpg-border bg-rpg-sidebar",
            isAr ? "border-l" : "border-r",
          )}
        >
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-32 bg-[linear-gradient(to_bottom,rgba(124,58,237,0.08),transparent)]" />

          <div className="relative flex h-full flex-col p-5">
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
                    className={cn(
                      "rpg-nav-item flex h-11 items-center gap-3 ps-5 pe-2 transition",
                      active
                        ? "rpg-nav-link-active text-rpg-gold"
                        : "rounded-lg text-[#888899] hover:text-rpg-text hover:bg-white/[0.03]",
                    )}
                  >
                    <span className={cn(active ? "text-rpg-gold" : "text-[#888899]")}>
                      {iconFor(key)}
                    </span>
                    <span className="leading-snug">{t(key)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-5">
              <div className="flex items-center gap-2 rounded-full border border-rpg-border bg-rpg-card px-3 py-2">
                <Shield className="size-4 text-rpg-gold" />
                <p className="text-xs font-medium text-rpg-gold">
                  {ts("streakCount", { count: streakDays })}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main key={pathname} className="rpg-page-transition min-w-0 flex-1 overflow-x-hidden px-10 pb-8 pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
