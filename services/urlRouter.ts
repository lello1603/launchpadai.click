/**
 * Path-based routing (best practice: one domain, paths like /quiz, /vault).
 * Same behaviour in dev and production: launchpadai.click/quiz, launchpadai.click/vault.
 */

import { AppStep } from '../types';

/** LocalStorage keys for state restored on page refresh (e.g. on /dashboard, /upload). */
export const ROUTER_STORAGE = {
  QUIZ: 'launchpad_quiz',
  ACTIVE_PROJECT_ID: 'launchpad_active_project_id',
  BRIEF: 'launchpad_brief',
  PROTOTYPE: 'launchpad_prototype',
} as const;

const STEP_TO_PATH: Record<AppStep, string> = {
  [AppStep.LANDING]: '/',
  [AppStep.QUIZ]: '/quiz',
  [AppStep.UPLOAD]: '/upload',
  [AppStep.GENERATING]: '/upload',
  [AppStep.REPAIRING]: '/dashboard',
  [AppStep.DASHBOARD]: '/dashboard',
  [AppStep.VAULT]: '/vault',
  [AppStep.AUTH]: '/',
  [AppStep.ADMIN]: '/',
};

/** Get current step from URL path (e.g. /quiz → QUIZ). */
export function getStepFromLocation(): AppStep {
  if (typeof window === 'undefined') return AppStep.LANDING;
  const path = (window.location.pathname.replace(/\/$/, '') || '/');
  const step = (Object.entries(STEP_TO_PATH) as [AppStep, string][]).find(([, p]) => p === path);
  return step ? step[0] : AppStep.LANDING;
}

/** Get full URL for a step (same origin + path). */
export function getUrlForStep(step: AppStep, query?: Record<string, string>): string {
  if (typeof window === 'undefined') return '#';
  const path = STEP_TO_PATH[step];
  const q = query && Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : '';
  return `${window.location.origin}${path}${q}`;
}

/** Whether this step has its own path (so we update URL when navigating). */
export function stepHasOwnUrl(step: AppStep): boolean {
  return step === AppStep.LANDING || step === AppStep.QUIZ || step === AppStep.UPLOAD || step === AppStep.DASHBOARD || step === AppStep.VAULT;
}

/** Navigate to a step: update URL with pushState and run callback (no full page reload). */
export function navigateToStep(step: AppStep, query?: Record<string, string>, onNavigate?: () => void): void {
  if (typeof window === 'undefined') return;
  const path = STEP_TO_PATH[step];
  const q = query && Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : '';
  const url = `${path}${q}`;
  window.history.pushState({ step }, '', url);
  onNavigate?.();
}

/** Sync URL path when step changes internally (e.g. after generation). */
export function syncPathToStep(step: AppStep): void {
  if (typeof window === 'undefined') return;
  const path = STEP_TO_PATH[step];
  const current = (window.location.pathname.replace(/\/$/, '') || '/');
  if (current !== path) {
    window.history.replaceState({ step }, '', path);
  }
}
