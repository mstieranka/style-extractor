/**
 * Tuning constants for color extraction
 *
 * All magic numbers are centralized here for easy tuning.
 * Values have been calibrated to minimize deltaE across test datasets.
 */

// =============================================================================
// GENERAL EXTRACTION SETTINGS
// =============================================================================

/** Maximum number of color candidates to return per token type */
export const MAX_RESULTS = 50;

/** Minimum score threshold for inclusion (only include candidates with score > MIN_SCORE) */
export const MIN_SCORE = 0;

// =============================================================================
// CONTRAST BOOSTING (for text legibility)
// =============================================================================

/** Enable contrast-based boosting for text candidates */
export const CONTRAST_BOOST_ENABLED = true;

/** Minimum contrast ratio (WCAG-like) to qualify for text boost */
export const CONTRAST_MIN_RATIO = 3.0;

/** Score boost magnitude for high-contrast text candidates */
export const CONTRAST_BOOST_MAGNITUDE = 6;

/** Number of top backgrounds to consider for contrast boosting (improves multi-surface sites) */
export const CONTRAST_NUM_BACKGROUNDS = 3;

// =============================================================================
// MODE WEIGHTS (light/dark/neutral theme preference)
// =============================================================================

/** Weight multiplier for light mode candidates (prefer light themes by default) */
export const MODE_WEIGHT_LIGHT = 1.2;

/** Weight multiplier for dark mode candidates */
export const MODE_WEIGHT_DARK = 0.6;

/** Weight multiplier for neutral/unspecified mode candidates */
export const MODE_WEIGHT_NEUTRAL = 1.0;

// =============================================================================
// LIGHTNESS THRESHOLDS (for filtering candidates by role)
// =============================================================================

/** Lightness threshold for distinguishing light vs dark backgrounds */
export const LIGHTNESS_THRESHOLD_LIGHT_BG = 50;

/** Maximum lightness for dark text (prefer very dark text) */
export const LIGHTNESS_THRESHOLD_DARK_TEXT = 30;

/** Minimum lightness for muted/secondary text */
export const LIGHTNESS_THRESHOLD_MUTED_MIN = 25;

/** Maximum lightness for muted/secondary text */
export const LIGHTNESS_THRESHOLD_MUTED_MAX = 60;

/** Minimum lightness for border colors */
export const LIGHTNESS_THRESHOLD_BORDER_MIN = 50;

/** Maximum lightness for border colors */
export const LIGHTNESS_THRESHOLD_BORDER_MAX = 70;

/** Minimum lightness for primary/danger/link colors */
export const LIGHTNESS_THRESHOLD_PRIMARY_MIN = 20;

/** Maximum lightness for primary/danger/link colors */
export const LIGHTNESS_THRESHOLD_PRIMARY_MAX = 80;

/** Minimum lightness for primaryVariant (light container colors) */
export const LIGHTNESS_THRESHOLD_PRIMARY_VARIANT = 80;

// =============================================================================
// SATURATION THRESHOLDS
// =============================================================================

/** Maximum saturation for gray borders (prefer desaturated) */
export const SATURATION_THRESHOLD_BORDER_GRAY = 20;

/** Saturation threshold for strong border penalty (likely button/link color) */
export const SATURATION_THRESHOLD_BORDER_STRONG = 40;

/** Saturation threshold for moderate border penalty */
export const SATURATION_THRESHOLD_BORDER_MODERATE = 25;

/** Saturation threshold for border elimination (OKLCH chroma) */
export const SATURATION_THRESHOLD_BORDER_ELIMINATION = 0.15;

/** Minimum saturation for danger colors to be valid */
export const SATURATION_THRESHOLD_DANGER = 20;

/** Minimum saturation for primaryVariant (must have meaningful color) */
export const SATURATION_THRESHOLD_PRIMARY_VARIANT = 30;

// =============================================================================
// HUE THRESHOLDS (for color similarity detection)
// =============================================================================

/** Maximum hue difference for "similar hue" detection */
export const HUE_DIFF_SIMILAR = 40;

/** Maximum hue difference for "very similar hue" detection */
export const HUE_DIFF_VERY_SIMILAR = 20;

/** Maximum hue difference for linkVariant detection */
export const HUE_DIFF_LINK_VARIANT = 30;

/** Danger color hue ranges: red (340-360) and orange (0-30) */
export const DANGER_HUE_RANGE_RED_START = 340;
export const DANGER_HUE_RANGE_RED_END = 360;
export const DANGER_HUE_RANGE_ORANGE_START = 0;
export const DANGER_HUE_RANGE_ORANGE_END = 30;

// =============================================================================
// DELTA E THRESHOLDS (perceptual color difference)
// =============================================================================

/** DeltaE threshold for considering colors "visually similar" */
export const DELTA_E_SIMILAR = 5;

/** DeltaE threshold for perceptual deduplication */
export const DELTA_E_DEDUP_THRESHOLD = 3;

// =============================================================================
// LIGHTNESS DIFFERENCE THRESHOLDS
// =============================================================================

/** Minimum lightness difference for linkVariant detection */
export const LIGHTNESS_DIFF_LINK_VARIANT_MIN = 10;

/** Maximum lightness difference for linkVariant detection */
export const LIGHTNESS_DIFF_LINK_VARIANT_MAX = 40;

// =============================================================================
// SCORING BOOSTS AND PENALTIES
// =============================================================================

/** Penalty applied to pseudo-state selectors (:hover, :focus, :active, etc.) */
export const PSEUDO_STATE_PENALTY = 3;

/** Boost applied to candidates with semantic variable names */
export const SEMANTIC_VAR_BOOST = 8;

/** Penalty for very light text colors (clearly not readable) */
export const SCORE_PENALTY_LIGHT_TEXT = 15;

/** Lightness threshold above which text colors are penalized */
export const LIGHTNESS_THRESHOLD_LIGHT_TEXT_PENALTY = 80;

/** Base score for token matcher pattern matches */
export const SCORE_TOKEN_MATCH_BASE = 5;

/** Boost for body/html background-color property */
export const SCORE_BOOST_BODY_BG = 10;

/** General boost for background/background-color properties */
export const SCORE_BOOST_GENERAL_BG = 5;

/** Boost for body/html text color */
export const SCORE_BOOST_BODY_TEXT = 10;

/** Boost for paragraph text */
export const SCORE_BOOST_PARAGRAPH_TEXT = 5;

/** Boost for link pseudo-state selectors (linkVariant) */
export const SCORE_BOOST_LINK_PSEUDO = 10;

/** Extra boost for plain 'a' selector links */
export const SCORE_BOOST_PLAIN_ANCHOR = 5;

/** Boost for links contributing to primary detection */
export const SCORE_BOOST_LINK_PRIMARY = 3;

/** Boost for <hr> border-color (strong border signal) */
export const SCORE_BOOST_HR_BORDER = 10;

/** Boost for input/textarea/select border */
export const SCORE_BOOST_INPUT_BORDER = 6;

/** Boost for focus ring (outline on :focus/:focus-visible) */
export const SCORE_BOOST_FOCUS_RING = 10;

/** Boost for button background indicating primary */
export const SCORE_BOOST_BUTTON_PRIMARY = 4;

/** Boost for variable names containing "link" */
export const SCORE_BOOST_LINK_VAR = 5;

/** Penalty for framework/library variables (Bootstrap, Tailwind, etc.) */
export const SCORE_PENALTY_FRAMEWORK = 4;

/** Strong penalty for highly saturated border colors */
export const SCORE_PENALTY_SATURATED_BORDER_STRONG = 20;

/** Moderate penalty for moderately saturated border colors */
export const SCORE_PENALTY_SATURATED_BORDER_MODERATE = 12;

/** Extra boost for good gray borders (low saturation, mid lightness) */
export const SCORE_BOOST_GOOD_GRAY_BORDER = 5;

/** Base score for primaryVariant fallback candidates */
export const SCORE_PRIMARY_VARIANT_BASE = 8;

/** Divisor for primaryVariant hue similarity bonus */
export const SCORE_PRIMARY_VARIANT_HUE_DIVISOR = 5;

/** Score for linkVariant fallback candidates */
export const SCORE_LINK_VARIANT_FALLBACK = 6;

/** Score for fallback danger colors (hue-based) */
export const SCORE_FALLBACK_DANGER = 3;

// =============================================================================
// SEMANTIC BOOST MODIFIERS (added to SEMANTIC_VAR_BOOST)
// =============================================================================

/** Extra boost for specific semantic patterns (e.g., on-primary-container) */
export const SEMANTIC_EXTRA_BOOST = 4;

/** Extra boost for exact background matches */
export const SEMANTIC_EXTRA_BOOST_BG = 10;

/** Extra boost for card-background as surface */
export const SEMANTIC_EXTRA_BOOST_CARD = 6;

/** Extra boost for surface-variant as border */
export const SEMANTIC_EXTRA_BOOST_SURFACE_VARIANT = 3;

// =============================================================================
// RECURSION AND DEPTH LIMITS
// =============================================================================

/** Maximum recursion depth for var() resolution */
export const VAR_RESOLUTION_MAX_DEPTH = 10;

/** Maximum depth for multi-level color var resolution */
export const MULTI_LEVEL_VAR_MAX_DEPTH = 3;

// =============================================================================
// ALPHA/TRANSPARENCY THRESHOLD
// =============================================================================

/** Minimum alpha value for color inclusion (filter out semi-transparent colors) */
export const MIN_ALPHA_THRESHOLD = 0.9;

// =============================================================================
// FRAMEWORK PREFIXES (for deprioritizing library variables)
// =============================================================================

/** CSS variable prefixes for common UI frameworks (Bootstrap, Tailwind, etc.) */
export const FRAMEWORK_PREFIXES = [
  "--bs-", // Bootstrap
  "--tw-", // Tailwind
  "--pf-", // PatternFly
  "--chakra-", // Chakra UI
  "--mui-", // Material UI
  "--mdc-", // Material Design Components
  "--carbon-", // IBM Carbon
  "--pf-global", // PatternFly global
] as const;

// =============================================================================
// DESIGN SYSTEM DETECTION PATTERNS
// =============================================================================

/** Patterns that indicate Material Design system */
export const DESIGN_SYSTEM_MATERIAL_PATTERNS = [
  "--md-",
  "--mdc-",
  "md-sys-color",
  "on-primary",
  "on-surface",
  "primary-container",
  "surface-variant",
] as const;

/** Patterns that indicate Fluent/Microsoft design system */
export const DESIGN_SYSTEM_FLUENT_PATTERNS = [
  "--fluent",
  "neutralForeground",
  "neutralBackground",
  "brandBackground",
] as const;

/** Patterns that indicate IBM Carbon design system */
export const DESIGN_SYSTEM_CARBON_PATTERNS = [
  "--cds-",
  "--carbon-",
  "cds-text",
  "cds-background",
] as const;
