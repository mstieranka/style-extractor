import { describe, expect, it } from "vitest";
import {
	computeMetrics,
	type MetricsConfig,
	type TokenRecord,
} from "./compareTokens";

describe("computeMetrics", () => {
	describe("Color-only tokens", () => {
		it("should compute only color metrics when config specifies computeColors: true", () => {
			const prediction: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#6442d6",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const truth: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#6442d6",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const config: MetricsConfig = {
				computeColors: true,
				computeFontSizes: false,
				computeSyntax: false,
			};

			const result = computeMetrics(prediction, truth, config);

			// Color metrics should be computed
			expect(result.deltaEPerColor).toBeDefined();
			expect(Object.keys(result.deltaEPerColor).length).toBeGreaterThan(0);

			// Since colors match, deltaE should be very close to 0
			Object.values(result.deltaEPerColor).forEach((dE) => {
				expect(dE).toBeLessThan(0.01); // Very small delta E for matching colors
			});

			expect(result.deltaEScoreMean).not.toBeNull();
			expect(result.deltaEScoreMean).toBeGreaterThan(99.99);

			// Font-size metrics should not be computed
			expect(result.fontSizeRelativeErrorPerKey).toEqual({});
			expect(result.fontSizeRelativeErrorMean).toBeNull();
			expect(result.fontSizeRelativeErrorMax).toBeNull();

			// Syntax metrics should not be computed
			expect(result.colorSyntaxValidityRatio).toBe(1);
			expect(result.colorValidCount).toBe(0);
			expect(result.colorTotalCount).toBe(0);
			expect(result.fontSizeSyntaxValidityRatio).toBe(1);
			expect(result.fontSizeValidCount).toBe(0);
			expect(result.fontSizeTotalCount).toBe(0);
		});

		it("should handle null color values by skipping them", () => {
			const prediction: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: null,
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const truth: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#6442d6",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const config: MetricsConfig = {
				computeColors: true,
				computeFontSizes: false,
				computeSyntax: false,
			};

			const result = computeMetrics(prediction, truth, config);

			// Should only have metrics for background and text (primary skipped due to null)
			expect(Object.keys(result.deltaEPerColor).length).toBe(8);
			expect("primary" in result.deltaEPerColor).toBe(false);
		});

		it("should detect different colors with non-zero deltaE", () => {
			const prediction: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#00ff00",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const truth: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#ff0000",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const config: MetricsConfig = {
				computeColors: true,
				computeFontSizes: false,
				computeSyntax: false,
			};

			const result = computeMetrics(prediction, truth, config);

			expect(result.deltaEPerColor.primary).toBeGreaterThan(0);
			expect(result.deltaEScoreMean).toBeLessThan(100);
		});
	});

	describe("Syntax validity", () => {
		it("should compute only syntax metrics when config specifies computeSyntax: true", () => {
			const prediction: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#6442d6",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const truth: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#6442d6",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const config: MetricsConfig = {
				computeColors: false,
				computeFontSizes: false,
				computeSyntax: true,
			};

			const result = computeMetrics(prediction, truth, config);

			// Syntax metrics count prediction-only tokens (9 colors)
			expect(result.colorValidCount).toBe(9);
			expect(result.colorTotalCount).toBe(9);
			expect(result.colorSyntaxValidityRatio).toBe(1);
			expect(result.fontSizeValidCount).toBe(0);
			expect(result.fontSizeTotalCount).toBe(0);
			expect(result.fontSizeSyntaxValidityRatio).toBe(1);

			// Color and font-size metrics should not be computed
			expect(result.deltaEPerColor).toEqual({});
			expect(result.fontSizeRelativeErrorPerKey).toEqual({});
			expect(result.deltaEScoreMean).toBeNull();
			expect(result.fontSizeRelativeErrorMean).toBeNull();
		});

		it("should handle invalid CSS values", () => {
			const prediction: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#6442d6",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "not-a-valid-css-value!!", // Invalid CSS value
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const truth: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: "#6442d6",
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const config: MetricsConfig = {
				computeColors: false,
				computeFontSizes: false,
				computeSyntax: true,
			};

			const result = computeMetrics(prediction, truth, config);

			// One invalid value in prediction (in color)
			expect(result.colorValidCount).toBeLessThan(result.colorTotalCount);
			expect(result.colorSyntaxValidityRatio).toBeLessThan(1);
		});

		it("should skip null values", () => {
			const data: TokenRecord = {
				color: {
					background: "#FEFBFF",
					surface: "#F8F1F6",
					text: "#1c1b1d",
					muted: "#4d4256",
					primary: null,
					primaryVariant: null,
					border: "#E8E0E8",
					danger: "#ff6240",
					dangerVariant: null,
					link: "#6442D6",
					linkVariant: null,
					ring: "#DCDAF5",
				},
				fontSize: {},
			};

			const config: MetricsConfig = {
				computeColors: false,
				computeFontSizes: false,
				computeSyntax: true,
			};

			const result = computeMetrics(data, data, config);

			// Should count all non-null color values from prediction (8 total, null skipped)
			expect(result.colorTotalCount).toBe(8);
			expect(result.colorSyntaxValidityRatio).toBe(1);
		});
	});
});
