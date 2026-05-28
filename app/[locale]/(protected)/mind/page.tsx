import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { MindClient } from "@/components/mind/mind-client";
import { getBookTitles } from "@/app/[locale]/(protected)/mind/actions";

export default async function MindPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const [meditationSessions, readingStats, readingSessions, bookTitles] = await Promise.all([
    prisma.meditationSession.findMany({
      where: { userId: viewer.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.readingSession.aggregate({
      where: { userId: viewer.userId },
      _count: true,
      _sum: { pagesRead: true },
      _avg: { pagesRead: true },
    }),
    prisma.readingSession.findMany({
      where: { userId: viewer.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getBookTitles(),
  ]);

  const totalMinutes = meditationSessions.reduce((a, s) => a + s.duration, 0);
  const totalPages = readingStats._sum.pagesRead ?? 0;
  const avgDuration = meditationSessions.length
    ? Math.round(totalMinutes / meditationSessions.length)
    : 0;
  const avgPages = readingStats._avg.pagesRead ? Math.round(readingStats._avg.pagesRead) : 0;

  const recentMeditations = meditationSessions.slice(0, 5).map((s) => ({
    id: s.id,
    type: s.type,
    duration: s.duration,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    xp: Math.round(s.duration * s.focusMultiplierEarned),
  }));

  return (
    <MindClient
      meditationCount={meditationSessions.length}
      totalMinutes={totalMinutes}
      avgDuration={avgDuration}
      readingCount={readingStats._count}
      totalPages={totalPages}
      avgPages={avgPages}
      recentMeditations={recentMeditations}
      readingSessions={readingSessions.map((s) => ({
        id: s.id,
        bookTitle: s.bookTitle,
        pagesRead: s.pagesRead,
        rating: s.rating,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
      }))}
      bookTitles={bookTitles}
    />
  );
}
