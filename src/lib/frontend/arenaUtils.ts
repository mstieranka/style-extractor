import type { MethodRank, RoundResult } from "./arenaTypes";

export function normalizeMethod(method: string): string {
  return method.replace(/ \(variation #\d+\)$/, "");
}

export function computeMethodRanking(rounds: RoundResult[]): MethodRank[] {
  const stats = new Map<string, { wins: number; appearances: number }>();
  for (const round of rounds) {
    const left = normalizeMethod(round.leftMethod);
    const right = normalizeMethod(round.rightMethod);
    const winner = round.votedSide === "left" ? left : right;

    if (!stats.has(left)) stats.set(left, { wins: 0, appearances: 0 });
    if (!stats.has(right)) stats.set(right, { wins: 0, appearances: 0 });

    stats.get(left)!.appearances++;
    stats.get(right)!.appearances++;
    stats.get(winner)!.wins++;
  }

  return [...stats.entries()]
    .map(([method, { wins, appearances }]) => ({
      method,
      wins,
      appearances,
      winRate: appearances > 0 ? wins / appearances : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
}
