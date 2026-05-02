import type { MethodRank, RoundResult } from "./arenaTypes";

export function normalizeMethod(method: string): string {
	return method.replace(/ \(variation #\d+\)$/, "");
}

export function computeMethodRanking(rounds: RoundResult[]): MethodRank[] {
	const stats = new Map<string, { wins: number; appearances: number }>();
	for (const round of rounds) {
		const left = normalizeMethod(round.leftMethod);
		const right = normalizeMethod(round.rightMethod);
		if (round.vote === "draw") continue;
		const winner = round.vote === "left" ? left : right;

		if (!stats.has(left)) stats.set(left, { wins: 0, appearances: 0 });
		if (!stats.has(right)) stats.set(right, { wins: 0, appearances: 0 });

		const leftStats = stats.get(left);
		if (leftStats !== undefined) {
			leftStats.appearances++;
		}
		const rightStats = stats.get(right);
		if (rightStats !== undefined) {
			rightStats.appearances++;
		}
		const winnerStats = stats.get(winner);
		if (winnerStats !== undefined) {
			winnerStats.wins++;
		}
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
