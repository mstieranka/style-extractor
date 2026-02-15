import type { ThemePalette } from "./types";

// Re-export all constants from the main constants file
export {
  // General settings
  MAX_RESULTS,
  MIN_SCORE,
  // Contrast boosting
  CONTRAST_BOOST_ENABLED,
  CONTRAST_MIN_RATIO,
  CONTRAST_BOOST_MAGNITUDE,
  CONTRAST_NUM_BACKGROUNDS,
  // Mode weights
  MODE_WEIGHT_LIGHT,
  MODE_WEIGHT_DARK,
  MODE_WEIGHT_NEUTRAL,
  // Lightness thresholds
  LIGHTNESS_THRESHOLD_LIGHT_BG,
  LIGHTNESS_THRESHOLD_DARK_TEXT,
  LIGHTNESS_THRESHOLD_MUTED_MIN,
  LIGHTNESS_THRESHOLD_MUTED_MAX,
  LIGHTNESS_THRESHOLD_BORDER_MIN,
  LIGHTNESS_THRESHOLD_BORDER_MAX,
  LIGHTNESS_THRESHOLD_PRIMARY_MIN,
  LIGHTNESS_THRESHOLD_PRIMARY_MAX,
  LIGHTNESS_THRESHOLD_PRIMARY_VARIANT,
  // Saturation thresholds
  SATURATION_THRESHOLD_BORDER_GRAY,
  SATURATION_THRESHOLD_BORDER_STRONG,
  SATURATION_THRESHOLD_BORDER_MODERATE,
  SATURATION_THRESHOLD_BORDER_ELIMINATION,
  SATURATION_THRESHOLD_DANGER,
  SATURATION_THRESHOLD_PRIMARY_VARIANT,
  // Hue thresholds
  HUE_DIFF_SIMILAR,
  HUE_DIFF_VERY_SIMILAR,
  HUE_DIFF_LINK_VARIANT,
  DANGER_HUE_RANGE_RED_START,
  DANGER_HUE_RANGE_RED_END,
  DANGER_HUE_RANGE_ORANGE_START,
  DANGER_HUE_RANGE_ORANGE_END,
  // Delta E thresholds
  DELTA_E_SIMILAR,
  DELTA_E_DEDUP_THRESHOLD,
  // Lightness difference thresholds
  LIGHTNESS_DIFF_LINK_VARIANT_MIN,
  LIGHTNESS_DIFF_LINK_VARIANT_MAX,
  // Scoring
  PSEUDO_STATE_PENALTY,
  SEMANTIC_VAR_BOOST,
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
  SCORE_PRIMARY_VARIANT_BASE,
  SCORE_PRIMARY_VARIANT_HUE_DIVISOR,
  SCORE_LINK_VARIANT_FALLBACK,
  SCORE_FALLBACK_DANGER,
  // Semantic boost modifiers
  SEMANTIC_EXTRA_BOOST,
  SEMANTIC_EXTRA_BOOST_BG,
  SEMANTIC_EXTRA_BOOST_CARD,
  SEMANTIC_EXTRA_BOOST_SURFACE_VARIANT,
  // Recursion limits
  VAR_RESOLUTION_MAX_DEPTH,
  MULTI_LEVEL_VAR_MAX_DEPTH,
  // Alpha threshold
  MIN_ALPHA_THRESHOLD,
  // Framework prefixes
  FRAMEWORK_PREFIXES,
  // Design system detection
  DESIGN_SYSTEM_MATERIAL_PATTERNS,
  DESIGN_SYSTEM_FLUENT_PATTERNS,
  DESIGN_SYSTEM_CARBON_PATTERNS,
} from "../constants";

// Token matchers for semantic role detection
export const TOKEN_MATCHERS: Record<keyof ThemePalette, RegExp> = {
  background: /[\-_]?(background|bg)[\-_]?/i,
  surface: /[\-_]?(card|panel|box|surface|container|modal|dialog)[\-_]?/i,
  text: /[\-_]?(text|foreground|fg|color)[\-_]?/i,
  muted: /[\-_]?(muted|caption|small|secondary|subtext)[\-_]?/i,
  primary: /[\-_]?(primary|brand|main|action)[\-_]?/i,
  primaryVariant: /[\-_]?primary[\-_]?(container|variant)[\-_]?/i,
  border: /[\-_]?(border|divider|separator|line)[\-_]?/i,
  danger: /[\-_]?(danger|error|alert|destructive|invalid|dont)[\-_]?/i,
  dangerVariant: /[\-_]?(danger|error)[\-_]?(container|variant)[\-_]?/i,
  link: /[\-_]?(link|anchor|hyperlink)[\-_]?/i,
  linkVariant: /[\-_]?link[\-_]?(visited|hover|active)[\-_]?/i,
  ring: /[\-_]?(ring|outline|focus-ring)[\-_]?/i,
};
