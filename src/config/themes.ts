// Appearance architecture — Two official modes: Obsidian (dark) and Porcelain (light).
// Theme values live in `css/themes.css` as `[data-theme="<id>"]` blocks
// (single source of truth).

export type AppearancePreference = 'system' | 'obsidian' | 'porcelain';
export const APPEARANCE_PREFERENCES: readonly AppearancePreference[] = ['system', 'obsidian', 'porcelain'] as const;
export const DEFAULT_APPEARANCE_PREFERENCE: AppearancePreference = 'system';

export type ResolvedAppearance = 'obsidian' | 'porcelain';
export const DEFAULT_RESOLVED_APPEARANCE: ResolvedAppearance = 'obsidian';
export const DEFAULT_THEME: ResolvedAppearance = 'obsidian';

export interface ThemeMeta {
  id: ResolvedAppearance;
  name: string;
  isLight: boolean;
}

export interface AppearanceOption {
  id: AppearancePreference;
  nameKey: string;
  descKey: string;
  previewClass: string;
}

export const APPEARANCE_OPTIONS: AppearanceOption[] = [
  { id: 'system', nameKey: 'settings.appearanceAuto', descKey: 'settings.appearanceAutoDesc', previewClass: 'auto' },
  { id: 'obsidian', nameKey: 'settings.appearanceObsidian', descKey: 'settings.appearanceObsidianDesc', previewClass: 'obsidian' },
  { id: 'porcelain', nameKey: 'settings.appearancePorcelain', descKey: 'settings.appearancePorcelainDesc', previewClass: 'porcelain' },
];

// The two official appearances of iCast
export const THEMES: ThemeMeta[] = [
  { id: 'obsidian', name: 'Obsidian', isLight: false },
  { id: 'porcelain', name: 'Porcelain', isLight: true },
];

export function isValidTheme(id: string | null | undefined): id is ResolvedAppearance {
  return id === 'obsidian' || id === 'porcelain';
}

export function isValidAppearancePreference(v: unknown): v is AppearancePreference {
  return v === 'system' || v === 'obsidian' || v === 'porcelain';
}

export function isValidResolvedAppearance(v: unknown): v is ResolvedAppearance {
  return v === 'obsidian' || v === 'porcelain';
}

// Player overlay glass style (OSD / sidebar / menu). 'dark' = dark-glass on every
// theme (default, universally readable over video); 'frosted' = a light-glass
// variant. See css/player.css.
export type OverlayStyle = 'dark' | 'frosted';
export const DEFAULT_OVERLAY: OverlayStyle = 'dark';
export const OVERLAY_STYLES: { value: OverlayStyle; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'frosted', label: 'Frosted' },
];

export function isValidOverlayStyle(v: string | null | undefined): v is OverlayStyle {
  return v === 'dark' || v === 'frosted';
}

// App-wide text size, as a percentage id. The scale factors live in
// `css/main.css` as `[data-text-size="<id>"]` blocks driving `--font-scale`,
// which PostCSS multiplies into pixel `font-size` declarations at build time.
// 100 is the baseline and needs no block.
export const TEXT_SIZES = ['80', '90', '100', '110', '120', '130', '140', '150'] as const;
export type TextSize = typeof TEXT_SIZES[number];
export const DEFAULT_TEXT_SIZE: TextSize = '100';

export function isValidTextSize(v: string | null | undefined): v is TextSize {
  return TEXT_SIZES.indexOf(v as TextSize) !== -1;
}
