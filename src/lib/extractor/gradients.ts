/**
 * Gradient parsing utilities for extracting colors from CSS gradients
 */

import { normalizeColor } from "./normalize";

/**
 * Extract all color stops from gradient (linear-gradient, radial-gradient, conic-gradient)
 * Returns array of all valid colors found, or empty array if none
 */
export const extractGradientColors = (value: string): string[] => {
  const trimmed = value.trim();
  const colors: string[] = [];

  // Check if it's a gradient function
  if (
    !/(linear|radial|conic|repeating-linear|repeating-radial|repeating-conic)-gradient\s*\(/i.test(
      trimmed
    )
  ) {
    return colors;
  }

  // Extract the gradient content (between outermost parentheses)
  const match = trimmed.match(/gradient\s*\((.+)\)$/i);
  if (!match) return colors;

  const gradientContent = match[1];

  // Split by commas (handling nested functions like rgb())
  // Simple approach: split by comma and check each part
  const parts = gradientContent.split(",");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();

    // Skip direction/position keywords
    if (
      /^(to\s+|\d+deg|circle|ellipse|at\s+|top|bottom|left|right|center)/i.test(
        part
      )
    ) {
      continue;
    }

    // Try to extract color from color stop (e.g., "#fff 0%" or "rgb(255,0,0)")
    // Remove percentage or pixel position at the end
    const colorPart = part.replace(/\s+(\d+%|\d+px)$/, "").trim();

    // Handle rgb/rgba/hsl/hsla functions that may span multiple comma-separated parts
    if (/(rgb|hsl)a?\s*\(/i.test(colorPart)) {
      // Reconstruct the full function call
      let fullColor = colorPart;
      let j = i + 1;
      while (j < parts.length && !fullColor.includes(")")) {
        fullColor += "," + parts[j].trim();
        j++;
      }
      // Extract just the color function
      const funcMatch = fullColor.match(/((?:rgb|hsl)a?\s*\([^)]+\))/i);
      if (funcMatch) {
        const normalized = normalizeColor(funcMatch[1]);
        if (normalized) {
          colors.push(funcMatch[1]);
          // Skip the parts we've already consumed
          i = j - 1;
          continue;
        }
      }
    }

    // Try parsing as direct color
    const normalized = normalizeColor(colorPart);
    if (normalized) {
      colors.push(colorPart);
    }
  }

  return colors;
};
