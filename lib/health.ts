export type HealthState = {
  currentHealth: number;
  maxHealth: number;
  isWounded: boolean;
};

export function applyHealthPenalty(state: HealthState, consecutiveMissedDays: number): HealthState {
  if (consecutiveMissedDays < 2) return state;

  const nextHealth = Math.max(0, state.currentHealth - 1);
  return {
    ...state,
    currentHealth: nextHealth,
    isWounded: nextHealth === 0,
  };
}

export function recoverHealth(state: HealthState): HealthState {
  const recovered = Math.min(state.maxHealth, state.currentHealth + 1);
  return {
    ...state,
    currentHealth: recovered,
    isWounded: recovered === 0,
  };
}
