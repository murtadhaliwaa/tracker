import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type MindRecentMeditation = {
  id: string;
  type: string;
  duration: number;
  notes: string | null;
  createdAt: string;
  xp: number;
};

export type MindReadingSession = {
  id: string;
  bookTitle: string;
  pagesRead: number;
  rating: number | null;
  notes: string | null;
  createdAt: string;
};

export type MindPageData = {
  meditationCount: number;
  totalMinutes: number;
  avgDuration: number;
  readingCount: number;
  totalPages: number;
  avgPages: number;
  recentMeditations: MindRecentMeditation[];
  readingSessions: MindReadingSession[];
  bookTitles: string[];
};

export const getMindPageData = cache(async (userId: string): Promise<MindPageData> => {
  const [meditationSessions, readingStats, readingSessions, bookTitlesRows] = await Promise.all([
    prisma.meditationSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        duration: true,
        notes: true,
        createdAt: true,
        focusMultiplierEarned: true,
      },
    }),
    prisma.readingSession.aggregate({
      where: { userId },
      _count: true,
      _sum: { pagesRead: true },
      _avg: { pagesRead: true },
    }),
    prisma.readingSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        bookTitle: true,
        pagesRead: true,
        rating: true,
        notes: true,
        createdAt: true,
      },
    }),
    prisma.readingSession.findMany({
      where: { userId },
      select: { bookTitle: true },
      distinct: ["bookTitle"],
      orderBy: { bookTitle: "asc" },
    }),
  ]);

  const totalMinutes = meditationSessions.reduce((a, s) => a + s.duration, 0);
  const totalPages = readingStats._sum.pagesRead ?? 0;
  const avgDuration = meditationSessions.length
    ? Math.round(totalMinutes / meditationSessions.length)
    : 0;
  const avgPages = readingStats._avg.pagesRead ? Math.round(readingStats._avg.pagesRead) : 0;

  return {
    meditationCount: meditationSessions.length,
    totalMinutes,
    avgDuration,
    readingCount: readingStats._count,
    totalPages,
    avgPages,
    recentMeditations: meditationSessions.slice(0, 5).map((s) => ({
      id: s.id,
      type: s.type,
      duration: s.duration,
      notes: s.notes,
      createdAt: s.createdAt.toISOString(),
      xp: Math.round(s.duration * s.focusMultiplierEarned),
    })),
    readingSessions: readingSessions.map((s) => ({
      id: s.id,
      bookTitle: s.bookTitle,
      pagesRead: s.pagesRead,
      rating: s.rating,
      notes: s.notes,
      createdAt: s.createdAt.toISOString(),
    })),
    bookTitles: bookTitlesRows.map((s) => s.bookTitle),
  };
});
