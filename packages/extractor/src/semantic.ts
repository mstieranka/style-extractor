/**
 * Semantic utilities for analyzing CSS variable names and patterns
 * Includes auto-detection of design systems for better pattern matching
 */

import semanticTokenMapData from "./semanticTokenMap.json";
import {
	DESIGN_SYSTEM_CARBON_PATTERNS,
	DESIGN_SYSTEM_FLUENT_PATTERNS,
	DESIGN_SYSTEM_MATERIAL_PATTERNS,
	SEMANTIC_EXTRA_BOOST,
	SEMANTIC_EXTRA_BOOST_BG,
	SEMANTIC_EXTRA_BOOST_CARD,
	SEMANTIC_EXTRA_BOOST_SURFACE_VARIANT,
	SEMANTIC_VAR_BOOST,
	type ColorPaletteKey,
} from "@style-extractor/shared";

// Type for semantic token entries
interface SemanticTokenEntry {
	match: string;
	role: string;
	boost: number;
}

// Load semantic token mapping with structure for core + design system specific patterns
const semanticTokenMap = semanticTokenMapData as {
	core: SemanticTokenEntry[];
	material: SemanticTokenEntry[];
	fluent: SemanticTokenEntry[];
	carbon: SemanticTokenEntry[];
};

// Design system detection result type
export type DesignSystem = "material" | "fluent" | "carbon" | "unknown";

// Cache for detected design system (per CSS content)
let detectedDesignSystem: DesignSystem | null = null;
let detectionCacheKey: string | null = null;

/**
 * Detect which design system the CSS uses based on variable naming patterns
 * Results are cached for efficiency
 */
export const detectDesignSystem = (cssContent: string): DesignSystem => {
	// Use first 5000 chars as cache key for efficiency
	const cacheKey = cssContent.slice(0, 5000);
	if (detectionCacheKey === cacheKey && detectedDesignSystem !== null) {
		return detectedDesignSystem;
	}

	const lower = cssContent.toLowerCase();

	// Count pattern matches for each design system
	const materialScore = DESIGN_SYSTEM_MATERIAL_PATTERNS.reduce(
		(score, pattern) => score + (lower.includes(pattern) ? 1 : 0),
		0,
	);

	const fluentScore = DESIGN_SYSTEM_FLUENT_PATTERNS.reduce(
		(score, pattern) => score + (lower.includes(pattern) ? 1 : 0),
		0,
	);

	const carbonScore = DESIGN_SYSTEM_CARBON_PATTERNS.reduce(
		(score, pattern) => score + (lower.includes(pattern) ? 1 : 0),
		0,
	);

	// Determine winner (need at least 2 matches to be confident)
	let result: DesignSystem = "unknown";
	const maxScore = Math.max(materialScore, fluentScore, carbonScore);

	if (maxScore >= 2) {
		if (materialScore === maxScore) result = "material";
		else if (fluentScore === maxScore) result = "fluent";
		else if (carbonScore === maxScore) result = "carbon";
	}

	// Cache result
	detectionCacheKey = cacheKey;
	detectedDesignSystem = result;

	return result;
};

/**
 * Reset design system detection cache (useful for testing)
 */
export const resetDesignSystemCache = (): void => {
	detectedDesignSystem = null;
	detectionCacheKey = null;
};

/**
 * Get semantic token patterns for a specific design system or all applicable ones
 */
export const getSemanticPatterns = (
	designSystem: DesignSystem = "unknown",
): SemanticTokenEntry[] => {
	// Always include core patterns
	const patterns = [...semanticTokenMap.core];

	// Add design system specific patterns
	if (designSystem === "material" && semanticTokenMap.material) {
		patterns.push(...semanticTokenMap.material);
	} else if (designSystem === "fluent" && semanticTokenMap.fluent) {
		patterns.push(...semanticTokenMap.fluent);
	} else if (designSystem === "carbon" && semanticTokenMap.carbon) {
		patterns.push(...semanticTokenMap.carbon);
	} else if (designSystem === "unknown") {
		// When unknown, include all patterns but with reduced boost
		// This allows matching but doesn't over-prioritize design-system-specific terms
		if (semanticTokenMap.material) {
			patterns.push(
				...semanticTokenMap.material.map((p) => ({
					...p,
					boost: Math.round(p.boost * 0.7),
				})),
			);
		}
		if (semanticTokenMap.fluent) {
			patterns.push(
				...semanticTokenMap.fluent.map((p) => ({
					...p,
					boost: Math.round(p.boost * 0.7),
				})),
			);
		}
		if (semanticTokenMap.carbon) {
			patterns.push(
				...semanticTokenMap.carbon.map((p) => ({
					...p,
					boost: Math.round(p.boost * 0.7),
				})),
			);
		}
	}

	return patterns;
};

/**
 * Extract which semantic roles a variable name explicitly mentions.
 * Used to determine if CSS variable definitions should contribute to specific roles.
 */
export const extractSemanticRoles = (varName: string): string[] => {
	const lower = varName.toLowerCase();
	const roles: string[] = [];

	if (lower.includes("border")) roles.push("border");
	if (lower.includes("ring") || lower.includes("outline")) roles.push("ring");
	if (lower.includes("background") || lower.includes("bg"))
		roles.push("background");
	if (
		lower.includes("surface") ||
		lower.includes("container") ||
		lower.includes("card") ||
		lower.includes("layer")
	)
		roles.push("surface");
	if (
		lower.includes("text") ||
		lower.includes("foreground") ||
		lower.includes("fg")
	)
		roles.push("text");
	if (
		lower.includes("muted") ||
		lower.includes("secondary") ||
		lower.includes("subtle")
	)
		roles.push("muted");
	if (
		lower.includes("primary") ||
		lower.includes("brand") ||
		lower.includes("action")
	)
		roles.push("primary");
	if (
		lower.includes("danger") ||
		lower.includes("error") ||
		lower.includes("destructive")
	)
		roles.push("danger");
	if (lower.includes("link") || lower.includes("anchor")) roles.push("link");

	return roles;
};

/**
 * Detect semantic variable name patterns and return boost mappings
 * Uses auto-detected design system for better pattern matching
 */
export const getSemanticBoosts = (
	varName: string,
	designSystem: DesignSystem = "unknown",
): Partial<Record<ColorPaletteKey, number>> => {
	const boosts: Partial<Record<ColorPaletteKey, number>> = {};
	const lower = varName.toLowerCase();

	// Get patterns for the detected design system
	const patterns = getSemanticPatterns(designSystem);

	// Check semantic token map for pattern matches
	for (const entry of patterns) {
		const matchPattern = entry.match;
		const regex = new RegExp(matchPattern, "i");
		if (regex.test(lower)) {
			const role = entry.role as ColorPaletteKey;
			boosts[role] = (boosts[role] || 0) + entry.boost;
		}
	}

	// Skip extension/specialized colors (caution, warning, success, info, etc.)
	const isSpecializedColor =
		lower.includes("caution") ||
		lower.includes("warning") ||
		lower.includes("success") ||
		lower.includes("info");

	// Text/foreground color detection across design systems
	// Material Design: "on-" prefix
	if (lower.includes("on-")) {
		// Special case: "on-primary-container" used for link hover/variant
		if (lower.includes("on-primary-container")) {
			boosts.linkVariant = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST;
			boosts.text = SEMANTIC_VAR_BOOST / 2;
		}
		// Prefer "on-surface-variant" for muted/subdued text rather than border
		else if (lower.includes("on-surface-variant")) {
			boosts.muted = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST;
			boosts.text = SEMANTIC_VAR_BOOST;
		} else if (lower.includes("on-secondary")) {
			// on-secondary variants can be text or muted
			boosts.text = SEMANTIC_VAR_BOOST;
			boosts.muted = SEMANTIC_VAR_BOOST / 2;
		} else {
			boosts.text = SEMANTIC_VAR_BOOST;
			if (lower.includes("muted") || lower.includes("secondary")) {
				boosts.muted = SEMANTIC_VAR_BOOST;
			}
		}
	}

	// Fluent/Outlook/Other: explicit "text" or "foreground" tokens
	if (
		lower.includes("text") ||
		lower.includes("foreground") ||
		lower.includes("bodytext")
	) {
		// Don't boost if this is a specialized color or background-related
		if (!isSpecializedColor && !lower.includes("background")) {
			boosts.text = SEMANTIC_VAR_BOOST;
		}
	}

	// Fluent/Outlook: "neutral" + "dark" often indicates body text
	if (lower.includes("neutral") && lower.includes("dark")) {
		if (!isSpecializedColor) {
			boosts.text = SEMANTIC_VAR_BOOST;
		}
	}

	// "surface-variant" specifically for borders (but not "on-surface-variant")
	if (lower.includes("surface-variant") && !lower.includes("on-")) {
		boosts.border = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST_SURFACE_VARIANT;
		boosts.surface = SEMANTIC_VAR_BOOST / 2;
	}
	// Other "variant" patterns for borders/surfaces
	else if (lower.includes("-variant") || lower.includes("variant")) {
		boosts.border = SEMANTIC_VAR_BOOST;
		boosts.surface = SEMANTIC_VAR_BOOST / 2;
	}

	// "container" for surfaces (but not backgrounds, and not specialized colors)
	if (lower.includes("container") && !isSpecializedColor) {
		boosts.surface = SEMANTIC_VAR_BOOST;
	}

	// "card" especially when combined with "background" is a surface, not page background
	if (lower.includes("card") && lower.includes("background")) {
		boosts.surface = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST_CARD;
		boosts.background = SEMANTIC_VAR_BOOST / 4; // Reduce background boost
	}

	// Explicit "background" token - strong preference
	if (
		lower.includes("background") &&
		!lower.includes("on-") &&
		!lower.includes("card") && // Don't boost card-background for page background
		!isSpecializedColor
	) {
		// Exact match for base background (not hover/iframe/etc.)
		if (
			lower.endsWith("background") ||
			lower.includes("color-background") ||
			lower.includes("theme-background")
		) {
			boosts.background = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST_BG;
		} else {
			boosts.background = SEMANTIC_VAR_BOOST;
		}
	}

	// Explicit "surface" token
	if (lower.includes("surface") && !lower.includes("on-")) {
		boosts.surface = SEMANTIC_VAR_BOOST;
	}

	// Explicit "primary" token (not on-primary)
	if (lower.includes("primary") && !lower.includes("on-")) {
		// Check for primary-container or primary-variant
		if (
			lower.includes("primary-container") ||
			lower.includes("primary-variant")
		) {
			boosts.primaryVariant = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST;
		}
		// Prefer exact "primary" over containers
		else if (
			lower.endsWith("primary") ||
			lower.includes('color-primary"') ||
			lower.includes("theme-primary") ||
			lower.includes("themeprimary")
		) {
			boosts.primary = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST;
		}
		// But avoid "neutral primary" which is typically text
		else if (lower.includes("neutral") && lower.includes("primary")) {
			// Don't boost this for primary, it's likely a text color
			boosts.text = SEMANTIC_VAR_BOOST;
		} else {
			boosts.primary = SEMANTIC_VAR_BOOST;
		}
	}

	// Explicit "danger" or "error" tokens
	if (lower.includes("danger") || lower.includes("error")) {
		// Check for danger-container, error-container variants, or inverse patterns
		if (
			lower.includes("-container") ||
			lower.includes("-variant") ||
			lower.includes("-inverse") ||
			lower.includes("inverse")
		) {
			boosts.dangerVariant = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST;
		} else {
			boosts.danger = SEMANTIC_VAR_BOOST;
		}
		// Danger/error colors are purpose-specific; don't score for other roles
		return boosts;
	}

	// Explicit "border" or "divider" token
	if (lower.includes("border") || lower.includes("divider")) {
		boosts.border = SEMANTIC_VAR_BOOST;
	}

	// Explicit "link" token (e.g., --cds-link-primary, --link-color)
	if (lower.includes("link")) {
		// Check for link hover/visited/active variants
		if (
			lower.includes("hover") ||
			lower.includes("visited") ||
			lower.includes("active") ||
			lower.includes("pressed")
		) {
			boosts.linkVariant = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST;
		} else {
			boosts.link = SEMANTIC_VAR_BOOST + SEMANTIC_EXTRA_BOOST;
		}
	}

	return boosts;
};
