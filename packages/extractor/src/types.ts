import type Color from "colorjs.io";

export interface ColorCandidate {
	value: string;
	score: number; // Legacy generic score (kept for backward compatibility)
	originSelector: string;
	colorObj?: Color; // Cached color object for logic checks
	tier?: number; // Numeric tier from variable name (e.g., 3 from surface3)
	lightness?: number; // Cached lightness value for tier selection
	varName?: string; // Original variable name if applicable
	mode?: "light" | "dark" | "neutral"; // Color scheme context
	// Per-purpose scores matching ColorPalette keys
	background: number;
	surface: number;
	text: number;
	muted: number;
	primary: number;
	primaryVariant: number;
	border: number;
	danger: number;
	dangerVariant: number;
	link: number;
	linkVariant: number;
	ring: number;
}

export interface CssVariableEntry {
	value: string;
	mode: "light" | "dark" | "neutral";
}

export type CssVariablesMap = Map<string, CssVariableEntry>;

export interface DesirabilityConfig {
	weight?: number;
	satMin?: number;
	satMax?: number;
	lightMin?: number;
	lightMax?: number;
	hueRanges?: number[][];
}

export interface HeuristicWeights {
	semanticVarBoostDefault: number;
	desirability: Record<string, DesirabilityConfig>;
	modeLightnessThresholds: Record<string, number>;
}
