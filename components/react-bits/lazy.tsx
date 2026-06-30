"use client";

import { Suspense, lazy, type ComponentProps } from "react";

/**
 * Lazy wrappers for the framer-motion–backed text effects.
 *
 * These components ship `motion/react` (~50KB) which would otherwise be pulled
 * into the initial bundle of every page (page header, level-up modal, etc.).
 * Loading them lazily keeps `motion` off the critical path: the plain text is
 * rendered immediately (SSR + first paint) and the animation enhances it once
 * its chunk has loaded.
 */

const BlurTextImpl = lazy(() => import("@/components/BlurText"));
const ShinyTextImpl = lazy(() => import("@/components/ShinyText"));

type BlurTextProps = ComponentProps<typeof BlurTextImpl>;
type ShinyTextProps = ComponentProps<typeof ShinyTextImpl>;

export function LazyBlurText({ text = "", className = "", ...rest }: BlurTextProps) {
  return (
    <Suspense fallback={<p className={`blur-text ${className} flex flex-wrap`}>{text}</p>}>
      <BlurTextImpl text={text} className={className} {...rest} />
    </Suspense>
  );
}

export function LazyShinyText({ text, className = "", color, ...rest }: ShinyTextProps) {
  return (
    <Suspense fallback={<span className={className} style={color ? { color } : undefined}>{text}</span>}>
      <ShinyTextImpl text={text} className={className} color={color} {...rest} />
    </Suspense>
  );
}
