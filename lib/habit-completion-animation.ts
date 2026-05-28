export function runHabitCompletionAnimation(onEnd: () => void, durationMs = 600) {
  const timer = setTimeout(onEnd, durationMs);
  return () => clearTimeout(timer);
}
