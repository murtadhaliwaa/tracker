import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase";
import { provisionUserForAuth, ensureUserResources } from "@/lib/user-provision";
import { prisma } from "@/lib/prisma";

export type ViewerContext = {
  userId: string;
  email: string;
  fallback: boolean;
};

async function resolveViewerContext(): Promise<ViewerContext | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  let user = await prisma.user.findUnique({ where: { email: authUser.email } });
  if (!user) {
    user = await provisionUserForAuth(authUser.email);
  } else {
    await ensureUserResources(user.id);
  }

  return { userId: user.id, email: user.email, fallback: false };
}

/** Cached per-request to avoid duplicate auth + DB lookups in layout and pages. */
export const getViewerContext = cache(resolveViewerContext);
