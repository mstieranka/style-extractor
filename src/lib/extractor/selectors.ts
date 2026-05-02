/**
 * Selector utilities for CSS rule matching and mode detection
 */

import type { Atrule, Declaration, Rule } from "css-tree";

/**
 * Normalize a selector for robust matching: lowercase, strip pseudo-elements/classes for tag checks
 */
export const normalizeSelector = (selector: string): string => {
	return selector
		.toLowerCase()
		.trim()
		.replace(
			/::?(before|after|first-child|last-child|nth-child|hover|focus|active|visited|link|focus-visible|focus-within|disabled|checked|placeholder)/g,
			"",
		)
		.replace(/\s+/g, " ");
};

/**
 * Check if selector contains pseudo-state classes (hover, focus, active, visited, etc.)
 */
export const hasPseudoState = (selector: string): boolean => {
	return /:(hover|active|focus|visited|focus-visible|focus-within|disabled|checked)/i.test(
		selector,
	);
};

/**
 * Check if a selector contains a specific tag
 * Handles compound selectors, combinators, and comma-separated lists
 */
export const selectorHasTag = (selector: string, tag: string): boolean => {
	const normalized = normalizeSelector(selector);
	const parts = normalized.split(",").map((s) => s.trim());

	return parts.some((part) => {
		// Split by combinators and whitespace to get individual simple selectors
		const tokens = part
			.split(/[\s>+~]/)
			.map((t) => t.trim())
			.filter((t) => t);

		return tokens.some((token) => {
			// Check if token is exactly the tag or starts with tag followed by class/attribute/id
			return (
				token === tag ||
				token.startsWith(`${tag}.`) ||
				token.startsWith(`${tag}#`) ||
				token.startsWith(`${tag}[`)
			);
		});
	});
};

/**
 * Detect if a selector indicates dark mode (class-based approach)
 */
export const isDarkModeSelector = (selector: string): boolean => {
	return (
		/\.dark(?:-+mode|-+theme)?(?:\s|$|:|\.)/i.test(selector) ||
		/--dark(?:\s|$|:|\.)/i.test(selector) ||
		selector.includes('[data-theme="dark"]') ||
		selector.includes('[data-mode="dark"]') ||
		// Carbon Design System dark themes (g90, g100 are dark gray themes)
		/\.cds--g(90|100)(?:\s|$|:|\.)/i.test(selector)
	);
};

/**
 * Detect if a selector indicates light mode (class-based approach)
 */
export const isLightModeSelector = (selector: string): boolean => {
	return (
		/\.light(?:-mode|-theme)?(?:\s|$|:|\.)/i.test(selector) ||
		selector.includes('[data-theme="light"]') ||
		selector.includes('[data-mode="light"]') ||
		// Carbon Design System light themes (white, g10 are light themes)
		/\.cds--(white|g10)(?:\s|$|:|\.)/i.test(selector)
	);
};

/**
 * Detect mode from selector and context
 */
export const detectMode = (
	selector: string,
	inDarkMediaQuery: boolean,
): "light" | "dark" | "neutral" => {
	if (inDarkMediaQuery || isDarkModeSelector(selector)) {
		return "dark";
	}
	// Explicitly light mode selector
	if (isLightModeSelector(selector)) {
		return "light";
	}
	// Default selectors like body, html, or no mode indicator
	return "neutral";
};

/**
 * Type guards for csstree nodes
 */
export const isRule = (node: unknown): node is Rule => {
	return (node as Rule).type === "Rule";
};

export const isDeclaration = (node: unknown): node is Declaration => {
	return (node as Declaration).type === "Declaration";
};

export const isAtrule = (node: unknown): node is Atrule => {
	return (node as Atrule).type === "Atrule";
};
