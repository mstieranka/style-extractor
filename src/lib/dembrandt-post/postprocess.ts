import type { ThemePalette } from "../extractor/types";

interface DembrandtColorData {
  semantic: Record<string, string>;
  palette: Array<{
    color: string;
    normalized: string;
    count: number;
    confidence: "high" | "medium" | "low";
    sources: string[];
  }>;
  cssVariables?: Record<string, string>;
}

// Parse color to get lightness (0-100) and saturation (0-100)
function parseColorProperties(color: string): {
  lightness: number;
  saturation: number;
} | null {
  // Handle hex colors
  let r: number, g: number, b: number;

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return null;
    }
  } else if (color.startsWith("rgb")) {
    const match = color.match(/rgba?\((\d+),?\s*(\d+),?\s*(\d+)/);
    if (!match) return null;
    r = parseInt(match[1]);
    g = parseInt(match[2]);
    b = parseInt(match[3]);
  } else {
    return null;
  }

  // Convert to HSL
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = ((max + min) / 2) * 100;

  let saturation = 0;
  if (max !== min) {
    const d = max - min;
    saturation = (lightness > 50 ? d / (2 - max - min) : d / (max + min)) * 100;
  }

  return { lightness, saturation };
}

// Normalize color to uppercase hex
function normalizeToHex(color: string): string {
  if (color.startsWith("#")) {
    return color.toUpperCase();
  }
  if (color.startsWith("rgb")) {
    const match = color.match(/rgba?\((\d+),?\s*(\d+),?\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
    }
  }
  return color;
}

export function getColorPaletteFromDembrandt(
  data: DembrandtColorData,
): ThemePalette {
  const { semantic, palette, cssVariables = {} } = data;

  const confidenceValue = (c: "high" | "medium" | "low") =>
    c === "high" ? 3 : c === "medium" ? 2 : 1;

  // Helper: find color from CSS variables by keyword patterns
  const findInCssVars = (...patterns: string[]): string | null => {
    for (const [varName, value] of Object.entries(cssVariables)) {
      const lowerName = varName.toLowerCase();
      for (const pattern of patterns) {
        if (lowerName.includes(pattern.toLowerCase())) {
          return value;
        }
      }
    }
    return null;
  };

  // Helper: find color from palette by source keywords
  const findInPalette = (...keywords: string[]): string | null => {
    const matches = palette.filter((entry) => {
      const sourcesLower = entry.sources.map((s) => s.toLowerCase()).join(" ");
      return keywords.some((k) => sourcesLower.includes(k.toLowerCase()));
    });
    if (matches.length === 0) return null;

    // Prefer entries with higher confidence, then higher count, then saturation
    matches.sort((a, b) => {
      const ca = confidenceValue(a.confidence);
      const cb = confidenceValue(b.confidence);
      if (cb !== ca) return cb - ca;
      if (b.count !== a.count) return b.count - a.count;
      const pa = parseColorProperties(a.normalized || a.color);
      const pb = parseColorProperties(b.normalized || b.color);
      const sa = pa?.saturation ?? 0;
      const sb = pb?.saturation ?? 0;
      return sb - sa;
    });

    return matches[0].normalized || matches[0].color;
  };

  // Helper: find colors by lightness range
  const findByLightness = (
    minL: number,
    maxL: number,
    preferSaturated = false,
  ): string | null => {
    const matches = palette
      .map((entry) => {
        const props = parseColorProperties(entry.normalized || entry.color);
        return props ? { ...entry, ...props } : null;
      })
      .filter(
        (e): e is NonNullable<typeof e> =>
          e !== null && e.lightness >= minL && e.lightness <= maxL,
      )
      .sort((a, b) => {
        const ca = confidenceValue(a.confidence);
        const cb = confidenceValue(b.confidence);
        if (cb !== ca) return cb - ca;
        if (preferSaturated) {
          return b.saturation - a.saturation || b.count - a.count;
        }
        return b.count - a.count;
      });

    return matches[0]?.normalized || matches[0]?.color || null;
  };

  // Helper: find hover/focus variant for a base color
  const findHoverVariant = (baseColor: string | null): string | null => {
    if (!baseColor) return null;
    const baseProps = parseColorProperties(baseColor);
    if (!baseProps) return null;

    // Look for hover/focus colors that are darker/lighter variants
    const hoverColors = palette.filter((e) =>
      e.sources.some(
        (s) =>
          s.toLowerCase().includes("hover") ||
          s.toLowerCase().includes("focus"),
      ),
    );

    for (const entry of hoverColors) {
      const entryProps = parseColorProperties(entry.normalized || entry.color);
      if (!entryProps) continue;

      // Check if it's a variant (similar saturation, different lightness)
      const satDiff = Math.abs(entryProps.saturation - baseProps.saturation);
      const lightDiff = Math.abs(entryProps.lightness - baseProps.lightness);

      if (satDiff < 30 && lightDiff > 5 && lightDiff < 40) {
        return entry.normalized || entry.color;
      }
    }
    return null;
  };

  // Build results - checking multiple sources in priority order
  const getBackground = (): string[] | null => {
    const result =
      findInCssVars("background", "bg-color", "canvas") ||
      findInPalette("background", "canvas", "body") ||
      findByLightness(90, 100, false); // Very light colors
    return result ? [result] : null;
  };

  const getSurface = (): string[] | null => {
    const result =
      findInCssVars("surface", "card", "container") ||
      findInPalette("surface", "card", "container", "primary-container") ||
      findByLightness(85, 98, false);
    return result ? [result] : null;
  };

  const getText = (): string[] | null => {
    const result =
      findInCssVars("text", "foreground", "fg") ||
      findInPalette("text", "body-text", "heading") ||
      findByLightness(0, 20, false); // Very dark colors
    return result ? [result] : null;
  };

  const getMuted = (): string[] | null => {
    const result =
      findInCssVars("muted", "secondary", "subtle") ||
      findInPalette("secondary", "muted", "subtle", "section-link") ||
      findByLightness(20, 50, false);
    return result ? [result] : null;
  };

  const getPrimary = (): string[] | null => {
    // Check CSS variables first for primary
    const fromVars = findInCssVars("primary", "brand", "accent");
    if (fromVars) return [fromVars];

    // Check semantic
    if (semantic.primary) {
      // But semantic.primary might be a container color, not the actual primary
      // Look for saturated colors from buttons/links first
      const fromButtons = findInPalette("button", "btn", "cta", "skip-link");
      if (fromButtons) {
        const props = parseColorProperties(fromButtons);
        if (props && props.saturation > 30) {
          return [fromButtons];
        }
      }
    }

    // Find most saturated high-count color
    const saturated = findByLightness(20, 80, true);
    return saturated ? [saturated] : null;
  };

  const getPrimaryVariant = (): string[] | null => {
    const primary = getPrimary()?.[0] ?? null;
    const result =
      findInCssVars("primary-variant", "primary-hover", "accent-hover") ||
      // try any css variable containing 'primary' that's different from the primary value
      ((): string | null => {
        const lowerPrimary = (primary || "").toLowerCase();
        for (const [varName, value] of Object.entries(cssVariables)) {
          if (varName.toLowerCase().includes("primary")) {
            if ((value || "").toLowerCase() !== lowerPrimary) return value;
          }
        }
        return null;
      })() ||
      findHoverVariant(primary);

    return result ? [result] : null;
  };

  const getBorder = (): string[] | null => {
    const result =
      findInCssVars("border", "divider", "separator", "outline") ||
      findInPalette("border", "divider", "separator") ||
      findByLightness(80, 95, false);
    return result ? [result] : null;
  };

  const getDanger = (): string[] | null => {
    const result =
      findInCssVars("danger", "error", "destructive", "red") ||
      findInPalette("danger", "error", "destructive", "alert");
    return result ? [result] : null;
  };

  const getDangerVariant = (): string[] | null => {
    const danger = getDanger()?.[0] ?? null;
    const result =
      findInCssVars("danger-variant", "error-hover") ||
      findHoverVariant(danger);
    return result ? [result] : null;
  };

  const getLink = (): string[] | null => {
    const result =
      findInCssVars("link", "anchor") ||
      findInPalette("link", "anchor", "ms-rte-link", "cta");
    // Fall back to primary if no explicit link color
    return result ? [result] : getPrimary();
  };

  const getLinkVariant = (): string[] | null => {
    const link = getLink()?.[0] ?? null;
    const result =
      findInCssVars("link-variant", "link-hover", "visited") ||
      findHoverVariant(link);
    return result ? [result] : null;
  };

  const getRing = (): string[] | null => {
    const result =
      findInCssVars("ring", "focus-ring", "focus", "outline-color") ||
      findInPalette("focus", "ring", "outline");
    // Fall back to text color for focus rings
    return result ? [result] : getText();
  };

  return {
    background: getBackground(),
    surface: getSurface(),
    text: getText(),
    muted: getMuted(),
    primary: getPrimary(),
    primaryVariant: getPrimaryVariant(),
    border: getBorder(),
    danger: getDanger(),
    dangerVariant: getDangerVariant(),
    link: getLink(),
    linkVariant: getLinkVariant(),
    ring: getRing(),
  };
}
