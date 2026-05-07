import type { ColorPalette } from "@style-extractor/shared";
import { camelToKebab } from "./camelToKebab";

export function paletteToStyle(palette: ColorPalette) {
	return Object.entries(palette)
		.filter(([, color]) => color != null)
		.map(([key, color]) => `--color-${camelToKebab(key)}: ${color}`)
		.join("; ");
}
