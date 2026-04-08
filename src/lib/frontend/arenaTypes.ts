export interface RoundResult {
  dataName: string;
  leftMethod: string;
  rightMethod: string;
  leftDeltaEScore: number | null;
  rightDeltaEScore: number | null;
  votedSide: "left" | "right";
  alignedWithDeltaE: boolean | null;
}

export interface MethodRank {
  method: string;
  wins: number;
  appearances: number;
  winRate: number;
}

export interface PendingSession {
  sessionId: string;
  maxRound: number;
}