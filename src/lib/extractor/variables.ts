/**
 * CSS variable collection and resolution utilities
 */

import * as csstree from "css-tree";
import {
	MULTI_LEVEL_VAR_MAX_DEPTH,
	VAR_RESOLUTION_MAX_DEPTH,
} from "./constants";
import { normalizeColor } from "./normalize";
import { detectMode, hasPseudoState, isDeclaration, isRule } from "./selectors";
import type { CssVariablesMap } from "./types";

/**
 * Collect all CSS variable definitions with their mode context
 */
export const collectCssVariables = (ast: csstree.CssNode): CssVariablesMap => {
	const cssVariables: CssVariablesMap = new Map();

	csstree.walk(ast, {
		visit: "Rule",
		enter(this: csstree.WalkContext, node: csstree.CssNode) {
			if (!isRule(node)) return;

			const selector = csstree.generate(node.prelude);

			// Skip pseudo-state selectors when collecting CSS variables
			// These represent hover/focus/active states, not default theme colors
			if (hasPseudoState(selector)) {
				return;
			}

			// Check if we're inside a dark mode media query
			let inDarkMediaQuery = false;
			if (this.atrule && this.atrule.name === "media" && this.atrule.prelude) {
				const mediaQuery = csstree.generate(this.atrule.prelude);
				inDarkMediaQuery = /prefers-color-scheme:\s*dark/i.test(mediaQuery);
			}

			const mode = detectMode(selector, inDarkMediaQuery);

			csstree.walk(node.block, {
				visit: "Declaration",
				enter(decl: csstree.CssNode) {
					if (!isDeclaration(decl)) return;

					if (decl.property.startsWith("--")) {
						const value =
							(decl.value as csstree.Raw).value?.trim() ||
							csstree.generate(decl.value).trim();

						// If variable already exists, prefer light → neutral → dark
						const existing = cssVariables.get(decl.property);
						if (existing) {
							// Keep existing if it's lighter than new one
							if (
								existing.mode === "light" ||
								(existing.mode === "neutral" && mode === "dark")
							) {
								return; // Skip, keep the lighter mode
							}
						}

						cssVariables.set(decl.property, { value, mode });
					}
				},
			});
		},
	});

	return cssVariables;
};

/**
 * Helper to resolve all var(...) occurrences with recursion and fallbacks
 */
export const resolveValue = (
	val: string,
	cssVariables: CssVariablesMap,
	depth = 0,
): string => {
	// Prevent infinite recursion
	if (depth > VAR_RESOLUTION_MAX_DEPTH) return val;

	if (!val?.includes("var(")) return val;

	// Regex to match all var(--name, fallback?) occurrences
	const VAR_RE = /var\((--[^,)\s]+)(?:\s*,\s*([^)]+))?\)/g;

	// Replace each var(...) with its resolved value (or fallback) recursively
	const replaced = val.replace(
		VAR_RE,
		(_match, varName: string, fallback: string) => {
			if (cssVariables.has(varName)) {
				const resolved = (cssVariables.get(varName) as { value: string }).value;
				// Recursively resolve the resolved value (in case it contains further vars)
				return resolveValue(resolved, cssVariables, depth + 1);
			}
			if (fallback) {
				// Use the provided fallback (which may itself contain var())
				return resolveValue(fallback, cssVariables, depth + 1);
			}
			// If we can't resolve, leave the var(...) intact to allow later handling
			return _match;
		},
	);

	// If replacement produced additional var(...) occurrences, try resolving again (depth prevents infinite loop)
	if (replaced.includes("var(") && depth < VAR_RESOLUTION_MAX_DEPTH) {
		return resolveValue(replaced, cssVariables, depth + 1).trim();
	}

	return replaced.trim();
};

/**
 * Multi-level var() resolution for color values (up to 3 levels)
 * Returns the resolved color if var(--x) eventually points to a color literal
 * Includes cycle detection to prevent infinite loops
 */
export const resolveMultiLevelColorVar = (
	val: string | undefined,
	cssVariables: CssVariablesMap,
	depth: number = 0,
	visited: Set<string> = new Set(),
): string | null => {
	// Limit depth to prevent excessive chasing
	if (depth > MULTI_LEVEL_VAR_MAX_DEPTH || !val) return null;

	const trimmed = val.trim();

	// Check if value is a var() reference
	const match = trimmed.match(/^var\((--[^,)]+)(?:,\s*(.+))?\)$/);
	if (!match) {
		// Not a var() - check if it's a valid color
		const normalized = normalizeColor(trimmed);
		return normalized ? trimmed : null;
	}

	const varName = match[1];
	const fallback = match[2];

	// Cycle detection: if we've seen this variable before in the chain, stop
	if (visited.has(varName)) {
		// Try fallback if available
		if (fallback) {
			return resolveMultiLevelColorVar(
				fallback,
				cssVariables,
				depth + 1,
				visited,
			);
		}
		return null;
	}

	// Mark this variable as visited for cycle detection
	const newVisited = new Set(visited);
	newVisited.add(varName);

	// Try to resolve the variable
	if (cssVariables.has(varName)) {
		const resolvedValue = cssVariables.get(varName)?.value.trim();

		// Recursively resolve (could be another var() or a color literal)
		const result = resolveMultiLevelColorVar(
			resolvedValue,
			cssVariables,
			depth + 1,
			newVisited,
		);
		if (result) return result;
	}

	// If resolution failed and there's a fallback, try that
	if (fallback) {
		return resolveMultiLevelColorVar(
			fallback,
			cssVariables,
			depth + 1,
			newVisited,
		);
	}

	return null;
};

/**
 * Extract variable name from a var() reference
 */
export const resolveVarName = (val: string): string | null => {
	const match = val.match(/var\((--[^,)]+)/);
	return match ? match[1] : null;
};

/**
 * Resolve the mode of a CSS variable reference
 */
export const resolveVarMode = (
	val: string,
	cssVariables: CssVariablesMap,
): "light" | "dark" | "neutral" | null => {
	const match = val.match(/var\((--[^,)]+)/);
	if (match && cssVariables.has(match[1])) {
		return cssVariables.get(match[1])?.mode ?? null;
	}
	return null;
};

/**
 * Extract numeric tier from variable name (e.g., 3 from surface3 or 15 from --colorNeutralBackground15)
 */
export const extractTier = (varName: string): number | null => {
	// Match trailing numbers in variable name
	const match = varName.match(/(\d+)(?:[^\d]*)?$/);
	return match ? parseInt(match[1], 10) : null;
};
