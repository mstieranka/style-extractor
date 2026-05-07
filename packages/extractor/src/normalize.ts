/**
 * Color normalization and parsing utilities with caching
 */

import Color from "colorjs.io";
import { MIN_ALPHA_THRESHOLD } from "@style-extractor/shared";

// Simple cache for color normalization/parsing (no eviction needed for typical use)
const normalizationCache = new Map<
	string,
	{ normalized: string; colorObj: Color }
>();

/**
 * Normalize a color string to hex format and parse into Color object
 * Handles various CSS color formats including modern syntax with alpha channels
 * Filters out semi-transparent colors (alpha < 0.9)
 * Returns null if color is invalid or too transparent
 */
export const normalizeColor = (
	colorString: string,
): { normalized: string; colorObj: Color } | null => {
	if (normalizationCache.has(colorString)) {
		return normalizationCache.get(colorString) as {
			normalized: string;
			colorObj: Color;
		};
	}

	try {
		// Preprocess: handle modern CSS color syntax with alpha channel variables
		// e.g., "rgb(230 247 255 / var(--tw-bg-opacity))" or "rgb(230 247 255/var(--tw-bg-opacity))"
		let processedColor = colorString.trim();

		// Handle 4-digit and 8-digit hex with alpha (#RRGGBBAA or #RGBA)
		// Convert to 6-digit hex by stripping alpha
		if (/^#[0-9a-fA-F]{8}$/.test(processedColor)) {
			// 8-digit hex: #RRGGBBAA -> #RRGGBB
			processedColor = processedColor.substring(0, 7);
		} else if (/^#[0-9a-fA-F]{4}$/.test(processedColor)) {
			// 4-digit hex: #RGBA -> #RGB
			processedColor = processedColor.substring(0, 4);
		}

		// Remove alpha channel with CSS variables: "/ var(--...)" or "/var(--...)"
		if (processedColor.includes("var(")) {
			processedColor = processedColor.replace(
				/\s*\/\s*var\([^)]+\)\s*\)$/,
				")",
			);
			processedColor = processedColor.replace(/\/var\([^)]+\)\)$/, ")");
		}

		// Convert space-separated color syntax to comma-separated for better compatibility
		// Handles: rgb(r g b), rgba(r g b a), rgb(r g b / a), hsl(h s l), hsla(h s l a), hsl(h s l / a)
		processedColor = processedColor
			.replace(/rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*[\d.]+\)/, "rgb($1, $2, $3)") // rgb with / alpha
			.replace(/rgb\((\d+)\s+(\d+)\s+(\d+)\)/, "rgb($1, $2, $3)") // plain rgb
			.replace(
				/rgba\((\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\)/,
				"rgba($1, $2, $3, $4)",
			) // rgba
			.replace(
				/hsl\(([\d.]+)\s+([\d.]+%?)\s+([\d.]+%?)\s*\/\s*[\d.]+\)/,
				"hsl($1, $2, $3)",
			) // hsl with / alpha
			.replace(/hsl\(([\d.]+)\s+([\d.]+%?)\s+([\d.]+%?)\)/, "hsl($1, $2, $3)") // plain hsl
			.replace(
				/hsla\(([\d.]+)\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)\)/,
				"hsla($1, $2, $3, $4)",
			); // hsla

		const colorObj = new Color(processedColor);

		// Filter out semi-transparent colors
		// These are typically shadows, overlays, or hover states, not semantic colors
		const alpha = colorObj.alpha;
		if (alpha < MIN_ALPHA_THRESHOLD) {
			return null;
		}

		const normalized = colorObj.toString({ format: "hex" });

		const result = { normalized, colorObj };
		normalizationCache.set(colorString, result);
		return result;
	} catch {
		return null;
	}
};
