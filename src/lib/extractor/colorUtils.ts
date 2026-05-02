/**
 * Color utility functions for extracting color properties and metrics
 */

import type Color from "colorjs.io";
import {
	DANGER_HUE_RANGE_ORANGE_END,
	DANGER_HUE_RANGE_RED_START,
	SATURATION_THRESHOLD_DANGER,
} from "./constants";

/**
 * Get lightness value from color (0-100)
 */
export const getLightness = (colorObj: Color): number => {
	const lch = colorObj.to("lch");
	return lch.coords[0] ?? 0; // L in LCH is 0-100
};

/**
 * Get saturation value from color (0-100)
 */
export const getSaturation = (colorObj: Color): number => {
	const hsl = colorObj.to("hsl");
	return hsl.coords[1] ?? 0; // S in HSL is 0-100
};

/**
 * Get hue value from color (0-360)
 */
export const getHue = (colorObj: Color): number => {
	const hsl = colorObj.to("hsl");
	return hsl.coords[0] ?? 0; // H in HSL is 0-360
};

/**
 * Check if a color is in the red-orange danger spectrum
 */
export const isRedOrangeHue = (colorObj: Color): boolean => {
	const hsl = colorObj.to("hsl");
	const hue = hsl.coords[0] ?? 0; // 0 to 360
	const saturation = hsl.coords[1] ?? 0; // 0 to 100

	// Red is roughly 340-360 or 0-30 (extending to orange)
	// Also require minimum saturation to avoid grays/desaturated colors
	const isInRedOrangeRange =
		hue >= DANGER_HUE_RANGE_RED_START || hue <= DANGER_HUE_RANGE_ORANGE_END;
	const isSaturated = saturation > SATURATION_THRESHOLD_DANGER;

	return isInRedOrangeRange && isSaturated;
};

/**
 * Compute relative luminance from Color object (for WCAG contrast calculations)
 */
export const getRelativeLuminance = (colorObj: Color): number => {
	const rgb = colorObj.to("srgb");
	const [r, g, b] = rgb.coords;

	// Convert to 0-1 range and apply gamma correction
	const toLinear = (c: number) => {
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};

	const rLinear = toLinear(r ?? 0);
	const gLinear = toLinear(g ?? 0);
	const bLinear = toLinear(b ?? 0);

	// Compute relative luminance
	return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Compute contrast ratio between two colors (WCAG formula)
 */
export const getContrastRatio = (color1: Color, color2: Color): number => {
	const lum1 = getRelativeLuminance(color1);
	const lum2 = getRelativeLuminance(color2);

	const lighter = Math.max(lum1, lum2);
	const darker = Math.min(lum1, lum2);

	return (lighter + 0.05) / (darker + 0.05);
};
