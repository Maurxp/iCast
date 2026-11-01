import {
  DEFAULT_OVERLAY,
  DEFAULT_TEXT_SIZE,
  DEFAULT_RESOLVED_APPEARANCE,
  isValidOverlayStyle,
  isValidTextSize,
  isValidAppearancePreference,
  isValidResolvedAppearance,
  type AppearancePreference,
  type ResolvedAppearance,
} from '../config/themes';
import { StorageService } from './storage-service';

// Appearance architecture — Two official modes: Obsidian (dark) and Porcelain (light).
// Theme switching is an attribute write on <html>:
// `document.documentElement.dataset.theme = resolved` and
// `document.documentElement.dataset.appearance = resolved`.

let systemQueryCleanup: (() => void) | null = null;

/** Detect system appearance via matchMedia with graceful fallback to Obsidian for older engines (Chromium 53). */
export function detectSystemAppearance(): ResolvedAppearance {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DEFAULT_RESOLVED_APPEARANCE;
  }
  try {
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
    if (lightQuery && lightQuery.matches) {
      return 'porcelain';
    }
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkQuery && darkQuery.matches) {
      return 'obsidian';
    }
  } catch (_e) {}
  return DEFAULT_RESOLVED_APPEARANCE;
}

/** Resolve user preference ('system' | 'obsidian' | 'porcelain') to active mode ('obsidian' | 'porcelain'). */
export function resolveAppearance(pref?: AppearancePreference): ResolvedAppearance {
  const effectivePref = isValidAppearancePreference(pref) ? pref : StorageService.getAppearancePreference();
  if (effectivePref === 'porcelain') return 'porcelain';
  if (effectivePref === 'obsidian') return 'obsidian';
  return detectSystemAppearance();
}

/** Apply computed appearance attributes to document root. */
function setAppearanceAttrs(resolved: ResolvedAppearance): void {
  const mode = isValidResolvedAppearance(resolved) ? resolved : DEFAULT_RESOLVED_APPEARANCE;
  document.documentElement.dataset.theme = mode;
  document.documentElement.dataset.appearance = mode;
}

/** Subscribe to system appearance changes when in 'system' mode. */
function ensureSystemListener(): void {
  if (systemQueryCleanup) {
    systemQueryCleanup();
    systemQueryCleanup = null;
  }
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return;
  }
  try {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (): void => {
      if (StorageService.getAppearancePreference() === 'system') {
        setAppearanceAttrs(detectSystemAppearance());
      }
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      systemQueryCleanup = () => {
        try { mql.removeEventListener('change', handler); } catch (_e) {}
      };
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
      systemQueryCleanup = () => {
        try { mql.removeListener(handler); } catch (_e) {}
      };
    }
  } catch (_e) {}
}

/** Apply appearance preference, updating listeners and document root. */
export function applyAppearance(pref?: AppearancePreference | ResolvedAppearance): void {
  const effectivePref = isValidAppearancePreference(pref)
    ? pref
    : (isValidResolvedAppearance(pref) ? pref : StorageService.getAppearancePreference());

  const resolved = resolveAppearance(effectivePref as AppearancePreference);
  setAppearanceAttrs(resolved);

  if (effectivePref === 'system') {
    ensureSystemListener();
  } else if (systemQueryCleanup) {
    systemQueryCleanup();
    systemQueryCleanup = null;
  }
}

/** Temporary preview (no persistence) — used by Settings during navigation/hover. */
export function previewAppearance(prefOrResolved: AppearancePreference | ResolvedAppearance): void {
  const resolved = isValidResolvedAppearance(prefOrResolved)
    ? prefOrResolved
    : resolveAppearance(prefOrResolved as AppearancePreference);
  setAppearanceAttrs(resolved);
}

/** Restore stored appearance (used when leaving Settings without saving). */
export function restoreAppearance(): void {
  applyAppearance(StorageService.getAppearancePreference());
}

/** Backward-compatible alias for applyAppearance. */
export function applyTheme(id: string): void {
  applyAppearance(isValidAppearancePreference(id) ? id : (isValidResolvedAppearance(id) ? id : 'system'));
}

/** Backward-compatible alias for previewAppearance. */
export function previewTheme(id: string): void {
  previewAppearance(isValidAppearancePreference(id) ? id : (isValidResolvedAppearance(id) ? id : 'system'));
}

/** Player overlay glass style → `data-overlay` on document root. */
export function applyOverlayStyle(style: string): void {
  document.documentElement.dataset.overlay = isValidOverlayStyle(style) ? style : DEFAULT_OVERLAY;
}

/** App-wide text size → `data-text-size` on document root. */
export function applyTextSize(size: string): void {
  document.documentElement.dataset.textSize = isValidTextSize(size) ? size : DEFAULT_TEXT_SIZE;
}

/** Re-assert stored appearance, overlay style, and text size on boot. */
export function initTheme(): void {
  applyAppearance(StorageService.getAppearancePreference());
  applyOverlayStyle(StorageService.getOverlayStyle());
  applyTextSize(StorageService.getTextSize());
}
