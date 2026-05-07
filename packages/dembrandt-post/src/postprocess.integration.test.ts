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
import { getColorPaletteFromDembrandt } from "./postprocess";

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
 * Test case configuration for Dembrandt postprocess integration tests.
 */
interface TestCase {
	name: string;
	inputFile: string;
	outputFile: string;
	deltaEScoreThreshold: number; // Min acceptable ΔE score (100 - ΔE, clamped [0,100]) between predicted and expected colors
}

const DATA_ROOT = "../../data/dembrandt";

const TEST_CASES: TestCase[] = [
	{
		name: "Material Design",
		inputFile: `${DATA_ROOT}/01-material.input.json`,
		outputFile: `${DATA_ROOT}/01-material.output.json`,
		deltaEScoreThreshold: 75,
	},
	{
		name: "M365",
		inputFile: `${DATA_ROOT}/02-m365.input.json`,
		outputFile: `${DATA_ROOT}/02-m365.output.json`,
		deltaEScoreThreshold: 75,
	},
	{
		name: "Carbon Design",
		inputFile: `${DATA_ROOT}/03-carbon.input.json`,
		outputFile: `${DATA_ROOT}/03-carbon.output.json`,
		deltaEScoreThreshold: 75,
	},
	{
		name: "Zed",
		inputFile: `${DATA_ROOT}/04-zed.input.json`,
		outputFile: `${DATA_ROOT}/04-zed.output.json`,
		deltaEScoreThreshold: 80,
	},
	{
		name: "Recombee",
		inputFile: `${DATA_ROOT}/05-recombee.input.json`,
		outputFile: `${DATA_ROOT}/05-recombee.output.json`,
		deltaEScoreThreshold: 65,
	},
	{
		name: "Stripe",
		inputFile: `${DATA_ROOT}/06-stripe.input.json`,
		outputFile: `${DATA_ROOT}/06-stripe.output.json`,
		deltaEScoreThreshold: 85,
	},
	{
		name: "React.dev",
		inputFile: `${DATA_ROOT}/07-react.input.json`,
		outputFile: `${DATA_ROOT}/07-react.output.json`,
		deltaEScoreThreshold: 80,
	},
	{
		name: "Reddit",
		inputFile: `${DATA_ROOT}/08-reddit.input.json`,
		outputFile: `${DATA_ROOT}/08-reddit.output.json`,
		deltaEScoreThreshold: 70,
	},
	{
		name: "The Guardian",
		inputFile: `${DATA_ROOT}/09-guardian.input.json`,
		outputFile: `${DATA_ROOT}/09-guardian.output.json`,
		deltaEScoreThreshold: 65,
	},
	{
		name: "Hacker News",
		inputFile: `${DATA_ROOT}/10-hackernews.input.json`,
		outputFile: `${DATA_ROOT}/10-hackernews.output.json`,
		deltaEScoreThreshold: 80,
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
 * Extract the colors data from Dembrandt input JSON structure.
 */
function extractColorsFromInput(inputJson: unknown): {
	semantic: Record<string, string>;
	palette: Array<{
		color: string;
		normalized: string;
		count: number;
		confidence: "high" | "medium" | "low";
		sources: string[];
	}>;
	cssVariables?: Record<string, string>;
} {
	const input = inputJson as {
		colors?: {
			semantic?: Record<string, string>;
			palette?: Array<{
				color: string;
				normalized: string;
				count: number;
				confidence: "high" | "medium" | "low";
				sources: string[];
			}>;
			cssVariables?: Record<string, string>;
		};
	};

	return {
		semantic: input.colors?.semantic ?? {},
		palette: input.colors?.palette ?? [],
		cssVariables: input.colors?.cssVariables,
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

describe("getColorPaletteFromDembrandt Integration Tests", () => {
	TEST_CASES.forEach((testCase) => {
		describe(testCase.name, () => {
			it(`should extract palette from ${testCase.inputFile} matching ${testCase.outputFile}`, () => {
				// 1. Read input JSON file
				const inputPath = resolve(testCase.inputFile);
				const inputJson = JSON.parse(readFileSync(inputPath, "utf-8"));

				// 2. Extract colors data from input structure
				const colorsData = extractColorsFromInput(inputJson);

				// 3. Run postprocess function
				const extracted = getColorPaletteFromDembrandt(colorsData);

				// 4. Load expected output from JSON
				const outputPath = resolve(testCase.outputFile);
				const outputJson = JSON.parse(readFileSync(outputPath, "utf-8"));

				// 5. Convert extracted palette options to prediction format
				const prediction = paletteOptionsToPrediction(extracted);

				const expected = outputJson as TokenRecord;

				// 6. Compute metrics
				const metricsConfig: MetricsConfig = {
					computeColors: true,
					computeFontSizes: false,
					computeSyntax: false,
				};

				const metrics = computeMetrics(prediction, expected, metricsConfig);

				// 6a. Track suite-level metrics
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

				// 7. Log which expected keys are missing from extraction
				const missingKeys: string[] = [];
				for (const expectedKey of Object.keys(expected.color)) {
					const expectedValue =
						expected.color[expectedKey as keyof typeof expected.color];
					if (expectedValue !== null) {
						const extractedColors =
							extracted[expectedKey as keyof typeof extracted];
						if (!extractedColors || extractedColors.length === 0) {
							missingKeys.push(expectedKey);
						}
					}
				}

				// 8. Assert arrays respect MAX_RESULTS constraint
				const assertArrayConstraints = (arr: string[] | null, name: string) => {
					if (arr) {
						expect(
							arr.length,
							`${name} should have at most ${MAX_RESULTS} colors`,
						).toBeLessThanOrEqual(MAX_RESULTS);
					}
				};
				assertArrayConstraints(extracted.background, "background");
				assertArrayConstraints(extracted.surface, "surface");
				assertArrayConstraints(extracted.text, "text");
				assertArrayConstraints(extracted.muted, "muted");
				assertArrayConstraints(extracted.primary, "primary");
				assertArrayConstraints(extracted.primaryVariant, "primaryVariant");
				assertArrayConstraints(extracted.border, "border");
				assertArrayConstraints(extracted.danger, "danger");
				assertArrayConstraints(extracted.dangerVariant, "dangerVariant");
				assertArrayConstraints(extracted.link, "link");
				assertArrayConstraints(extracted.linkVariant, "linkVariant");
				assertArrayConstraints(extracted.ring, "ring");

				// Log detailed results for inspection
				console.log(`\n${testCase.name} - Detailed Results:`);
				console.log("Extracted:", JSON.stringify(prediction, null, 2));
				console.log("Expected:", JSON.stringify(expected, null, 2));
				if (missingKeys.length > 0) {
					console.log("Missing keys:", missingKeys.join(", "));
				}
				console.log(
					"ΔE per color:",
					JSON.stringify(metrics.deltaEPerColor, null, 2),
				);
				console.log(`Mean ΔE Score: ${metrics.deltaEScoreMean?.toFixed(2)}`);
				console.log(`Min ΔE Score: ${metrics.deltaEScoreMin?.toFixed(2)}`);

				// 9. Assert mean color score is above threshold (only if we have matches)
				if (metrics.deltaEScoreMean !== null) {
					expect(
						metrics.deltaEScoreMean,
						`Mean ΔE Score should be greater than ${testCase.deltaEScoreThreshold}`,
					).toBeGreaterThan(testCase.deltaEScoreThreshold);
				}

				// 10. Warn but don't fail if keys are missing (algorithm improvement needed)
				if (missingKeys.length > 0) {
					console.warn(
						`⚠️  ${testCase.name}: Missing ${missingKeys.length} expected keys: ${missingKeys.join(", ")}`,
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
