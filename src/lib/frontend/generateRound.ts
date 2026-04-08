import { Random } from "random";
import { paletteData } from "../../paletteData";
import { widgets } from "../../components/widgets";
import type { RoundSelection } from "./arenaTypes";

export function generateRound(
  sessionId: string,
  roundNumber: number,
): RoundSelection {
  const rng = new Random(`${sessionId}_round_${roundNumber}`);

  const webData = rng.choice(paletteData)!;
  const [left, right] = rng.sample(webData.palettes, 2);
  const widget = rng.choice(widgets)!;

  const manualEntry = webData.palettes.find((p) => p.method === "Manual");

  return {
    dataName: webData.name,
    backgroundUrl: webData.backgroundUrl,
    manualPalette: manualEntry?.color,
    leftData: { method: left.method, palette: left.color },
    rightData: { method: right.method, palette: right.color },
    widget,
  };
}
