"use server";

import { getViewerContext } from "@/lib/viewer";

export async function requireViewer() {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Unauthorized");
  }
  return viewer;
}
