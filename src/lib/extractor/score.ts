/**
 * Scoring functions for evaluating color candidates for different roles
 */

import type Color from "colorjs.io";
import type { ThemePalette, ColorCandidate } from "./types";
import {
  TOKEN_MATCHERS,
  PSEUDO_STATE_PENALTY,
  SCORE_PENALTY_LIGHT_TEXT,
  LIGHTNESS_THRESHOLD_LIGHT_TEXT_PENALTY,
  SCORE_TOKEN_MATCH_BASE,
  SCORE_BOOST_BODY_BG,
  SCORE_BOOST_GENERAL_BG,
  SCORE_BOOST_BODY_TEXT,
  SCORE_BOOST_PARAGRAPH_TEXT,
  SCORE_BOOST_LINK_PSEUDO,
  SCORE_BOOST_PLAIN_ANCHOR,
  SCORE_BOOST_LINK_PRIMARY,
  SCORE_BOOST_HR_BORDER,
  SCORE_BOOST_INPUT_BORDER,
  SCORE_BOOST_FOCUS_RING,
  SCORE_BOOST_BUTTON_PRIMARY,
  SCORE_BOOST_LINK_VAR,
  SCORE_PENALTY_FRAMEWORK,
  SCORE_PENALTY_SATURATED_BORDER_STRONG,
  SCORE_PENALTY_SATURATED_BORDER_MODERATE,
  SCORE_BOOST_GOOD_GRAY_BORDER,
  SATURATION_THRESHOLD_BORDER_STRONG,
  SATURATION_THRESHOLD_BORDER_MODERATE,
  SATURATION_THRESHOLD_BORDER_ELIMINATION,
  FRAMEWORK_PREFIXES,
} from "./constants";
import { getSaturation, getHue } from "./colorUtils";
import { normalizeSelector, selectorHasTag, hasPseudoState } from "./selectors";
import { getSemanticBoosts } from "./semantic";
import heuristicWeightsData from "../heuristicWeights.json";

// Load heuristic weights
const heuristicWeights = heuristicWeightsData as {
  semanticVarBoostDefault: number;
  desirability: Record<string, any>;
  modeLightnessThresholds: Record<string, number>;
};

/**
 * Calculate role-specific desirability adjustment based on color properties
 */
export const roleDesirability = (
  candidate: ColorCandidate,
  role: keyof ThemePalette,
): number => {
  if (!candidate.colorObj || !heuristicWeights?.desirability) {
    return 0;
  }

  const config = heuristicWeights.desirability[role];
  if (!config) return 0;

  const lightness = candidate.lightness ?? 50;
  const saturation = getSaturation(candidate.colorObj);
  const hue = getHue(candidate.colorObj);

  let adjustment = 0;

  // Background/Surface: prefer very light colors (close to white)
  if (role === "background" || role === "surface") {
    // Boost very light colors (lightness > 90)
    if (lightness > 90) {
      adjustment += 5;
    } else if (lightness > 80) {
      adjustment += 2;
    }
    // For surface specifically, prefer whiter colors over tinted ones
    if (role === "surface" && lightness > 95 && saturation < 5) {
      adjustment += 8; // Strong preference for pure white
    }
  }
  // Border: prefer low saturation grays
  if (role === "border") {
    if (
      saturation < (config.satMax ?? 20) &&
      lightness > (config.lightMin ?? 50) &&
      lightness < (config.lightMax ?? 70)
    ) {
      adjustment += (config.weight ?? 0) + SCORE_BOOST_GOOD_GRAY_BORDER;
    }
    // Strongly penalize highly saturated colors for borders (likely button/link colors misidentified)
    if (saturation > SATURATION_THRESHOLD_BORDER_STRONG) {
      adjustment -= SCORE_PENALTY_SATURATED_BORDER_STRONG;
    } else if (saturation > SATURATION_THRESHOLD_BORDER_MODERATE) {
      adjustment -= SCORE_PENALTY_SATURATED_BORDER_MODERATE;
    }
  }
  // Primary: prefer saturated, mid-lightness colors
  else if (role === "primary") {
    if (
      saturation >= (config.satMin ?? 30) &&
      lightness > (config.lightMin ?? 20) &&
      lightness < (config.lightMax ?? 70)
    ) {
      adjustment += config.weight ?? 0;
    }
  }
  // Danger: prefer red-orange hues with saturation
  else if (role === "danger") {
    const hueRanges = config.hueRanges || [
      [340, 360],
      [0, 30],
    ];
    const inHueRange = hueRanges.some(
      ([min, max]: [number, number]) => hue >= min && hue <= max,
    );
    if (inHueRange && saturation >= (config.satMin ?? 25)) {
      adjustment += config.weight ?? 0;
    }
  }
  // Link: prefer saturated colors
  else if (role === "link") {
    if (saturation >= (config.satMin ?? 25)) {
      adjustment += config.weight ?? 0;
    }
  }
  // Text: prefer very dark colors, strongly penalize light colors
  else if (role === "text") {
    if (lightness < (config.lightMax ?? 30)) {
      adjustment += config.weight ?? 0;
    }
    // Penalize very light colors - they're likely backgrounds being misidentified
    if (lightness > LIGHTNESS_THRESHOLD_LIGHT_TEXT_PENALTY) {
      adjustment -= SCORE_PENALTY_LIGHT_TEXT;
    }
  }
  // Muted: prefer mid-range lightness
  else if (role === "muted") {
    if (
      lightness > (config.lightMin ?? 25) &&
      lightness < (config.lightMax ?? 60)
    ) {
      adjustment += config.weight ?? 0;
    }
  }

  return adjustment;
};

/**
 * Apply TOKEN_MATCHERS to a string (selector or variable name) and return matching categories
 */
export const matchTokens = (
  str: string,
): Partial<Record<keyof ThemePalette, number>> => {
  const matches: Partial<Record<keyof ThemePalette, number>> = {};

  // Check variant patterns first (more specific)
  if (TOKEN_MATCHERS.primaryVariant.test(str))
    matches.primaryVariant = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.dangerVariant.test(str))
    matches.dangerVariant = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.linkVariant.test(str))
    matches.linkVariant = SCORE_TOKEN_MATCH_BASE;

  // Then check base patterns
  if (TOKEN_MATCHERS.background.test(str))
    matches.background = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.surface.test(str))
    matches.surface = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.text.test(str)) matches.text = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.muted.test(str)) matches.muted = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.primary.test(str))
    matches.primary = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.danger.test(str)) matches.danger = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.border.test(str)) matches.border = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.link.test(str)) matches.link = SCORE_TOKEN_MATCH_BASE;
  if (TOKEN_MATCHERS.ring.test(str)) matches.ring = SCORE_TOKEN_MATCH_BASE;

  return matches;
};

/**
 * Unified scoring function that evaluates both selector and variable name
 */
export const scoreCandidate = (
  selector: string,
  varName: string | null,
  property: string,
  colorObj: Color,
): Partial<Record<keyof ThemePalette, number>> => {
  const scores: Partial<Record<keyof ThemePalette, number>> = {};

  // Score based on selector patterns
  // For border properties, skip selector token matching if it's a button/component class
  // (prevents .btn-primary border from being scored as primary border)
  const isBorderProperty =
    property === "border-color" ||
    property === "border" ||
    property.startsWith("border-");
  const isButtonOrComponentSelector =
    selector.includes(".btn") ||
    selector.includes("button") ||
    selector.includes(".card") ||
    selector.includes(".alert") ||
    selector.includes(".badge") ||
    selector.includes(".chip");

  if (!isButtonOrComponentSelector || !isBorderProperty) {
    const selectorMatches = matchTokens(selector);
    Object.entries(selectorMatches).forEach(([key, score]) => {
      scores[key as keyof ThemePalette] =
        (scores[key as keyof ThemePalette] || 0) + score;
    });
  }

  // For border properties on button/component selectors, force border score to 0
  // so these don't get picked as general borders
  if (isBorderProperty && isButtonOrComponentSelector) {
    scores.border = 0;
  }

  // For highly saturated colors on border properties, set border score to 0
  // (saturated colors are typically button/link colors, not borders)
  if (isBorderProperty) {
    const saturation = colorObj.oklch?.c ?? 0;
    if (saturation > SATURATION_THRESHOLD_BORDER_ELIMINATION) {
      scores.border = 0;
    }
  }

  // Score based on variable name patterns
  if (varName) {
    const varMatches = matchTokens(varName);
    Object.entries(varMatches).forEach(([key, score]) => {
      scores[key as keyof ThemePalette] =
        (scores[key as keyof ThemePalette] || 0) + score;
    });
  }

  // Additional heuristic scoring based on selector specificity
  if (
    property === "background-color" ||
    (property === "background" &&
      (selectorHasTag(selector, "body") || selectorHasTag(selector, "html")))
  ) {
    scores.background = (scores.background || 0) + SCORE_BOOST_BODY_BG;
  }
  // Give extra boost to background/background-color property in general (not just body/html)
  if (property === "background-color" || property === "background") {
    scores.background = (scores.background || 0) + SCORE_BOOST_GENERAL_BG;
  }
  if (
    property === "color" &&
    (selectorHasTag(selector, "body") || selectorHasTag(selector, "html"))
  ) {
    scores.text = (scores.text || 0) + SCORE_BOOST_BODY_TEXT;
  }
  if (property === "color" && selectorHasTag(selector, "p")) {
    scores.text = (scores.text || 0) + SCORE_BOOST_PARAGRAPH_TEXT;
  }
  if (property === "color" && selectorHasTag(selector, "a")) {
    // Check for pseudo-states to detect link variants
    // Note: :link is the default unvisited link state, not a variant
    const isLinkPseudo = selector.includes(":link");
    const hasOtherPseudoState = hasPseudoState(selector);

    if (hasOtherPseudoState && !isLinkPseudo) {
      scores.linkVariant = (scores.linkVariant || 0) + SCORE_BOOST_LINK_PSEUDO;
    } else {
      // :link or no pseudo-state = normal link color
      scores.link = (scores.link || 0) + SCORE_BOOST_LINK_PSEUDO;
      // Boost plain 'a' or 'a:link' selector more than component-specific ones
      const normalized = normalizeSelector(selector).replace(/:link/g, "");
      if (normalized === "a") {
        scores.link = (scores.link || 0) + SCORE_BOOST_PLAIN_ANCHOR;
      }
    }
    scores.primary = (scores.primary || 0) + SCORE_BOOST_LINK_PRIMARY; // Links can indicate primary color
  }
  if (
    (property === "border-color" || property === "border") &&
    selectorHasTag(selector, "hr")
  ) {
    scores.border = (scores.border || 0) + SCORE_BOOST_HR_BORDER;
  }
  if (
    (property === "border-color" || property === "border") &&
    (selectorHasTag(selector, "input") ||
      selectorHasTag(selector, "textarea") ||
      selectorHasTag(selector, "select"))
  ) {
    scores.border = (scores.border || 0) + SCORE_BOOST_INPUT_BORDER;
  }
  if (
    (selector.includes(":focus") || selector.includes(":focus-visible")) &&
    (property === "outline-color" ||
      property.includes("box-shadow") ||
      property === "border-color" ||
      property === "border")
  ) {
    scores.ring = (scores.ring || 0) + SCORE_BOOST_FOCUS_RING;
  }
  // Button backgrounds can indicate primary
  if (
    (property === "background-color" || property === "background") &&
    (selectorHasTag(selector, "button") ||
      normalizeSelector(selector).includes(".btn"))
  ) {
    scores.primary = (scores.primary || 0) + SCORE_BOOST_BUTTON_PRIMARY;
  }
  if (varName && varName.match(/btn|button/)) {
    scores.primary = (scores.primary || 0) + SCORE_BOOST_BUTTON_PRIMARY;
  }
  if (varName && varName.match(/link/i)) {
    scores.link = (scores.link || 0) + SCORE_BOOST_LINK_VAR;
  }

  // Apply semantic variable name boosts
  if (varName) {
    const semanticBoosts = getSemanticBoosts(varName);
    Object.entries(semanticBoosts).forEach(([key, boost]) => {
      scores[key as keyof ThemePalette] =
        (scores[key as keyof ThemePalette] || 0) + boost;
    });
  }

  // Deprioritize framework/library variables (Bootstrap, Tailwind, PatternFly, MUI, Carbon, Chakra)
  if (varName) {
    const lowerVar = varName.toLowerCase();
    const isFrameworkVar = FRAMEWORK_PREFIXES.some((p) =>
      lowerVar.startsWith(p),
    );
    if (isFrameworkVar) {
      // Apply a light penalty to all purpose scores to avoid accidental prioritization
      Object.keys(scores).forEach((key) => {
        scores[key as keyof ThemePalette] = Math.max(
          0,
          (scores[key as keyof ThemePalette] || 0) - SCORE_PENALTY_FRAMEWORK,
        );
      });
    }
  }

  // Apply penalty for pseudo-state selectors (except for ring/outline and linkVariant for visited links)
  if (hasPseudoState(selector)) {
    // Don't penalize :focus for ring purposes
    const isFocusRing =
      selector.includes(":focus") &&
      (property === "outline-color" || property.includes("box-shadow"));

    // Don't penalize :visited for linkVariant purposes
    const isVisitedLink = selector.includes(":visited") && property === "color";

    if (!isFocusRing && !isVisitedLink) {
      Object.keys(scores).forEach((key) => {
        if (key !== "ring") {
          scores[key as keyof ThemePalette] = Math.max(
            0,
            (scores[key as keyof ThemePalette] || 0) - PSEUDO_STATE_PENALTY,
          );
        }
      });
    } else if (isVisitedLink) {
      // For visited links, only apply penalty to non-linkVariant purposes
      Object.keys(scores).forEach((key) => {
        if (key !== "ring" && key !== "linkVariant") {
          scores[key as keyof ThemePalette] = Math.max(
            0,
            (scores[key as keyof ThemePalette] || 0) - PSEUDO_STATE_PENALTY,
          );
        }
      });
    }
  }

  return scores;
};
