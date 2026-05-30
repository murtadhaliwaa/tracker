import { revalidatePath } from "next/cache";

const LOCALES = ["en", "ar"] as const;

/** Revalidate a route for both locales (segment like "/todos" or "todos"). */
export function revalidateLocalePaths(...segments: string[]) {
  for (const locale of LOCALES) {
    for (const segment of segments) {
      const normalized = segment.startsWith("/") ? segment : `/${segment}`;
      revalidatePath(`/${locale}${normalized}`);
    }
  }
}
