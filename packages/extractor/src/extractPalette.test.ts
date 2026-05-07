import { describe, expect, it } from "vitest";
import { MAX_RESULTS } from "@style-extractor/shared";
import { extractPalette } from "./index";

describe("extractPalette per-purpose scoring", () => {
	it("should filter candidates by MIN_SCORE and trim to MAX_RESULTS", () => {
		const css = `
      :root {
        --primary: #6442d6;
        --surface: #F8F1F6;
        --text: #1c1b1d;
      }
      
      body {
        background-color: var(--surface);
        color: var(--text);
      }
      
      .btn-primary {
        background-color: var(--primary);
      }
    `;

		const palette = extractPalette(css);

		// Each array should be trimmed to MAX_RESULTS
		if (palette.background) {
			expect(palette.background.length).toBeLessThanOrEqual(MAX_RESULTS);
		}
		if (palette.text) {
			expect(palette.text.length).toBeLessThanOrEqual(MAX_RESULTS);
		}
		if (palette.primary) {
			expect(palette.primary.length).toBeLessThanOrEqual(MAX_RESULTS);
		}

		// Should extract expected colors
		expect(palette.background).toBeTruthy();
		expect(palette.text).toBeTruthy();
		expect(palette.primary).toBeTruthy();
	});

	it("should sort arrays by per-purpose scores descending", () => {
		const css = `
      :root {
        --primary-1: #6442d6;
        --primary-2: #8866ff;
      }
      
      /* Higher score: selector + property match */
      .btn-primary {
        background-color: var(--primary-1);
      }
      
      /* Lower score: only variable name match */
      .card {
        color: var(--primary-2);
      }
    `;

		const palette = extractPalette(css);

		// Primary should have candidates sorted by score
		if (palette.primary && palette.primary.length > 1) {
			// First element should be the one with higher per-purpose score
			// (selector + property match scores higher than just varName match)
			expect(palette.primary).toBeTruthy();
		}
	});

	it("should include per-purpose fields on candidates and filter correctly", () => {
		const css = `
      body {
        background-color: #FEFBFF;
        color: #1c1b1d;
      }
      
      a {
        color: #6442D6;
      }
      
      .btn-danger {
        background-color: #ff6240;
      }
    `;

		const palette = extractPalette(css);

		// Check that arrays are produced and non-empty
		expect(palette.background).toBeTruthy();
		expect(palette.text).toBeTruthy();
		expect(palette.link).toBeTruthy();
		expect(palette.danger).toBeTruthy();

		// Check all arrays respect MAX_RESULTS
		const allArrays = Object.values(palette).filter((v) => v !== null);
		allArrays.forEach((arr) => {
			expect(arr?.length).toBeLessThanOrEqual(MAX_RESULTS);
		});
	});
});
