import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	computeMetrics,
	type MetricsConfig,
	type TokenRecord,
} from "../packages/shared/src/compareTokens";

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
 * Test case configuration matching the integration test structure.
 */
interface TestCase {
	name: string;
	jsonFile: string;
}

const TEST_CASES: TestCase[] = [
	{
		name: "Material Design",
		jsonFile: "01-material.json",
	},
	{
		name: "M365",
		jsonFile: "02-m365.json",
	},
	{
		name: "Carbon Design",
		jsonFile: "03-carbon.json",
	},
	{
		name: "Zed",
		jsonFile: "04-zed.json",
	},
	{
		name: "Recombee",
		jsonFile: "05-recombee.json",
	},
	{
		name: "Stripe",
		jsonFile: "06-stripe.json",
	},
	{
		name: "React.dev",
		jsonFile: "07-react.json",
	},
	{
		name: "Old.reddit.com",
		jsonFile: "08-reddit.json",
	},
	{
		name: "The Guardian",
		jsonFile: "09-guardian.json",
	},
	{
		name: "Hacker News",
		jsonFile: "10-hackernews.json",
	},
];

/**
 * LLM models to evaluate. Only active models are uncommented.
 */
const MODELS = [
	"gpt-5-nano",
	"gemma-3-12b-it",
	// "gpt-oss-20b",
	// "phi-3-mini-4k",
	// "qwen-2.5-7b-instruct",
];

/**
 * Per-test-case metrics for display.
 */
interface TestCaseMetrics {
	name: string;
	meanDeltaEScore: number | null;
	minDeltaEScore: number | null;
	expectedFields: number;
	presentFields: number;
	preciseFields: number;
	veryPreciseFields: number;
	totalRuns: number;
	oomRuns: number;
	validRuns: number;
}

/**
 * Suite-level aggregate metrics for a model.
 */
interface SuiteMetrics {
	perCaseMeanDeltaEScore: number[];
	perCaseMinDeltaEScore: number[];
	totalExpectedFields: number;
	totalPresentFields: number;
	totalPreciseFields: number;
	totalVeryPreciseFields: number;
	totalOomRuns: number;
	totalValidRuns: number;
	totalRuns: number;
}

/**
 * A single parsed run result: either a valid TokenRecord or "oom".
 */
type RunResult = { kind: "valid"; record: TokenRecord } | { kind: "oom" };

/**
 * Load a JSON prediction file.
 * Returns an array of RunResult entries.
 * - If the file contains a plain object, returns a single-element array.
 * - If the file contains an array, each element is either a result object or "oom".
 */
function loadPredictionRuns(filePath: string): RunResult[] {
	const content = readFileSync(filePath, "utf-8");
	const data = JSON.parse(content);

	const toRunResult = (entry: unknown): RunResult => {
		if (entry === "oom") {
			return { kind: "oom" };
		}
		const obj = entry as Record<string, unknown>;
		return {
			kind: "valid",
			record: {
				color:
					(obj.color as TokenRecord["color"]) || ({} as TokenRecord["color"]),
				fontSize:
					(obj.fontSize as TokenRecord["fontSize"]) ||
					({} as TokenRecord["fontSize"]),
			},
		};
	};

	if (Array.isArray(data)) {
		return data.map(toRunResult);
	}
	return [toRunResult(data)];
}

/**
 * Load JSON file and return as TokenRecord (for manual/expected files).
 */
function loadTokenRecord(filePath: string): TokenRecord {
	const content = readFileSync(filePath, "utf-8");
	const data = JSON.parse(content);

	return {
		color: data.color || {},
		fontSize: data.fontSize || {},
	};
}

/**
 * Evaluate a single model against all test cases.
 */
function evaluateModel(modelName: string): {
	testCaseMetrics: TestCaseMetrics[];
	suiteMetrics: SuiteMetrics;
} {
	const testCaseMetrics: TestCaseMetrics[] = [];
	const suiteMetrics: SuiteMetrics = {
		perCaseMeanDeltaEScore: [],
		perCaseMinDeltaEScore: [],
		totalExpectedFields: 0,
		totalPresentFields: 0,
		totalPreciseFields: 0,
		totalVeryPreciseFields: 0,
		totalOomRuns: 0,
		totalValidRuns: 0,
		totalRuns: 0,
	};

	for (const testCase of TEST_CASES) {
		// Load prediction runs from LLM model
		const predictionPath = resolve(
			`data/llm/${modelName}/${testCase.jsonFile}`,
		);
		if (!existsSync(predictionPath)) {
			console.warn(`Warning: ${predictionPath} not found, skipping.`);
			continue;
		}
		const runs = loadPredictionRuns(predictionPath);

		// Load expected from manual reference
		const expectedPath = resolve(`data/manual/${testCase.jsonFile}`);
		if (!existsSync(expectedPath)) {
			console.warn(`Warning: ${expectedPath} not found, skipping.`);
			continue;
		}
		const expected = loadTokenRecord(expectedPath);

		const totalRuns = runs.length;
		const oomRuns = runs.filter((r) => r.kind === "oom").length;
		const validRuns = runs.filter((r) => r.kind === "valid");
		const validRunCount = validRuns.length;

		suiteMetrics.totalRuns += totalRuns;
		suiteMetrics.totalOomRuns += oomRuns;
		suiteMetrics.totalValidRuns += validRunCount;

		// If all runs are OOM, record the test case with null metrics
		if (validRunCount === 0) {
			testCaseMetrics.push({
				name: testCase.name,
				meanDeltaEScore: null,
				minDeltaEScore: null,
				expectedFields: Object.values(expected.color).filter((v) => v !== null)
					.length,
				presentFields: 0,
				preciseFields: 0,
				veryPreciseFields: 0,
				totalRuns,
				oomRuns,
				validRuns: 0,
			});
			continue;
		}

		// Compute metrics for each valid run, then average
		const metricsConfig: MetricsConfig = {
			computeColors: true,
			computeFontSizes: false,
			computeSyntax: false,
		};

		const perRunMeanDeltaE: number[] = [];
		const perRunMinDeltaE: number[] = [];
		const perRunExpectedFields: number[] = [];
		const perRunPresentFields: number[] = [];
		const perRunPreciseFields: number[] = [];
		const perRunVeryPreciseFields: number[] = [];

		for (const run of validRuns) {
			const prediction = run.record;
			const metrics = computeMetrics(prediction, expected, metricsConfig);

			if (metrics.deltaEScoreMean !== null) {
				perRunMeanDeltaE.push(metrics.deltaEScoreMean);
			}
			if (metrics.deltaEScoreMin !== null) {
				perRunMinDeltaE.push(metrics.deltaEScoreMin);
			}

			let expectedFields = 0;
			let presentFields = 0;
			let preciseFields = 0;
			let veryPreciseFields = 0;

			for (const key of Object.keys(expected.color)) {
				const colorKey = key as keyof typeof expected.color;
				const expectedValue = expected.color[colorKey];
				const predictedValue = prediction.color[colorKey];

				if (expectedValue !== null) {
					expectedFields++;

					if (predictedValue !== null) {
						presentFields++;

						const deltaE = metrics.deltaEPerColor[colorKey];
						if (deltaE !== null && deltaE < PRECISE_DELTA_E_THRESHOLD) {
							preciseFields++;
						}
						if (deltaE !== null && deltaE < VERY_PRECISE_DELTA_E_THRESHOLD) {
							veryPreciseFields++;
						}
					}
				}
			}

			perRunExpectedFields.push(expectedFields);
			perRunPresentFields.push(presentFields);
			perRunPreciseFields.push(preciseFields);
			perRunVeryPreciseFields.push(veryPreciseFields);
		}

		const avg = (arr: number[]) =>
			arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

		const avgMeanDeltaE = avg(perRunMeanDeltaE);
		const avgMinDeltaE = avg(perRunMinDeltaE);
		const avgExpectedFields = avg(perRunExpectedFields) ?? 0;
		const avgPresentFields = avg(perRunPresentFields) ?? 0;
		const avgPreciseFields = avg(perRunPreciseFields) ?? 0;
		const avgVeryPreciseFields = avg(perRunVeryPreciseFields) ?? 0;

		// Track suite-level metrics (using averaged values)
		if (avgMeanDeltaE !== null) {
			suiteMetrics.perCaseMeanDeltaEScore.push(avgMeanDeltaE);
		}
		if (avgMinDeltaE !== null) {
			suiteMetrics.perCaseMinDeltaEScore.push(avgMinDeltaE);
		}

		suiteMetrics.totalExpectedFields += avgExpectedFields;
		suiteMetrics.totalPresentFields += avgPresentFields;
		suiteMetrics.totalPreciseFields += avgPreciseFields;
		suiteMetrics.totalVeryPreciseFields += avgVeryPreciseFields;

		testCaseMetrics.push({
			name: testCase.name,
			meanDeltaEScore: avgMeanDeltaE,
			minDeltaEScore: avgMinDeltaE,
			expectedFields: avgExpectedFields,
			presentFields: avgPresentFields,
			preciseFields: avgPreciseFields,
			veryPreciseFields: avgVeryPreciseFields,
			totalRuns,
			oomRuns,
			validRuns: validRunCount,
		});
	}

	return { testCaseMetrics, suiteMetrics };
}

/**
 * Main function to compare all LLM model results.
 */
function main() {
	console.log(`\n${"=".repeat(80)}`);
	console.log("LLM MODEL EVALUATION - Color Palette Extraction");
	console.log("=".repeat(80));

	for (const modelName of MODELS) {
		console.log(`\n${"─".repeat(80)}`);
		console.log(`Model: ${modelName}`);
		console.log("─".repeat(80));

		const { testCaseMetrics, suiteMetrics } = evaluateModel(modelName);

		// Display per-test-case results
		console.log("\nPer-Test-Case Metrics:");
		const tableData = testCaseMetrics.map((tc) => {
			const runsInfo =
				tc.totalRuns > 1
					? ` (${tc.validRuns}/${tc.totalRuns} runs${tc.oomRuns > 0 ? `, ${tc.oomRuns} OOM` : ""})`
					: "";
			const pct = (n: number) =>
				tc.expectedFields > 0
					? `${((n / tc.expectedFields) * 100).toFixed(1)}%`
					: "N/A";
			return {
				"Test Case": tc.name + runsInfo,
				"Mean ΔE Score":
					tc.meanDeltaEScore !== null ? tc.meanDeltaEScore.toFixed(2) : "N/A",
				"Min ΔE Score":
					tc.minDeltaEScore !== null ? tc.minDeltaEScore.toFixed(2) : "N/A",
				Present: `${pct(tc.presentFields)} (${tc.presentFields.toFixed(1)}/${tc.expectedFields.toFixed(1)})`,
				"Precise (<5)": `${pct(tc.preciseFields)} (${tc.preciseFields.toFixed(1)}/${tc.expectedFields.toFixed(1)})`,
				"Very Precise (<3)": `${pct(tc.veryPreciseFields)} (${tc.veryPreciseFields.toFixed(1)}/${tc.expectedFields.toFixed(1)})`,
			};
		});
		console.table(tableData);

		// Calculate and display suite-level aggregate metrics
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

		console.log("\nAggregate Metrics:");
		const summaryData = [
			{
				Metric: "Mean ΔE Score (avg of per-case means)",
				Value:
					suiteMeanDeltaEScore !== null
						? suiteMeanDeltaEScore.toFixed(2)
						: "N/A",
			},
			{
				Metric: "Min ΔE Score (across all cases)",
				Value:
					suiteMinDeltaEScore !== null ? suiteMinDeltaEScore.toFixed(2) : "N/A",
			},
			{
				Metric: "Successful Extraction %",
				Value:
					successfulExtractionPercentage !== null
						? `${successfulExtractionPercentage.toFixed(2)}% (${suiteMetrics.totalPresentFields.toFixed(1)}/${suiteMetrics.totalExpectedFields.toFixed(1)})`
						: "N/A",
			},
			{
				Metric: `Precise Extraction % (ΔE < ${PRECISE_DELTA_E_THRESHOLD})`,
				Value:
					preciseExtractionPercentage !== null
						? `${preciseExtractionPercentage.toFixed(2)}% (${suiteMetrics.totalPreciseFields.toFixed(1)}/${suiteMetrics.totalExpectedFields.toFixed(1)})`
						: "N/A",
			},
			{
				Metric: `Very Precise Extraction % (ΔE < ${VERY_PRECISE_DELTA_E_THRESHOLD})`,
				Value:
					veryPreciseExtractionPercentage !== null
						? `${veryPreciseExtractionPercentage.toFixed(2)}% (${suiteMetrics.totalVeryPreciseFields.toFixed(1)}/${suiteMetrics.totalExpectedFields.toFixed(1)})`
						: "N/A",
			},
			{
				Metric: "OOM Runs",
				Value: `${suiteMetrics.totalOomRuns}/${suiteMetrics.totalRuns} total runs`,
			},
		];
		console.table(summaryData);
	}

	console.log(`\n${"=".repeat(80)}\n`);
}

main();
