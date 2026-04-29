import { camelToKebab } from "./camelToKebab";
import type { ColorPalette } from "./types";

export function paletteToStyle(palette: ColorPalette) {
  return Object.entries(palette)
    .filter(([, color]) => color != null)
    .map(([key, color]) => `--color-${camelToKebab(key)}: ${color}`)
    .join("; ");
}
