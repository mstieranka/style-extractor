/**
 * Filtering utilities for color candidates
 */

import Color from "colorjs.io";
import { isRedOrangeHue } from "./colorUtils";
import {
	LIGHTNESS_THRESHOLD_BORDER_MAX,
	LIGHTNESS_THRESHOLD_BORDER_MIN,
	LIGHTNESS_THRESHOLD_DARK_TEXT,
	LIGHTNESS_THRESHOLD_LIGHT_BG,
	LIGHTNESS_THRESHOLD_MUTED_MAX,
	LIGHTNESS_THRESHOLD_MUTED_MIN,
	LIGHTNESS_THRESHOLD_PRIMARY_MAX,
	LIGHTNESS_THRESHOLD_PRIMARY_MIN,
	SATURATION_THRESHOLD_BORDER_GRAY,
	SCORE_FALLBACK_DANGER,
	type ColorPaletteKey,
} from "@style-extractor/shared";
import type { ColorCandidate } from "./types";

/**
 * Filter candidates with mode precedence: light → neutral → dark
 * Within neutral mode, apply lightness-based preference for better light/dark theme detection
 */
export const filterCandidatesByMode = (
	candidates: Record<ColorPaletteKey, ColorCandidate[]>,
): void => {
	(Object.keys(candidates) as ColorPaletteKey[]).forEach((key) => {
		const hasLight = candidates[key].some((c) => c.mode === "light");
		const hasNeutral = candidates[key].some((c) => c.mode === "neutral");

		// Prefer light mode if available
		if (hasLight) {
			candidates[key] = candidates[key].filter((c) => c.mode === "light");
		}
		// Otherwise prefer neutral if available
		else if (hasNeutral) {
			candidates[key] = candidates[key].filter((c) => c.mode === "neutral");

			// If all remaining candidates are neutral and there are multiple, apply lightness-based filtering
			// This handles cases like Carbon Design where both light and dark themes use neutral class selectors
			if (candidates[key].length > 1) {
				const neutralCandidates = candidates[key];

				// For background/surface colors: prefer lighter colors
				if (key === "background" || key === "surface") {
					const lightBgCandidates = neutralCandidates.filter(
						(c) => (c.lightness ?? 50) > LIGHTNESS_THRESHOLD_LIGHT_BG,
					);
					if (lightBgCandidates.length > 0) {
						candidates[key] = lightBgCandidates;
					}
				}
				// For text colors: prefer very dark colors
				else if (key === "text") {
					const darkTextCandidates = neutralCandidates.filter(
						(c) => (c.lightness ?? 50) < LIGHTNESS_THRESHOLD_DARK_TEXT,
					);
					if (darkTextCandidates.length > 0) {
						candidates[key] = darkTextCandidates;
					}
				}
				// For muted colors: prefer mid-dark colors
				else if (key === "muted") {
					const mutedCandidates = neutralCandidates.filter((c) => {
						const lightness = c.lightness ?? 50;
						return (
							lightness > LIGHTNESS_THRESHOLD_MUTED_MIN &&
							lightness < LIGHTNESS_THRESHOLD_MUTED_MAX
						);
					});
					if (mutedCandidates.length > 0) {
						candidates[key] = mutedCandidates;
					}
				}
				// For border: prefer mid-light grays and low saturation
				else if (key === "border") {
					// First try to get desaturated (gray) colors
					const grayBorderCandidates = neutralCandidates.filter((c) => {
						const lightness = c.lightness ?? 50;
						if (
							lightness < LIGHTNESS_THRESHOLD_BORDER_MIN ||
							lightness > LIGHTNESS_THRESHOLD_BORDER_MAX
						)
							return false;

						// Check saturation - prefer low saturation for borders (neutral grays)
						if (c.colorObj) {
							const hsl = c.colorObj.to("hsl");
							const saturation = hsl.coords[1] ?? 0; // 0 to 100
							return saturation < SATURATION_THRESHOLD_BORDER_GRAY;
						}
						return true;
					});

					if (grayBorderCandidates.length > 0) {
						candidates[key] = grayBorderCandidates;
					} else {
						// Fallback to any mid-light color
						const borderCandidates = neutralCandidates.filter((c) => {
							const lightness = c.lightness ?? 50;
							return (
								lightness > LIGHTNESS_THRESHOLD_BORDER_MIN &&
								lightness < LIGHTNESS_THRESHOLD_BORDER_MAX
							);
						});
						if (borderCandidates.length > 0) {
							candidates[key] = borderCandidates;
						}
					}
				}
				// For primary/danger/link: prefer more saturated, mid-range lightness colors
				else if (key === "primary" || key === "danger" || key === "link") {
					const vibrantCandidates = neutralCandidates.filter((c) => {
						const lightness = c.lightness ?? 50;
						return (
							lightness > LIGHTNESS_THRESHOLD_PRIMARY_MIN &&
							lightness < LIGHTNESS_THRESHOLD_PRIMARY_MAX
						);
					});
					if (vibrantCandidates.length > 0) {
						candidates[key] = vibrantCandidates;
					}
				}
			}
		}
		// Otherwise keep dark mode candidates
		// (no filtering needed if only dark mode exists)
	});
};

/**
 * Dedup candidates per token type
 */
export const dedupCandidates = (
	candidates: Record<ColorPaletteKey, ColorCandidate[]>,
): void => {
	(Object.keys(candidates) as ColorPaletteKey[]).forEach((key) => {
		const seen = new Set<string>();
		candidates[key] = candidates[key].filter((candidate) => {
			if (seen.has(candidate.value)) {
				return false;
			} else {
				seen.add(candidate.value);
				return true;
			}
		});
	});
};

/**
 * Fallback: If no danger candidates found, scan all colors for red-orange hues
 */
export const fallbackDanger = (
	candidates: Record<ColorPaletteKey, ColorCandidate[]>,
): void => {
	if (candidates.danger.length === 0) {
		const allCandidates = [
			...candidates.background,
			...candidates.surface,
			...candidates.text,
			...candidates.muted,
			...candidates.primary,
			...candidates.border,
			...candidates.link,
			...candidates.ring,
		];

		const dangerCandidates = allCandidates.filter((c) => {
			const colorObj = c.colorObj || new Color(c.value);
			return isRedOrangeHue(colorObj);
		});

		// Deduplicate and add to danger candidates
		const seen = new Set<string>();
		dangerCandidates.forEach((candidate) => {
			if (!seen.has(candidate.value)) {
				seen.add(candidate.value);
				candidates.danger.push({
					...candidate,
					score: SCORE_FALLBACK_DANGER, // Lower score since it's hue-based fallback
				});
			}
		});
	}
};

/**
 * Perceptual deduplication using DeltaE 2000.
 * Removes colors that are visually indistinguishable from higher-scoring candidates.
 * This catches cases like #FEFEFF vs #FFFFFF that string-based dedup would miss.
 */
export const dedupByDeltaE = (
	candidates: Record<ColorPaletteKey, ColorCandidate[]>,
	threshold: number,
): void => {
	(Object.keys(candidates) as ColorPaletteKey[]).forEach((key) => {
		const kept: ColorCandidate[] = [];

		// Process candidates in score order (highest first) so we keep the best representative
		const sortedCandidates = [...candidates[key]].sort(
			(a, b) => (b[key] ?? b.score) - (a[key] ?? a.score),
		);

		sortedCandidates.forEach((candidate) => {
			if (!candidate.colorObj) {
				// Keep candidates without colorObj (shouldn't happen but be safe)
				kept.push(candidate);
				return;
			}

			// Check if this color is perceptually similar to any we've already kept
			const isDuplicate = kept.some((existing) => {
				if (!existing.colorObj || !candidate.colorObj) return false;
				try {
					const deltaE = candidate.colorObj.deltaE(existing.colorObj, "2000");
					return deltaE < threshold;
				} catch {
					return false;
				}
			});

			if (!isDuplicate) {
				kept.push(candidate);
			}
		});

		candidates[key] = kept;
	});
};
