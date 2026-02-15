// metrics.ts
import Color from "colorjs.io";
import * as csstree from "css-tree";
import type { ColorPalette, FontSizes } from "./types";

export type TokenRecord = {
  color: ColorPalette;
  fontSize: FontSizes;
};

export interface MetricsConfig {
  computeColors?: boolean;
  computeFontSizes?: boolean;
  computeSyntax?: boolean;
}

export interface DeltaEPerKey {
  [key: string]: number; // ΔE for that color key
}

export interface RelativeErrorPerKey {
  [key: string]: number; // relative error (0..∞, typically 0..1+)
}

export interface MetricsResult {
  deltaEPerColor: DeltaEPerKey;
  deltaEScoreMean: number | null;
  deltaEScoreMin: number | null;

  colorSyntaxValidityRatio: number;
  colorValidCount: number;
  colorTotalCount: number;

  fontSizeSyntaxValidityRatio: number;
  fontSizeValidCount: number;
  fontSizeTotalCount: number;

  fontSizeRelativeErrorPerKey: RelativeErrorPerKey;
  fontSizeRelativeErrorMean: number | null;
  fontSizeRelativeErrorMax: number | null;
}

/**
 * Try to parse any CSS value using css-tree.
 * Returns true if parsing succeeds, false otherwise.
 */
function isValidCssValue(value: string): boolean {
  try {
    // Parse as a full declaration value
    csstree.parse(value, {
      context: "value",
      positions: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a color string into a Color object using colorjs.io.
 * Returns null if parsing fails.
 */
function parseColorSafe(value: string): Color | null {
  try {
    return new Color(value);
  } catch {
    return null;
  }
}

/**
 * Compute ΔE (CIEDE2000) between two color strings.
 * Returns null if either color cannot be parsed.
 */
function computeDeltaE(pred: string, truth: string): number | null {
  const cPred = parseColorSafe(pred);
  const cTruth = parseColorSafe(truth);
  if (!cPred || !cTruth) return null;

  // convert to LCH or Lab first; colorjs.io can compute deltaE directly via .deltaE()
  return cPred.deltaE(cTruth, "2000");
}

/**
 * Parse a CSS font-size value and return its numeric pixel value.
 * Very simple approach:
 *  - If ends with "px", parse that number.
 *  - Otherwise, try to parse via css-tree and do a best-effort px extraction for simple cases.
 *
 * For more sophisticated use you might plug in a full CSS length parser with root font-size context.
 *
 * Returns null for:
 *  - Unparseable values
 *  - Values equal to 0 (0px or unitless 0)
 *  - Unitless values (use null instead)
 */
function parseFontSizePx(value: string): number | null {
  const trimmed = value.trim();

  // Direct px case
  if (trimmed.endsWith("px")) {
    const num = parseFloat(trimmed.slice(0, -2));
    if (!isFinite(num) || num === 0) return null;
    return num;
  }

  // Unitless values are invalid
  try {
    const ast = csstree.parse(trimmed, { context: "value", positions: false });

    let result: number | null = null;

    csstree.walk(ast, (node) => {
      if (node.type === "Dimension" && node.unit === "px" && result === null) {
        const num = parseFloat(node.value);
        if (isFinite(num) && num !== 0) {
          result = num;
        }
      }
      // Unitless values (Number nodes) are treated as invalid
    });

    return result;
  } catch {
    return null;
  }
}

/**
 * Compute relative error between prediction and ground truth:
 *   |pred - truth| / |truth|
 * If truth is 0, returns null (undefined).
 */
function computeRelativeError(predPx: number, truthPx: number): number | null {
  if (truthPx === 0) return null;
  return Math.abs(predPx - truthPx) / Math.abs(truthPx);
}

/**
 * Helper function to compute mean of an array.
 */
function mean(arr: number[]): number | null {
  return arr.length === 0
    ? null
    : arr.reduce((sum, x) => sum + x, 0) / arr.length;
}

/**
 * Helper function to compute max of an array.
 */
function max(arr: number[]): number | null {
  return arr.length === 0
    ? null
    : arr.reduce((m, x) => (x > m ? x : m), arr[0]);
}

/**
 * Compute color metrics (ΔE) for prediction vs ground truth.
 * Returns null values if no valid color metrics found.
 */
/**
 * Compute a deltaE score from a raw deltaE value.
 * Score = max(0, 100 - deltaE), clamped to [0, 100].
 */
function deltaEToScore(deltaE: number): number {
  return Math.max(0, 100 - deltaE);
}

function computeColorMetrics(
  prediction: ColorPalette,
  groundTruth: ColorPalette
): Pick<MetricsResult, "deltaEPerColor" | "deltaEScoreMean" | "deltaEScoreMin"> {
  const deltaEPerColor: DeltaEPerKey = {};
  const deltaEScores: number[] = [];

  for (const key of Object.keys(groundTruth) as (keyof ColorPalette)[]) {
    const truthValue = groundTruth[key];
    const predValue = prediction[key];

    // Skip if either value is null or undefined
    if (predValue === null || truthValue === null) continue;

    const dE = computeDeltaE(predValue, truthValue);
    if (dE != null && isFinite(dE)) {
      deltaEPerColor[key] = dE;
      deltaEScores.push(deltaEToScore(dE));
    }
  }

  return {
    deltaEPerColor,
    deltaEScoreMean: mean(deltaEScores),
    deltaEScoreMin: deltaEScores.length === 0 ? null : Math.min(...deltaEScores),
  };
}

/**
 * Compute font-size metrics (relative error) for prediction vs ground truth.
 * Returns null values if no valid font-size metrics found.
 */
function computeFontSizeMetrics(
  prediction: FontSizes,
  groundTruth: FontSizes
): Pick<
  MetricsResult,
  | "fontSizeRelativeErrorPerKey"
  | "fontSizeRelativeErrorMean"
  | "fontSizeRelativeErrorMax"
> {
  const fontSizeRelativeErrorPerKey: RelativeErrorPerKey = {};
  const fontSizeRelErrors: number[] = [];

  for (const key of Object.keys(groundTruth)) {
    const truthValue = groundTruth[key];
    const predValue = prediction[key];

    // Skip if either value is null or undefined
    if (predValue === null || truthValue === null) continue;

    const predPx = parseFontSizePx(predValue);
    const truthPx = parseFontSizePx(truthValue);

    if (predPx != null && truthPx != null) {
      const relErr = computeRelativeError(predPx, truthPx);
      if (relErr != null && isFinite(relErr)) {
        fontSizeRelativeErrorPerKey[key] = relErr;
        fontSizeRelErrors.push(relErr);
      }
    }
  }

  return {
    fontSizeRelativeErrorPerKey,
    fontSizeRelativeErrorMean: mean(fontSizeRelErrors),
    fontSizeRelativeErrorMax: max(fontSizeRelErrors),
  };
}

/**
 * Compute syntax validity metrics for prediction vs ground truth.
 */
function computeSyntaxMetrics(prediction: Record<string, string | null>): {
  syntaxValidityRatio: number;
  validCount: number;
  totalCount: number;
} {
  let validCount = 0;
  let totalCount = 0;

  for (const key of Object.keys(prediction)) {
    const value = prediction[key];

    // Only validate non-null values
    if (value !== null && value !== undefined) {
      totalCount++;
      if (isValidCssValue(value)) validCount++;
    }
  }

  const syntaxValidityRatio = totalCount === 0 ? 1 : validCount / totalCount;

  return {
    syntaxValidityRatio,
    validCount,
    totalCount,
  };
}

/**
 * Main metrics function.
 * Computes metrics based on the provided configuration.
 * By default, all metrics are computed (for backward compatibility).
 *
 * @param prediction - Predicted token values
 * @param groundTruth - Ground truth token values
 * @param config - Optional configuration to enable/disable metric types
 * @returns Metrics result with computed fields populated (others as null/empty)
 */
export function computeMetrics(
  prediction: TokenRecord,
  groundTruth: TokenRecord,
  config: MetricsConfig = {
    computeColors: true,
    computeFontSizes: true,
    computeSyntax: true,
  }
): MetricsResult {
  const shouldComputeColors = config.computeColors !== false;
  const shouldComputeFontSizes = config.computeFontSizes !== false;
  const shouldComputeSyntax = config.computeSyntax !== false;

  const colorMetrics = shouldComputeColors
    ? computeColorMetrics(prediction.color, groundTruth.color)
    : { deltaEPerColor: {}, deltaEScoreMean: null, deltaEScoreMin: null };

  const fontSizeMetrics = shouldComputeFontSizes
    ? computeFontSizeMetrics(prediction.fontSize, groundTruth.fontSize)
    : {
        fontSizeRelativeErrorPerKey: {},
        fontSizeRelativeErrorMean: null,
        fontSizeRelativeErrorMax: null,
      };

  const colorSyntaxMetrics = shouldComputeSyntax
    ? computeSyntaxMetrics(
        prediction.color as unknown as Record<string, string | null>
      )
    : { syntaxValidityRatio: 1, validCount: 0, totalCount: 0 };

  const fontSizeSyntaxMetrics = shouldComputeSyntax
    ? computeSyntaxMetrics(prediction.fontSize)
    : { syntaxValidityRatio: 1, validCount: 0, totalCount: 0 };

  return {
    deltaEPerColor: colorMetrics.deltaEPerColor,
    deltaEScoreMean: colorMetrics.deltaEScoreMean,
    deltaEScoreMin: colorMetrics.deltaEScoreMin,

    colorSyntaxValidityRatio: colorSyntaxMetrics.syntaxValidityRatio,
    colorValidCount: colorSyntaxMetrics.validCount,
    colorTotalCount: colorSyntaxMetrics.totalCount,

    fontSizeSyntaxValidityRatio: fontSizeSyntaxMetrics.syntaxValidityRatio,
    fontSizeValidCount: fontSizeSyntaxMetrics.validCount,
    fontSizeTotalCount: fontSizeSyntaxMetrics.totalCount,

    fontSizeRelativeErrorPerKey: fontSizeMetrics.fontSizeRelativeErrorPerKey,
    fontSizeRelativeErrorMean: fontSizeMetrics.fontSizeRelativeErrorMean,
    fontSizeRelativeErrorMax: fontSizeMetrics.fontSizeRelativeErrorMax,
  };
}
