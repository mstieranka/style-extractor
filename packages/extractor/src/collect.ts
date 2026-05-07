/**
 * Candidate collection from CSS AST
 */

import Color from "colorjs.io";
import * as csstree from "css-tree";
import { getLightness } from "./colorUtils";
import {
	FRAMEWORK_PREFIXES,
	MIN_SCORE,
	MODE_WEIGHT_DARK,
	MODE_WEIGHT_LIGHT,
	MODE_WEIGHT_NEUTRAL,
	type ColorPaletteKey,
} from "@style-extractor/shared";
import { extractGradientColors } from "./gradients";
import { normalizeColor } from "./normalize";
import { scoreCandidate } from "./score";
import { detectMode, isDeclaration, isRule } from "./selectors";
import { extractSemanticRoles, getSemanticBoosts } from "./semantic";
import type { ColorCandidate, CssVariablesMap } from "./types";
import {
	extractTier,
	resolveMultiLevelColorVar,
	resolveValue,
	resolveVarMode,
	resolveVarName,
} from "./variables";

/**
 * Create empty candidates structure
 */
export const createEmptyCandidates = (): Record<
	ColorPaletteKey,
	ColorCandidate[]
> => ({
	background: [],
	surface: [],
	text: [],
	muted: [],
	primary: [],
	primaryVariant: [],
	border: [],
	danger: [],
	dangerVariant: [],
	link: [],
	linkVariant: [],
	ring: [],
});

/**
 * Create an empty per-purpose score object
 */
const createEmptyScores = (): Record<ColorPaletteKey, number> => ({
	background: 0,
	surface: 0,
	text: 0,
	muted: 0,
	primary: 0,
	primaryVariant: 0,
	border: 0,
	danger: 0,
	dangerVariant: 0,
	link: 0,
	linkVariant: 0,
	ring: 0,
});

/**
 * Get mode weight multiplier for scoring
 */
const getModeWeight = (mode: "light" | "dark" | "neutral"): number => {
	switch (mode) {
		case "light":
			return MODE_WEIGHT_LIGHT;
		case "dark":
			return MODE_WEIGHT_DARK;
		default:
			return MODE_WEIGHT_NEUTRAL;
	}
};

/**
 * Apply mode-weighted scoring and add candidate to appropriate categories.
 * This is the core scoring logic used by all candidate collection paths.
 */
const addScoredCandidate = (
	candidates: Record<ColorPaletteKey, ColorCandidate[]>,
	scores: Partial<Record<ColorPaletteKey, number>>,
	candidateBase: {
		value: string;
		originSelector: string;
		colorObj: Color;
		tier?: number;
		lightness: number;
		varName?: string;
		mode: "light" | "dark" | "neutral";
	},
	roleFilter?: (key: ColorPaletteKey) => boolean,
): void => {
	const weight = getModeWeight(candidateBase.mode);

	// Build per-purpose score object with mode-adjusted scores
	const perPurposeScores = createEmptyScores();

	(Object.entries(scores) as [ColorPaletteKey, number][]).forEach(
		([key, score]) => {
			const adjustedScore = Math.max(0, Math.round(score * weight));
			perPurposeScores[key] = adjustedScore;
		},
	);

	// Early filter: only add candidate if at least one purpose score > MIN_SCORE
	const hasValidScore = Object.values(perPurposeScores).some(
		(s) => s > MIN_SCORE,
	);
	if (!hasValidScore) return;

	// Add candidate to all matching categories with score > MIN_SCORE
	(Object.entries(scores) as [ColorPaletteKey, number][]).forEach(
		([key, score]) => {
			const adjustedScore = Math.max(0, Math.round(score * weight));
			if (adjustedScore > MIN_SCORE) {
				// Apply optional role filter (e.g., skip border/ring for CSS variables without explicit mention)
				if (roleFilter && !roleFilter(key)) return;

				candidates[key].push({
					...candidateBase,
					score: adjustedScore,
					...perPurposeScores,
				});
			}
		},
	);
};

/**
 * Helper function to process a single color candidate and add it to the candidates record
 * Extracted to avoid code duplication for gradients and regular colors
 */
export const addColorCandidate = (
	colorValue: string,
	selector: string,
	varName: string | null,
	prop: string,
	mode: "light" | "dark" | "neutral",
	cssVariables: CssVariablesMap,
	rawValue: string,
	candidates: Record<ColorPaletteKey, ColorCandidate[]>,
): void => {
	const normalized = normalizeColor(colorValue);
	if (!normalized) return;

	const colorObj = normalized.colorObj;
	const normalizedValue = normalized.normalized;
	const tier = varName ? extractTier(varName) : null;

	const scores = scoreCandidate(selector, varName, prop, colorObj);

	// Determine final mode (prefer variable's declared mode over selector mode)
	const varMode = resolveVarMode(rawValue, cssVariables);
	const finalMode = varMode || mode;

	addScoredCandidate(candidates, scores, {
		value: normalizedValue,
		originSelector: selector,
		colorObj: colorObj,
		tier: tier ?? undefined,
		lightness: getLightness(colorObj),
		varName: varName || undefined,
		mode: finalMode,
	});
};

/**
 * Collect color candidates from the AST
 */
export const collectCandidates = (
	ast: csstree.CssNode,
	cssVariables: CssVariablesMap,
): Record<ColorPaletteKey, ColorCandidate[]> => {
	const candidates = createEmptyCandidates();

	// Collect colors from property declarations
	csstree.walk(ast, {
		visit: "Rule",
		enter(this: csstree.WalkContext, node: csstree.CssNode) {
			if (!isRule(node)) return;

			const selector = csstree.generate(node.prelude);

			// Check if we're inside a dark mode media query
			let inDarkMediaQuery = false;
			if (this.atrule && this.atrule.name === "media" && this.atrule.prelude) {
				const mediaQuery = csstree.generate(this.atrule.prelude);
				inDarkMediaQuery = /prefers-color-scheme:\s*dark/i.test(mediaQuery);
			}

			csstree.walk(node.block, {
				visit: "Declaration",
				enter(decl: csstree.CssNode) {
					if (!isDeclaration(decl)) return;

					const prop = decl.property;
					const rawValue = csstree.generate(decl.value);
					let resolvedValue = resolveValue(rawValue, cssVariables);
					const resolvedVarName = resolveVarName(rawValue);

					// Multi-level var() resolution: if value is var(--x) and --x chains to a color literal, resolve it
					if (resolvedValue.trim().startsWith("var(")) {
						const multiLevelResolved = resolveMultiLevelColorVar(
							resolvedValue,
							cssVariables,
						);
						if (multiLevelResolved) {
							resolvedValue = multiLevelResolved;
						}
					}

					// Extract all colors from gradients and process each one
					if (/(linear|radial|conic)-gradient\s*\(/i.test(resolvedValue)) {
						const gradientColors = extractGradientColors(resolvedValue);
						const mode = detectMode(selector, inDarkMediaQuery);
						for (const gradientColor of gradientColors) {
							// Process each gradient color as a separate candidate
							addColorCandidate(
								gradientColor,
								selector,
								resolvedVarName,
								prop,
								mode,
								cssVariables,
								rawValue,
								candidates,
							);
						}
						return; // Don't process the gradient value itself
					}

					// Attempt to parse color. If it fails, it's likely an image or gradient.
					// Filter out common keywords
					if (
						["none", "transparent", "inherit", "initial"].includes(
							resolvedValue,
						)
					)
						return;

					const normalized = normalizeColor(resolvedValue);
					if (!normalized) return; // Not a solid color

					const colorObj = normalized.colorObj;
					const normalizedValue = normalized.normalized;

					// Extract metadata
					const tier = resolvedVarName ? extractTier(resolvedVarName) : null;
					const lightness = getLightness(colorObj);
					const mode = detectMode(selector, inDarkMediaQuery);

					// --- Unified Scoring Logic ---

					// Handle border shorthand separately (extract color from "1px solid black")
					if (prop === "border") {
						const parts = resolvedValue.split(/\s+/);
						const colorPart = parts.find((part) => {
							if (["none", "transparent", "inherit", "initial"].includes(part))
								return false;
							try {
								new Color(part);
								return true;
							} catch {
								return false;
							}
						});

						if (colorPart) {
							// Parse the actual color from the border shorthand
							const borderNormalized = normalizeColor(colorPart);
							if (!borderNormalized) return;

							const borderColorObj = borderNormalized.colorObj;
							const borderNormalizedValue = borderNormalized.normalized;

							const scores = scoreCandidate(
								selector,
								resolvedVarName,
								prop,
								borderColorObj,
							);

							// Determine final mode (prefer variable's declared mode over selector mode)
							const varMode = resolveVarMode(rawValue, cssVariables);
							const finalMode = varMode || mode;

							addScoredCandidate(candidates, scores, {
								value: borderNormalizedValue,
								originSelector: selector,
								colorObj: borderColorObj,
								tier: tier ?? undefined,
								lightness: getLightness(borderColorObj),
								varName: resolvedVarName || undefined,
								mode: finalMode,
							});
						}
						return;
					}

					// For all other color properties, use unified scoring
					if (
						prop === "background-color" ||
						(prop === "background" && !resolvedValue.includes("url")) ||
						prop === "color" ||
						prop === "border-color" ||
						prop === "outline-color" ||
						prop?.includes("box-shadow")
					) {
						const scores = scoreCandidate(
							selector,
							resolvedVarName,
							prop,
							colorObj,
						);

						// Determine final mode (prefer variable's declared mode over selector mode)
						const varMode = resolveVarMode(rawValue, cssVariables);
						const finalMode = varMode || mode;

						addScoredCandidate(candidates, scores, {
							value: normalizedValue,
							originSelector: selector,
							colorObj,
							tier: tier ?? undefined,
							lightness,
							varName: resolvedVarName || undefined,
							mode: finalMode,
						});
					}
				},
			});
		},
	});

	// Also extract colors from CSS variable definitions themselves
	// (for variables that are defined but never used in declarations)
	cssVariables.forEach((varData, varName) => {
		// Skip framework variables
		const lowerVar = varName.toLowerCase();
		const isFrameworkVar = FRAMEWORK_PREFIXES.some((p) =>
			lowerVar.startsWith(p),
		);
		if (isFrameworkVar) return;

		// Only extract if variable name has semantic meaning (not generic color names)
		const semanticBoosts = getSemanticBoosts(varName);
		const hasSemantic = Object.values(semanticBoosts).some(
			(v) => v !== undefined && v > 0,
		);
		if (!hasSemantic) return;

		// Try to parse the variable value as a color
		const resolvedValue = resolveValue(varData.value, cssVariables);
		if (["none", "transparent", "inherit", "initial"].includes(resolvedValue)) {
			return;
		}

		const normalized = normalizeColor(resolvedValue);
		if (!normalized) return;

		const colorObj = normalized.colorObj;
		const normalizedValue = normalized.normalized;
		const lightness = getLightness(colorObj);

		// Score this candidate based on variable name only
		// Use a synthetic selector (like :root) since no actual selector applies
		const scores = scoreCandidate(":root", varName, "color", colorObj);

		// Add to all matching categories, but only for roles that are semantically related
		// to the variable name (e.g., don't add --primary to border unless it mentions border)
		const semanticRoles = extractSemanticRoles(varName);

		addScoredCandidate(
			candidates,
			scores,
			{
				value: normalizedValue,
				originSelector: `:root /* ${varName} */`,
				colorObj,
				tier: extractTier(varName) ?? undefined,
				lightness,
				varName: varName,
				mode: varData.mode,
			},
			// Role filter: skip border/ring unless variable name explicitly mentions them
			(key) => {
				if (
					(key === "border" || key === "ring") &&
					!semanticRoles.includes(key)
				) {
					return false;
				}
				return true;
			},
		);
	});

	return candidates;
};
