export type ColorPaletteKey =
	| "background"
	| "surface"
	| "text"
	| "muted"
	| "primary"
	| "primaryVariant"
	| "border"
	| "danger"
	| "dangerVariant"
	| "link"
	| "linkVariant"
	| "ring";

export type ColorPalette = Record<ColorPaletteKey, string | null>;
export type ColorPaletteOptions = Record<ColorPaletteKey, string[] | null>;

export type FontSizes = Record<string, string | null>;
