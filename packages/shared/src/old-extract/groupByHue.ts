// npm i colorjs.io
import Color from "colorjs.io";

type Options = {
	/** Max allowed angular gap (deg) for merging clusters */
	maxGapDegrees?: number; // e.g. 18
	/** Below this chroma, treat as achromatic (no usable hue) */
	achromaticChroma?: number; // e.g. 0.02
};

type Member = {
	hex: string;
	hue: number; // degrees [0, 360)
	chroma: number; // OKLCH chroma
	lightness: number; // OKLCH L (0..1)
};

type HueCluster = {
	meanHue: number; // circular, chroma-weighted mean
	colors: string[]; // original hexes (order preserved by input)
	members: Member[]; // per-color data
};

type GroupedByHue = {
	clusters: HueCluster[];
	achromatic: string[]; // colors too low-chroma to classify by hue
};

export function groupByHueSmart(
	hexColors: string[],
	opts: Options = {},
): GroupedByHue {
	const { maxGapDegrees = 18, achromaticChroma = 0.02 } = opts;

	// --- helpers ---
	const toMember = (hex: string): Member | null => {
		try {
			const c = new Color(hex).to("oklch");
			const [L, C, H] = c.coords as [number, number, number];
			if (!Number.isFinite(C) || C < achromaticChroma || !Number.isFinite(H))
				return null;
			return {
				hex,
				hue: ((H % 360) + 360) % 360,
				chroma: C,
				lightness: L,
			};
		} catch {
			return null;
		}
	};

	const angDist = (a: number, b: number) => {
		const d = Math.abs(a - b) % 360;
		return d > 180 ? 360 - d : d;
	};

	const circularMean = (hues: number[], weights: number[]) => {
		let x = 0,
			y = 0;
		for (let i = 0; i < hues.length; i++) {
			const rad = (hues[i] * Math.PI) / 180;
			const w = weights[i];
			x += Math.cos(rad) * w;
			y += Math.sin(rad) * w;
		}
		const angle = Math.atan2(y, x);
		const deg = (angle * 180) / Math.PI;
		return ((deg % 360) + 360) % 360;
	};

	// --- split input into achromatic + chromatic members ---
	const achromatic: string[] = [];
	const members: Member[] = [];
	for (const hex of hexColors) {
		const m = toMember(hex);
		if (!m) achromatic.push(hex);
		else members.push(m);
	}
	if (members.length === 0) return { clusters: [], achromatic };

	// --- agglomerative single-linkage on circular distance ---
	// Start with each color as its own cluster
	const clusters: Member[][] = members.map((m) => [m]);

	// Precompute pairwise distances for speed (small n expected)
	const dist = (i: number, j: number) => {
		// cluster distance = min single-link distance between any members
		let best = Infinity;
		for (const a of clusters[i]) {
			for (const b of clusters[j]) {
				const d = angDist(a.hue, b.hue);
				if (d < best) best = d;
				if (best === 0) break;
			}
			if (best === 0) break;
		}
		return best;
	};

	// Merge closest clusters while there exists a pair within maxGapDegrees
	while (clusters.length > 1) {
		let bestI = -1,
			bestJ = -1,
			bestD = Infinity;
		for (let i = 0; i < clusters.length; i++) {
			for (let j = i + 1; j < clusters.length; j++) {
				const d = dist(i, j);
				if (d < bestD) {
					bestD = d;
					bestI = i;
					bestJ = j;
				}
			}
		}
		if (bestD > maxGapDegrees) break;
		// merge J into I
		clusters[bestI] = clusters[bestI].concat(clusters[bestJ]);
		clusters.splice(bestJ, 1);
	}

	// --- build outputs with chroma-weighted circular means ---
	const result: HueCluster[] = clusters.map((members) => {
		const hues = members.map((m) => m.hue);
		const weights = members.map((m) => Math.max(m.chroma, 1e-6));
		const meanHue = circularMean(hues, weights);

		// preserve input order for the color list
		const inputOrder = new Map<string, number>();
		hexColors.forEach((h, idx) => {
			inputOrder.set(h, idx);
		});

		const colors = members
			.slice()
			.sort(
				(a, b) => (inputOrder.get(a.hex) ?? 0) - (inputOrder.get(b.hex) ?? 0),
			)
			.map((m) => m.hex);

		return { meanHue, colors, members };
	});

	// sort clusters by mean hue (0..360)
	result.sort((a, b) => a.meanHue - b.meanHue);

	return { clusters: result, achromatic };
}

/* ------------------------------
Usage:

import { groupByHueSmart } from "./groupByHueSmart";

const input = ["#FF0000", "#FE4040", "#00FFAA", "#FDFEFE", "#010101", "#00F5FF", "#FF00F0"];
const { clusters, achromatic } = groupByHueSmart(input, {
  maxGapDegrees: 20,       // tweak for tighter/looser grouping
  achromaticChroma: 0.03,  // tweak sensitivity to near-grays
});

console.log(clusters.map(c => ({
  meanHue: c.meanHue.toFixed(1),
  colors: c.colors
})));
console.log({ achromatic });
-------------------------------- */
