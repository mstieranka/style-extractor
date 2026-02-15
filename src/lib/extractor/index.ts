/**
 * Color extraction from CSS
 * Main entry point that orchestrates all extraction modules
 */

import * as csstree from "css-tree";
import type { ThemePalette, ColorCandidate } from "./types";
import { collectCssVariables } from "./variables";
import { collectCandidates } from "./collect";
import {
  filterCandidatesByMode,
  dedupCandidates,
  dedupByDeltaE,
  fallbackDanger,
} from "./filter";
import { getSortedForPurpose } from "./select";
import { getContrastRatio } from "./colorUtils";
import { getHue, getSaturation } from "./colorUtils";
import {
  CONTRAST_BOOST_ENABLED,
  CONTRAST_MIN_RATIO,
  CONTRAST_BOOST_MAGNITUDE,
  CONTRAST_NUM_BACKGROUNDS,
  DELTA_E_DEDUP_THRESHOLD,
  LIGHTNESS_THRESHOLD_PRIMARY_VARIANT,
  HUE_DIFF_SIMILAR,
  HUE_DIFF_VERY_SIMILAR,
  HUE_DIFF_LINK_VARIANT,
  SATURATION_THRESHOLD_PRIMARY_VARIANT,
  LIGHTNESS_DIFF_LINK_VARIANT_MIN,
  LIGHTNESS_DIFF_LINK_VARIANT_MAX,
  SCORE_PRIMARY_VARIANT_BASE,
  SCORE_PRIMARY_VARIANT_HUE_DIVISOR,
  SCORE_LINK_VARIANT_FALLBACK,
  DELTA_E_SIMILAR,
} from "./constants";

// Re-export types for convenience
export type { ThemePalette, ColorCandidate } from "./types";

/**
 * Check if a color is perceptually similar to text or background colors.
 * Used to detect intentionally unstyled links (styled same as body text).
 */
function isColorSimilarToTextOrBg(
  colorCandidate: ColorCandidate,
  palette: ThemePalette,
  candidates: Record<keyof ThemePalette, ColorCandidate[]>,
): boolean {
  if (!colorCandidate?.colorObj) return false;

  // Check similarity to text
  if (palette.text && palette.text.length > 0) {
    const topTextCandidate = candidates.text.find(
      (c) => c.value === palette.text?.[0],
    );
    if (topTextCandidate?.colorObj) {
      const deltaE = colorCandidate.colorObj.deltaE(
        topTextCandidate.colorObj,
        "2000",
      );
      if (deltaE < DELTA_E_SIMILAR) return true;
    }
  }

  // Check similarity to background
  if (palette.background && palette.background.length > 0) {
    const topBgCandidate = candidates.background.find(
      (c) => c.value === palette.background?.[0],
    );
    if (topBgCandidate?.colorObj) {
      const deltaE = colorCandidate.colorObj.deltaE(
        topBgCandidate.colorObj,
        "2000",
      );
      if (deltaE < DELTA_E_SIMILAR) return true;
    }
  }

  return false;
}

/**
 * Adjust link palette to handle edge cases:
 * 1. Intentionally unstyled links (link color same as text/background) → set to null
 * 2. Container variants being selected as links → prefer actual primary color
 * 3. No link found → fallback to primary
 */
function adjustLinkPalette(
  palette: ThemePalette,
  candidates: Record<keyof ThemePalette, ColorCandidate[]>,
): void {
  if (palette.link && palette.link.length > 0) {
    const topLink = palette.link[0];
    const topLinkCandidate = candidates.link.find((c) => c.value === topLink);

    // Case 1: Link is intentionally styled same as text/background
    if (
      topLinkCandidate &&
      isColorSimilarToTextOrBg(topLinkCandidate, palette, candidates)
    ) {
      palette.link = null;
      return;
    }

    // Case 2: Link candidate is a "container" variant but primary is not
    // Prefer using actual primary color for better consistency
    if (palette.primary && topLinkCandidate?.varName) {
      const topPrimary = palette.primary[0];
      const topPrimaryCandidate = candidates.primary.find(
        (c) => c.value === topPrimary,
      );

      const linkIsContainer = topLinkCandidate.varName
        .toLowerCase()
        .includes("container");
      const primaryIsNotContainer =
        topPrimaryCandidate?.varName &&
        !topPrimaryCandidate.varName.toLowerCase().includes("container");

      if (linkIsContainer && primaryIsNotContainer) {
        // Replace link with primary
        palette.link = [
          topPrimary,
          ...palette.link.filter((c) => c !== topPrimary),
        ];
      }
    }
  } else if (!palette.link && palette.primary) {
    // Case 3: No link found at all, use primary as fallback
    palette.link = palette.primary;
  }
}

/**
 * Extract a color palette from CSS string
 * @param cssString - CSS code to analyze
 * @returns ThemePalette containing semantic color roles
 */
export function extractPalette(cssString: string): ThemePalette {
  // 1. Parse CSS
  const ast = csstree.parse(cssString);

  // 2. Collect CSS variables with mode context
  const cssVariables = collectCssVariables(ast);

  // 3. Collect color candidates from all CSS rules
  const candidates = collectCandidates(ast, cssVariables);

  // 4. Apply mode filtering (prefer light → neutral → dark)
  filterCandidatesByMode(candidates);

  // 5. Deduplicate candidates per token type (string-based)
  dedupCandidates(candidates);

  // 5a. DeltaE-based deduplication (perceptual similarity)
  dedupByDeltaE(candidates, DELTA_E_DEDUP_THRESHOLD);

  // 5b. Apply contrast boosting for text candidates (if enabled)
  // Improved: Consider multiple backgrounds (page, surface, etc.)
  if (
    CONTRAST_BOOST_ENABLED &&
    candidates.text.length > 0 &&
    candidates.background.length > 0
  ) {
    // Get top N backgrounds to consider contrast against
    const sortedBackgrounds = [...candidates.background].sort(
      (a, b) => b.background - a.background,
    );
    const topBackgrounds = sortedBackgrounds.slice(0, CONTRAST_NUM_BACKGROUNDS);

    candidates.text.forEach((textCandidate) => {
      if (!textCandidate.colorObj) return;

      // Check contrast against all top backgrounds
      const hasGoodContrast = topBackgrounds.some(
        (bg) =>
          bg.colorObj &&
          getContrastRatio(textCandidate.colorObj!, bg.colorObj) >=
            CONTRAST_MIN_RATIO,
      );

      if (hasGoodContrast) {
        // Boost text score for high-contrast candidates
        textCandidate.text += CONTRAST_BOOST_MAGNITUDE;
      } else {
        // Penalize only if poor contrast against ALL top backgrounds
        textCandidate.text = Math.max(
          0,
          textCandidate.text - CONTRAST_BOOST_MAGNITUDE / 2,
        );
      }
    });
  }

  // 6. Fallback: scan for danger colors by hue if none found
  fallbackDanger(candidates);

  // 6b. Fallback for primaryVariant: find light backgrounds with similar hue to primary
  if (candidates.primaryVariant.length === 0 && candidates.primary.length > 0) {
    // Get the top primary colors (check first 3)
    const topPrimaries = [...candidates.primary]
      .sort((a, b) => b.primary - a.primary)
      .slice(0, 3);

    for (const primaryCandidate of topPrimaries) {
      if (primaryCandidate && primaryCandidate.colorObj) {
        const primaryHue = getHue(primaryCandidate.colorObj);

        // Look for light background colors with similar hue
        candidates.background.forEach((bgCandidate) => {
          if (
            bgCandidate.colorObj &&
            bgCandidate.lightness &&
            bgCandidate.lightness > LIGHTNESS_THRESHOLD_PRIMARY_VARIANT
          ) {
            const bgHue = getHue(bgCandidate.colorObj);
            const bgSat = getSaturation(bgCandidate.colorObj);

            // Check if hue is similar and has some saturation
            const hueDiff = Math.min(
              Math.abs(bgHue - primaryHue),
              360 - Math.abs(bgHue - primaryHue),
            );

            // Require meaningful saturation or very similar hue to avoid matching near-neutral backgrounds
            const isSaturated = bgSat > SATURATION_THRESHOLD_PRIMARY_VARIANT;
            const isVerySimilarHue = hueDiff < HUE_DIFF_VERY_SIMILAR;

            if (
              hueDiff < HUE_DIFF_SIMILAR &&
              (isSaturated || isVerySimilarHue)
            ) {
              // This is likely a primaryVariant (light container color)
              // Check if not already added
              const alreadyAdded = candidates.primaryVariant.some(
                (c) => c.value === bgCandidate.value,
              );
              if (!alreadyAdded) {
                candidates.primaryVariant.push({
                  ...bgCandidate,
                  // Score based on hue similarity
                  primaryVariant:
                    SCORE_PRIMARY_VARIANT_BASE +
                    (HUE_DIFF_SIMILAR - hueDiff) /
                      SCORE_PRIMARY_VARIANT_HUE_DIVISOR,
                });
              }
            }
          }
        });

        // If we found some, break
        if (candidates.primaryVariant.length > 0) break;
      }
    }
  }

  // 6c. Fallback for linkVariant: find colors similar to link but darker/lighter/desaturated
  if (candidates.linkVariant.length === 0 && candidates.link.length > 0) {
    const topLink = [...candidates.link].sort((a, b) => b.link - a.link)[0];
    if (topLink && topLink.colorObj) {
      const linkHue = getHue(topLink.colorObj);
      const linkLight = topLink.lightness ?? 50;

      // Look through all color candidates for similar hues with different lightness
      const allCandidates = [
        ...candidates.background,
        ...candidates.text,
        ...candidates.muted,
        ...candidates.primary,
        ...candidates.border,
      ];

      allCandidates.forEach((candidate) => {
        if (candidate.colorObj && candidate.value !== topLink.value) {
          const candHue = getHue(candidate.colorObj);
          const candLight = candidate.lightness ?? 50;

          const hueDiff = Math.min(
            Math.abs(candHue - linkHue),
            360 - Math.abs(candHue - linkHue),
          );

          const lightDiff = Math.abs(candLight - linkLight);

          // Similar hue but different lightness
          if (
            hueDiff < HUE_DIFF_LINK_VARIANT &&
            lightDiff > LIGHTNESS_DIFF_LINK_VARIANT_MIN &&
            lightDiff < LIGHTNESS_DIFF_LINK_VARIANT_MAX
          ) {
            const alreadyAdded = candidates.linkVariant.some(
              (c) => c.value === candidate.value,
            );
            if (!alreadyAdded) {
              candidates.linkVariant.push({
                ...candidate,
                linkVariant: SCORE_LINK_VARIANT_FALLBACK,
              });
            }
          }
        }
      });
    }
  }

  // 7. Build final palette using per-purpose scoring
  const palette: ThemePalette = {
    background: getSortedForPurpose(candidates.background, "background"),
    surface: getSortedForPurpose(candidates.surface, "surface"),
    text: getSortedForPurpose(candidates.text, "text"),
    muted: getSortedForPurpose(candidates.muted, "muted"),
    primary: getSortedForPurpose(candidates.primary, "primary"),
    primaryVariant: getSortedForPurpose(
      candidates.primaryVariant,
      "primaryVariant",
    ),
    border: getSortedForPurpose(candidates.border, "border"),
    danger: getSortedForPurpose(candidates.danger, "danger"),
    dangerVariant: getSortedForPurpose(
      candidates.dangerVariant,
      "dangerVariant",
    ),
    link: getSortedForPurpose(candidates.link, "link"),
    linkVariant: getSortedForPurpose(candidates.linkVariant, "linkVariant"),
    ring: getSortedForPurpose(candidates.ring, "ring"),
  };

  // 7a. Sanity check: if text equals background, they're likely both wrong
  // Try to find a contrasting text color
  if (
    palette.text &&
    palette.background &&
    palette.text[0] === palette.background[0]
  ) {
    // Find the darkest candidate from text pool that's different from background
    const bgValue = palette.background[0];
    const alternativeText = candidates.text
      .filter((c) => c.value !== bgValue)
      .sort((a, b) => (a.lightness ?? 50) - (b.lightness ?? 50)); // Sort by lightness ascending (darkest first)

    if (alternativeText.length > 0) {
      palette.text = [
        alternativeText[0].value,
        ...alternativeText.slice(1).map((c) => c.value),
      ];
    } else {
      // If no alternative found, try using muted as text fallback
      if (palette.muted && palette.muted[0] !== bgValue) {
        palette.text = palette.muted;
      }
    }
  }

  // 8. Adjust link palette: handle intentionally unstyled links and container variants
  adjustLinkPalette(palette, candidates);

  // 9. Fallback: use muted color for borders if no explicit border found
  // (borders are often subtle, muted colors)
  if (!palette.border && palette.muted) {
    palette.border = palette.muted;
  }

  return palette;
}
