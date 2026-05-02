import { Random } from "random";
import { widgets } from "../../components/widgets";
import { paletteData } from "../../paletteData";
import type { RoundSelection } from "./arenaTypes";

export function generateRound(
	sessionId: string,
	roundNumber: number,
): RoundSelection {
	const rng = new Random(`${sessionId}_round_${roundNumber}`);

	const webData = rng.choice(paletteData);
	if (!webData) {
		throw new Error("No palette data available");
	}
	const [left, right] = rng.sample(webData.palettes, 2);
	const widget = rng.choice(widgets);
	if (!widget) {
		throw new Error("No widgets available");
	}

	const manualEntry = webData.palettes.find((p) => p.method === "Manual");

	return {
		dataName: webData.name,
		manualPalette: manualEntry?.color,
		leftData: { method: left.method, palette: left.color },
		rightData: { method: right.method, palette: right.color },
		widget,
	};
}
