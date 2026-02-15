import Color from 'colorjs.io';

// --- Types ---

export interface ThemePalette {
  // Structural (Safe to Synthesize)
  bg: string;
  surface: string;
  border: string;
  muted: string;
  text: string;
  
  // Identity (Strict Reuse)
  primary: string;
  secondary: string | null;
  accent: string | null;
}

interface ColorAnalysis {
  original: string; // The original hex input
  color: Color;     // The color object for math
  l: number;        // Lightness (0-1) in OKLCH
  c: number;        // Chroma (0-~0.4) in OKLCH
  h: number;        // Hue (0-360)
}

// --- Configuration ---

// Thresholds for deciding if a color is neutral or chromatic
const CHROMA_THRESHOLD = 0.04; 
const HUE_CLUSTER_TOLERANCE = 60; // Degrees

// --- Helper Functions ---

/**
 * Mixes two colors in the Perceptual OKLCH space.
 * @param base The starting color
 * @param tint The color to mix in
 * @param amount 0 to 1 (e.g., 0.05 is 5%)
 */
function mixColors(base: Color, tint: Color, amount: number): string {
  // We use OKLCH for mixing because it preserves perceptual brightness better than RGB
  return base.mix(tint, amount, { space: 'oklch' }).toString({ format: 'hex' });
}

/**
 * Analyzes a raw list of hex strings and maps them to a semantic palette.
 * Prioritizes visual hierarchy for structural elements (generating if needed)
 * and brand identity for chromatic elements (strict reuse).
 */
export function extractUnmatchedColors(hexCodes: string[], isDarkMode = false): ThemePalette {
  
  // 1. Parse and Analyze Phase
  const pool: ColorAnalysis[] = [];
  
  // Dedup and Parse
  const uniqueHex = [...new Set(hexCodes)];
  
  uniqueHex.forEach(hex => {
    try {
      const color = new Color(hex);
      const oklch = color.to('oklch');
      pool.push({
        original: hex,
        color: color,
        l: oklch.coords[0],
        c: oklch.coords[1],
        h: oklch.coords[2] || 0
      });
    } catch (e) {
      // invalid color, skip
    }
  });

  if (pool.length === 0) {
    throw new Error("No valid colors provided.");
  }

  // 2. Segmentation: Neutrals vs Chromatics
  const neutrals = pool.filter(c => c.c < CHROMA_THRESHOLD).sort((a, b) => a.l - b.l);
  const chromatics = pool.filter(c => c.c >= CHROMA_THRESHOLD);

  // --- STRUCTURAL MAPPING (Neutrals) ---
  // Strategy: Hierarchy > strict reuse. Synthesize if gaps exist.

  // Failsafe: Create artificial Black/White if strictly missing
  if (neutrals.length === 0) {
     const mk = (h: string) => ({ original: h, color: new Color(h), l:0, c:0, h:0 });
     neutrals.push(mk('#000000'), mk('#ffffff'));
  }
  if (neutrals.length === 1) {
     const n = neutrals[0];
     const contrast = n.l > 0.5 ? '#000000' : '#ffffff';
     neutrals.push({ original: contrast, color: new Color(contrast), l:0, c:0, h:0 });
     neutrals.sort((a, b) => a.l - b.l);
  }

  // Define Anchors based on mode
  // Dark Mode: bg is dark (index 0), text is light (index end)
  // Light Mode: bg is light (index end), text is dark (index 0)
  const bgObj   = isDarkMode ? neutrals[0] : neutrals[neutrals.length - 1];
  const textObj = isDarkMode ? neutrals[neutrals.length - 1] : neutrals[0];

  // A. Surface (Card Background)
  // Needs to be distinguishable from BG.
  // Reuse if: We have a color ~5-10% L away from BG.
  // Synthesize if: No color exists or the gap is too wide.
  let surfaceHex: string;
  const idealSurfaceL = isDarkMode ? bgObj.l + 0.05 : bgObj.l - 0.05;
  const existingSurface = neutrals.find(n => Math.abs(n.l - idealSurfaceL) < 0.03 && n !== bgObj && n !== textObj);
  
  if (existingSurface) {
    surfaceHex = existingSurface.original;
  } else {
    // Generate: Mix 5% of text color into BG (creates a perfect subtle tint)
    surfaceHex = mixColors(bgObj.color, textObj.color, 0.05); 
  }

  // B. Border
  // Needs 3:1 contrast against BG roughly, or just visible definition.
  // Usually ~15-20% mix strength.
  let borderHex: string;
  const idealBorderL = isDarkMode ? bgObj.l + 0.15 : bgObj.l - 0.15;
  const existingBorder = neutrals.find(n => Math.abs(n.l - idealBorderL) < 0.05 && n !== bgObj && n !== textObj);

  if (existingBorder) {
    borderHex = existingBorder.original;
  } else {
    // Generate: Mix 15% of Text into BG
    borderHex = mixColors(bgObj.color, textObj.color, 0.15);
  }

  // C. Muted Text
  // Needs to be readable. Usually ~30-40% "faded".
  let mutedHex: string;
  const idealMutedL = isDarkMode ? textObj.l - 0.3 : textObj.l + 0.3; // Closer to bg
  const existingMuted = neutrals.find(n => Math.abs(n.l - idealMutedL) < 0.1 && n !== bgObj && n !== textObj);

  if (existingMuted) {
    mutedHex = existingMuted.original;
  } else {
    // Generate: Mix 35% of BG into Text (fades the text)
    mutedHex = mixColors(textObj.color, bgObj.color, 0.35);
  }


  // --- IDENTITY MAPPING (Chromatics) ---
  // Strategy: Strict Reuse. Do not synthesize brand colors.

  // 1. Cluster colors by Hue
  const clusters: ColorAnalysis[][] = [];
  
  chromatics.forEach(c => {
    const match = clusters.find(cluster => {
      const clusterH = cluster[0].h;
      const diff = Math.abs(c.h - clusterH);
      const wrappedDiff = Math.min(diff, 360 - diff);
      return wrappedDiff < HUE_CLUSTER_TOLERANCE;
    });
    if (match) match.push(c);
    else clusters.push([c]);
  });

  // 2. Rank Clusters: Size -> Avg Chroma
  clusters.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length; // Size wins
    // If size equal, pick the one with higher avg vibrancy
    const avgCa = a.reduce((sum, i) => sum + i.c, 0) / a.length;
    const avgCb = b.reduce((sum, i) => sum + i.c, 0) / b.length;
    return avgCb - avgCa;
  });

  const primaryCluster = clusters[0] || [];
  const secondaryCluster = clusters[1] || [];
  const accentCluster = clusters[2] || [];

  // Helper: Pick the "Brand Representative" from a cluster
  // We prefer high chroma, but not extremely dark/light (which are usually hovers)
  const pickBestBrandColor = (cluster: ColorAnalysis[]): string | null => {
    if (cluster.length === 0) return null;
    // Sort by Chroma (Vibrancy) Descending
    const sorted = [...cluster].sort((a, b) => b.c - a.c);
    return sorted[0].original;
  };

  const primaryHex = pickBestBrandColor(primaryCluster);
  const secondaryHex = pickBestBrandColor(secondaryCluster);
  const accentHex = pickBestBrandColor(accentCluster);

  // Fallback if NO primary color exists (Monochrome theme)
  // We use the text color as primary (common in luxury/minimalist brands)
  // or a safe default blue if you prefer.
  const finalPrimary = primaryHex || textObj.original;

  return {
    bg: bgObj.original,
    surface: surfaceHex,
    border: borderHex,
    muted: mutedHex,
    text: textObj.original,
    
    primary: finalPrimary,
    secondary: secondaryHex,
    accent: accentHex
  };
}