import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
	computeMetrics,
	type MetricsConfig,
	type TokenRecord,
	MAX_RESULTS,
	type ColorPaletteOptions,
} from "@style-extractor/shared";
import { extractPalette } from "./index";

/**
 * ΔE threshold for "precise" extraction - colors within this threshold
 * are considered accurate matches.
 */
const PRECISE_DELTA_E_THRESHOLD = 5;

/**
 * ΔE threshold for "very precise" extraction - colors within this threshold
 * are considered very accurate matches.
 */
const VERY_PRECISE_DELTA_E_THRESHOLD = 3;

/**
 * Test case configuration for palette extraction integration tests.
 * Add new test cases to this array as JSON reference files become available.
 */
interface TestCase {
	name: string;
	cssFile: string;
	jsonFile: string;
	deltaEScoreThreshold: number; // Min acceptable ΔE score (100 - ΔE, clamped [0,100]) between predicted and expected colors
}

const DATA_ROOT = "../../data/manual";

const TEST_CASES: TestCase[] = [
	{
		name: "Material Design",
		cssFile: `${DATA_ROOT}/01-material.css`,
		jsonFile: `${DATA_ROOT}/01-material.json`,
		deltaEScoreThreshold: 90, // Accepting small but noticeable differences
	},
	{
		name: "M365",
		cssFile: `${DATA_ROOT}/02-m365.css`,
		jsonFile: `${DATA_ROOT}/02-m365.json`,
		deltaEScoreThreshold: 90,
	},
	{
		name: "Carbon Design",
		cssFile: `${DATA_ROOT}/03-carbon.css`,
		jsonFile: `${DATA_ROOT}/03-carbon.json`,
		deltaEScoreThreshold: 90,
	},
	{
		name: "Zed",
		cssFile: `${DATA_ROOT}/04-zed.css`,
		jsonFile: `${DATA_ROOT}/04-zed.json`,
		deltaEScoreThreshold: 90,
	},
	{
		name: "Recombee",
		cssFile: `${DATA_ROOT}/05-recombee.css`,
		jsonFile: `${DATA_ROOT}/05-recombee.json`,
		deltaEScoreThreshold: 90,
	},
	{
		name: "Stripe",
		cssFile: `${DATA_ROOT}/06-stripe.css`,
		jsonFile: `${DATA_ROOT}/06-stripe.json`,
		deltaEScoreThreshold: 90, // More variance expected due to gradients
	},
	{
		name: "React.dev",
		cssFile: `${DATA_ROOT}/07-react.css`,
		jsonFile: `${DATA_ROOT}/07-react.json`,
		deltaEScoreThreshold: 90,
	},
	{
		name: "Old.reddit.com",
		cssFile: `${DATA_ROOT}/08-reddit.css`,
		jsonFile: `${DATA_ROOT}/08-reddit.json`,
		deltaEScoreThreshold: 90,
	},
	{
		name: "The Guardian",
		cssFile: `${DATA_ROOT}/09-guardian.css`,
		jsonFile: `${DATA_ROOT}/09-guardian.json`,
		deltaEScoreThreshold: 85, // More variance expected due to complex theming
	},
	{
		name: "Hacker News",
		cssFile: `${DATA_ROOT}/10-hackernews.css`,
		jsonFile: `${DATA_ROOT}/10-hackernews.json`,
		deltaEScoreThreshold: 80, // High variance expected due to styling outside of CSS
	},
];

/**
 * Convert ColorPaletteOptions to a flat record for compareTokens.
 * Takes the first (best-scoring) color from each category.
 */
function paletteOptionsToPrediction(palette: ColorPaletteOptions): TokenRecord {
	return {
		color: {
			background: palette.background?.[0] ?? null,
			surface: palette.surface?.[0] ?? null,
			text: palette.text?.[0] ?? null,
			muted: palette.muted?.[0] ?? null,
			primary: palette.primary?.[0] ?? null,
			primaryVariant: palette.primaryVariant?.[0] ?? null,
			border: palette.border?.[0] ?? null,
			danger: palette.danger?.[0] ?? null,
			dangerVariant: palette.dangerVariant?.[0] ?? null,
			link: palette.link?.[0] ?? null,
			linkVariant: palette.linkVariant?.[0] ?? null,
			ring: palette.ring?.[0] ?? null,
		},
		fontSize: {},
	};
}

/**
 * Suite-level accumulators for aggregate metrics across all test cases
 */
const suiteMetrics = {
	perCaseMeanDeltaEScore: [] as number[],
	perCaseMinDeltaEScore: [] as number[],
	totalExpectedFields: 0,
	totalPresentFields: 0,
	totalPreciseFields: 0,
	totalVeryPreciseFields: 0,
};

describe("extractPalette Integration Tests", () => {
	TEST_CASES.forEach((testCase) => {
		describe(testCase.name, () => {
			it(`should extract palette from ${testCase.cssFile} matching ${testCase.jsonFile}`, () => {
				// 1. Read CSS file
				const cssPath = resolve(testCase.cssFile);
				const cssContent = readFileSync(cssPath, "utf-8");

				// 2. Extract palette
				const extracted = extractPalette(cssContent);

				// 3. Load expected palette from JSON
				const jsonPath = resolve(testCase.jsonFile);
				const jsonContent = JSON.parse(readFileSync(jsonPath, "utf-8"));

				// 4. Convert extracted palette to prediction format
				const prediction = paletteOptionsToPrediction(extracted);

				const expected = jsonContent as TokenRecord;

				// 6. Compute metrics
				const metricsConfig: MetricsConfig = {
					computeColors: true,
					computeFontSizes: false,
					computeSyntax: false,
				};

				const metrics = computeMetrics(prediction, expected, metricsConfig);

				// 6. Track suite-level metrics
				if (metrics.deltaEScoreMean !== null) {
					suiteMetrics.perCaseMeanDeltaEScore.push(metrics.deltaEScoreMean);
				}
				if (metrics.deltaEScoreMin !== null) {
					suiteMetrics.perCaseMinDeltaEScore.push(metrics.deltaEScoreMin);
				}

				// Count expected, present, and precise fields
				for (const key of Object.keys(expected.color)) {
					const colorKey = key as keyof typeof expected.color;
					const expectedValue = expected.color[colorKey];
					const predictedValue = prediction.color[colorKey];

					if (expectedValue !== null) {
						suiteMetrics.totalExpectedFields++;

						if (predictedValue !== null) {
							suiteMetrics.totalPresentFields++;

							// Check if this field is precise (ΔE < threshold)
							const deltaE = metrics.deltaEPerColor[colorKey];
							if (deltaE !== null && deltaE < PRECISE_DELTA_E_THRESHOLD) {
								suiteMetrics.totalPreciseFields++;
							}
							if (deltaE !== null && deltaE < VERY_PRECISE_DELTA_E_THRESHOLD) {
								suiteMetrics.totalVeryPreciseFields++;
							}
						}
					}
				}

				// 7. Assert all palette categories were extracted
				for (const expectedKey of Object.keys(expected.color)) {
					// 7a. Check that extracted has the same keys as expected
					if (
						expected.color[expectedKey as keyof typeof expected.color] !== null
					) {
						const extractedColors =
							extracted[expectedKey as keyof typeof extracted];
						expect(
							extractedColors?.length ?? -1,
							`${expectedKey} colors extracted`,
						).toBeGreaterThan(0);
					}
				}

				// 7b. Assert arrays are trimmed to MAX_RESULTS and only contain values with score > MIN_SCORE
				const assertArrayConstraints = (arr: string[] | null, name: string) => {
					if (arr) {
						try {
							expect(arr.length).toBeLessThanOrEqual(MAX_RESULTS);
						} catch (_err) {
							throw new Error(
								`${name} array has more than ${MAX_RESULTS} results: ${arr.length}`,
							);
						}
						// Note: MIN_SCORE filtering happens during collection; scores > MIN_SCORE are included
					}
				};
				assertArrayConstraints(extracted.background, "background");
				assertArrayConstraints(extracted.surface, "surface");
				assertArrayConstraints(extracted.text, "text");
				assertArrayConstraints(extracted.muted, "muted");
				assertArrayConstraints(extracted.primary, "primary");
				assertArrayConstraints(extracted.border, "border");
				assertArrayConstraints(extracted.danger, "danger");
				assertArrayConstraints(extracted.link, "link");
				assertArrayConstraints(extracted.ring, "ring");

				// Log detailed results for inspection
				console.log(`\n${testCase.name} - Detailed Results:`);
				console.log("Extracted:", JSON.stringify(prediction, null, 2));
				console.log("Expected:", JSON.stringify(expected, null, 2));
				console.log(
					"ΔE per color:",
					JSON.stringify(metrics.deltaEPerColor, null, 2),
				);
				console.log(`Mean ΔE Score: ${metrics.deltaEScoreMean?.toFixed(2)}`);
				console.log(`Min ΔE Score: ${metrics.deltaEScoreMin?.toFixed(2)}`);

				// Assert mean color score is above threshold
				if (metrics.deltaEScoreMean !== null) {
					expect(metrics.deltaEScoreMean).toBeGreaterThan(
						testCase.deltaEScoreThreshold,
					);
				}
			});
		});
	});

	afterAll(() => {
		// Compute suite-level aggregate metrics
		const suiteMeanDeltaEScore =
			suiteMetrics.perCaseMeanDeltaEScore.length > 0
				? suiteMetrics.perCaseMeanDeltaEScore.reduce((a, b) => a + b, 0) /
					suiteMetrics.perCaseMeanDeltaEScore.length
				: null;

		const suiteMinDeltaEScore =
			suiteMetrics.perCaseMinDeltaEScore.length > 0
				? Math.min(...suiteMetrics.perCaseMinDeltaEScore)
				: null;

		const successfulExtractionPercentage =
			suiteMetrics.totalExpectedFields > 0
				? (suiteMetrics.totalPresentFields / suiteMetrics.totalExpectedFields) *
					100
				: null;

		const preciseExtractionPercentage =
			suiteMetrics.totalExpectedFields > 0
				? (suiteMetrics.totalPreciseFields / suiteMetrics.totalExpectedFields) *
					100
				: null;

		const veryPreciseExtractionPercentage =
			suiteMetrics.totalExpectedFields > 0
				? (suiteMetrics.totalVeryPreciseFields /
						suiteMetrics.totalExpectedFields) *
					100
				: null;

		// Log suite-level metrics
		console.log(`\n${"=".repeat(60)}`);
		console.log("SUITE-LEVEL AGGREGATE METRICS");
		console.log("=".repeat(60));
		console.log(
			`Mean ΔE Score (average of per-case means): ${
				suiteMeanDeltaEScore !== null ? suiteMeanDeltaEScore.toFixed(2) : "N/A"
			}`,
		);
		console.log(
			`Min ΔE Score (across all cases): ${
				suiteMinDeltaEScore !== null ? suiteMinDeltaEScore.toFixed(2) : "N/A"
			}`,
		);
		console.log(
			`Successful Extraction: ${
				successfulExtractionPercentage !== null
					? successfulExtractionPercentage.toFixed(2)
					: "N/A"
			}% (${suiteMetrics.totalPresentFields}/${suiteMetrics.totalExpectedFields} fields)`,
		);
		console.log(
			`Precise Extraction (ΔE < ${PRECISE_DELTA_E_THRESHOLD}): ${
				preciseExtractionPercentage !== null
					? preciseExtractionPercentage.toFixed(2)
					: "N/A"
			}% (${suiteMetrics.totalPreciseFields}/${suiteMetrics.totalExpectedFields} fields)`,
		);
		console.log(
			`Very Precise Extraction (ΔE < ${VERY_PRECISE_DELTA_E_THRESHOLD}): ${
				veryPreciseExtractionPercentage !== null
					? veryPreciseExtractionPercentage.toFixed(2)
					: "N/A"
			}% (${suiteMetrics.totalVeryPreciseFields}/${suiteMetrics.totalExpectedFields} fields)`,
		);
		console.log(`${"=".repeat(60)}\n`);
	});
});
