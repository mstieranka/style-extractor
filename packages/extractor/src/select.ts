/**
 * Selection utilities for choosing best candidates
 */

import {
	MAX_RESULTS,
	MIN_SCORE,
	type ColorPaletteKey,
} from "@style-extractor/shared";
import { roleDesirability } from "./score";
import type { ColorCandidate } from "./types";

/**
 * Enhanced selection that considers tier, lightness, and Lab centroid for better midrange selection
 */
export const getBest = (list: ColorCandidate[]): string | null => {
	if (list.length === 0) return null;

	// Sort by score descending (create a copy to avoid mutation)
	const sorted = [...list].sort((a, b) => b.score - a.score);

	// Get the top score
	const topScore = sorted[0].score;

	// Get all candidates with the top score
	const topCandidates = sorted.filter((c) => c.score === topScore);

	// If there's only one top candidate, return it
	if (topCandidates.length === 1) return topCandidates[0].value;

	// Among top candidates, prefer those with tiers closest to midrange
	// and lightness closest to 50% (midrange)
	const withTiers = topCandidates.filter(
		(c) => c.tier !== null && c.tier !== undefined,
	);

	if (withTiers.length > 0) {
		// Find the max tier to determine midrange
		const maxTier = Math.max(
			...withTiers
				.map((c) => c.tier)
				.filter((t): t is number => t !== null && t !== undefined),
		);
		const midTier = Math.ceil(maxTier / 2);

		// Sort by proximity to mid tier, then by proximity to lightness 50
		const sortedTiers = [...withTiers].sort((a, b) => {
			const aTierDist = Math.abs((a.tier ?? 0) - midTier);
			const bTierDist = Math.abs((b.tier ?? 0) - midTier);

			if (aTierDist !== bTierDist) {
				return aTierDist - bTierDist;
			}

			// If tier distance is the same, prefer lightness closer to 50
			const aLightDist = Math.abs((a.lightness ?? 50) - 50);
			const bLightDist = Math.abs((b.lightness ?? 50) - 50);
			return aLightDist - bLightDist;
		});

		return sortedTiers[0].value;
	}

	// If no tiers, use Lab-based centroid/medoid selection for perceptually representative color
	const candidatesWithColorObj = topCandidates.filter((c) => c.colorObj);

	if (candidatesWithColorObj.length > 1) {
		// Convert all to Lab coordinates
		const labCoords = candidatesWithColorObj
			.filter(
				(c): c is ColorCandidate & { colorObj: object } =>
					c.colorObj !== undefined,
			)
			.map((c) => {
				const lab = c.colorObj.to("lab");
				return {
					candidate: c,
					L: lab.coords[0] ?? 0,
					a: lab.coords[1] ?? 0,
					b: lab.coords[2] ?? 0,
				};
			});

		// Compute centroid in Lab space
		const centroidL =
			labCoords.reduce((sum, c) => sum + c.L, 0) / labCoords.length;
		const centroidA =
			labCoords.reduce((sum, c) => sum + c.a, 0) / labCoords.length;
		const centroidB =
			labCoords.reduce((sum, c) => sum + c.b, 0) / labCoords.length;

		// Find medoid (candidate closest to centroid)
		const distances = labCoords.map((c) => {
			const dL = c.L - centroidL;
			const dA = c.a - centroidA;
			const dB = c.b - centroidB;
			return {
				candidate: c.candidate,
				distance: Math.sqrt(dL * dL + dA * dA + dB * dB),
			};
		});

		distances.sort((a, b) => a.distance - b.distance);
		return distances[0].candidate.value;
	}

	// Fallback: prefer lightness closest to 50
	const sortedByLightness = [...topCandidates].sort((a, b) => {
		const aLightDist = Math.abs((a.lightness || 50) - 50);
		const bLightDist = Math.abs((b.lightness || 50) - 50);
		return aLightDist - bLightDist;
	});

	return sortedByLightness[0].value;
};

/**
 * Get sorted and trimmed color array for a specific purpose.
 * Filters by MIN_SCORE, sorts by purpose score descending, trims to MAX_RESULTS.
 */
export const getSortedForPurpose = (
	list: ColorCandidate[],
	purpose: ColorPaletteKey,
): string[] | null => {
	if (list.length === 0) return null;

	// Filter by MIN_SCORE, sort by purpose score descending, trim to MAX_RESULTS
	const filtered = list
		.filter((c) => c[purpose] > MIN_SCORE)
		.sort((a, b) => {
			// Apply desirability adjustments
			const aAdjusted = a[purpose] + roleDesirability(a, purpose);
			const bAdjusted = b[purpose] + roleDesirability(b, purpose);

			// Primary sort: adjusted purpose score descending
			const scoreDiff = bAdjusted - aAdjusted;
			if (scoreDiff !== 0) return scoreDiff;

			// Tie-breaker for link: prefer higher primary scores (links often use primary color)
			if (purpose === "link") {
				const primaryDiff = b.primary - a.primary;
				if (primaryDiff !== 0) return primaryDiff;
			}

			// Tie-breaker: prefer candidates with variable names over literals
			if (a.varName && !b.varName) return -1;
			if (!a.varName && b.varName) return 1;

			return 0;
		})
		.slice(0, MAX_RESULTS)
		.map((c) => c.value);

	return filtered.length > 0 ? filtered : null;
};

/**
 * Convert candidates to color array (sorted by score)
 */
export const toColors = (list: ColorCandidate[]): string[] | null => {
	if (list.length === 0) return null;
	// Sort by score descending and return all values (create a copy to avoid mutation)
	const sorted = [...list].sort((a, b) => b.score - a.score);
	return sorted.map((c) => c.value);
};
