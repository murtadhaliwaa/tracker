import { NextResponse } from "next/server";
import { getViewerContext, type ViewerContext } from "@/lib/viewer";

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export async function requireApiViewer(): Promise<ViewerContext | NextResponse> {
  const viewer = await getViewerContext();
  if (!viewer || viewer.fallback) {
    return unauthorizedResponse();
  }

  return viewer;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
