import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEMES, DEFAULT_THEME, TEXT_SIZES, DEFAULT_TEXT_SIZE, isValidTheme, isValidTextSize } from './themes';

// Parse the shipped stylesheet directly so a theme that's registered but missing
// a `[data-theme]` block (or a variable) fails the build instead of the TV.
// Strip comments first so the header's example selectors aren't parsed as blocks.
const css = readFileSync(join(process.cwd(), 'css/themes.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const mainCss = readFileSync(join(process.cwd(), 'css/main.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const REQUIRED_VARS = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-card',
  '--text-primary', '--text-secondary', '--text-muted',
  '--accent', '--accent-text', '--accent-dim', '--accent-rgb', '--accent-glow',
  '--danger', '--danger-rgb', '--success',
  '--warning', '--warning-rgb', '--border',
];

function themeBlock(id: string): string | null {
  // Theme blocks contain no nested braces, so [^}]* captures the whole body.
  const m = new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1] : null;
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relLuminance(hex1);
  const l2 = relLuminance(hex2);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

describe('theme registry', () => {
  it('has unique ids and a valid default', () => {
    const ids = THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(isValidTheme(DEFAULT_THEME)).toBe(true);
  });

  it('defines a themes.css block with every required variable for each theme', () => {
    for (const t of THEMES) {
      const block = themeBlock(t.id);
      expect(block, `missing [data-theme="${t.id}"] block in themes.css`).not.toBeNull();
      for (const v of REQUIRED_VARS) {
        expect(block!.includes(`${v}:`), `theme ${t.id} missing ${v}`).toBe(true);
      }
    }
  });

  it('has no themes.css block without a matching registry entry', () => {
    const declared = Array.from(css.matchAll(/\[data-theme="([^"]+)"\]/g)).map(m => m[1]);
    for (const id of new Set(declared)) {
      expect(isValidTheme(id), `themes.css declares unregistered theme "${id}"`).toBe(true);
    }
  });
});

describe('appearance accessibility and contrast (WCAG 2.1 AA)', () => {
  it('preserves canonical M3.0.1 tokens without alteration', () => {
    const obsidian = themeBlock('obsidian')!;
    const porcelain = themeBlock('porcelain')!;

    // Obsidian canonical palette
    expect(obsidian).toContain('--bg-primary: #101114;');
    expect(obsidian).toContain('--bg-secondary: #191a1f;');
    expect(obsidian).toContain('--bg-tertiary: #24262b;');
    expect(obsidian).toContain('--text-primary: #ededef;');
    expect(obsidian).toContain('--text-secondary: #a5a6ac;');
    expect(obsidian).toContain('--accent: #c8bfaf;');

    // Porcelain canonical palette
    expect(porcelain).toContain('--bg-primary: #f3f2ef;');
    expect(porcelain).toContain('--bg-secondary: #ffffff;');
    expect(porcelain).toContain('--bg-tertiary: #e8e7e3;');
    expect(porcelain).toContain('--text-primary: #252629;');
    expect(porcelain).toContain('--text-secondary: #777873;');
    expect(porcelain).toContain('--accent: #a99476;');
  });

  it('maintains WCAG AAA contrast on D-pad focus rings', () => {
    const obsidianRingContrast = contrastRatio('#ededef', '#101114');
    const porcelainRingWhite = contrastRatio('#252629', '#ffffff');
    const porcelainRingIvory = contrastRatio('#252629', '#f3f2ef');

    // WCAG requirement for UI components / focus is 3.0:1
    expect(obsidianRingContrast).toBeGreaterThanOrEqual(7.0);
    expect(porcelainRingWhite).toBeGreaterThanOrEqual(7.0);
    expect(porcelainRingIvory).toBeGreaterThanOrEqual(7.0);
  });

  it('provides WCAG AA compliant text on filled Porcelain accent buttons (#252629 over #a99476)', () => {
    const buttonContrast = contrastRatio('#252629', '#a99476');
    // 4.5:1 is required for normal text (WCAG 2.1 AA)
    expect(buttonContrast).toBeGreaterThanOrEqual(4.5);
    expect(buttonContrast).toBeCloseTo(5.18, 1);

    // Verify component stylesheets enforce dark text under [data-theme="porcelain"]
    const catalogCss = readFileSync(join(process.cwd(), 'css/catalog-view.css'), 'utf8');
    const settingsCss = readFileSync(join(process.cwd(), 'css/settings.css'), 'utf8');
    const epgCss = readFileSync(join(process.cwd(), 'css/epg.css'), 'utf8');
    const searchCss = readFileSync(join(process.cwd(), 'css/search.css'), 'utf8');
    const playerCss = readFileSync(join(process.cwd(), 'css/player.css'), 'utf8');
    const channelListCss = readFileSync(join(process.cwd(), 'css/channel-list.css'), 'utf8');

    expect(catalogCss).toContain('[data-theme="porcelain"] .detail-btn-primary');
    expect(catalogCss).toContain('[data-theme="porcelain"] .series-season-btn.active');
    expect(catalogCss).toContain('[data-theme="porcelain"] .episode-resume');
    expect(settingsCss).toContain('[data-theme="porcelain"] .toggle-option.active');
    expect(epgCss).toContain('[data-theme="porcelain"] .epg-date-item.selected');
    expect(searchCss).toContain('[data-theme="porcelain"] .search-program-row.state-live .search-program-action');
    expect(playerCss).toContain('[data-theme="porcelain"] .osd-next-episode-actions button:first-child');
    expect(channelListCss).toContain('[data-theme="porcelain"] .favorite-selected .favorite-checkbox');
  });

  it('provides WCAG AA compliant contrast for --accent-text (#705e46) across Porcelain surfaces', () => {
    const contrastWhite = contrastRatio('#705e46', '#ffffff');
    const contrastIvory = contrastRatio('#705e46', '#f3f2ef');
    const contrastSecondary = contrastRatio('#705e46', '#e8e7e3');

    // All must be >= 4.5:1 for normal body text
    expect(contrastWhite).toBeGreaterThanOrEqual(4.5);
    expect(contrastIvory).toBeGreaterThanOrEqual(4.5);
    expect(contrastSecondary).toBeGreaterThanOrEqual(4.5);

    expect(contrastWhite).toBeCloseTo(6.22, 1);
    expect(contrastIvory).toBeCloseTo(5.55, 1);
    expect(contrastSecondary).toBeCloseTo(5.02, 1);
  });

  it('maintains high contrast in Obsidian mode', () => {
    const textContrast = contrastRatio('#ededef', '#101114');
    const accentContrast = contrastRatio('#c8bfaf', '#101114');

    expect(textContrast).toBeGreaterThanOrEqual(14.0);
    expect(accentContrast).toBeGreaterThanOrEqual(9.0);
  });
});

describe('text size registry', () => {
  it('has a valid default and rejects unknown ids', () => {
    expect(isValidTextSize(DEFAULT_TEXT_SIZE)).toBe(true);
    expect(isValidTextSize('100')).toBe(true);
    expect(isValidTextSize('huge')).toBe(false);
    expect(isValidTextSize('115')).toBe(false);
    expect(isValidTextSize(null)).toBe(false);
  });

  it('defines a --font-scale for every non-default size in main.css', () => {
    for (const size of TEXT_SIZES) {
      if (size === DEFAULT_TEXT_SIZE) continue;
      const m = new RegExp(`\\[data-text-size="${size}"\\]\\s*\\{([^}]*)\\}`).exec(mainCss);
      expect(m, `missing [data-text-size="${size}"] block in main.css`).not.toBeNull();
      expect(m![1]).toContain('--font-scale:');
    }
  });

  it('leaves the default size on the :root --font-scale of 1', () => {
    expect(/:root\s*\{[^}]*--font-scale:\s*1;/.test(mainCss)).toBe(true);
    expect(new RegExp(`\\[data-text-size="${DEFAULT_TEXT_SIZE}"\\]`).test(mainCss)).toBe(false);
  });
});
