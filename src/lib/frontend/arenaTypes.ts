import type { Component } from "svelte";
import type { ColorPalette } from "../types";

export interface RoundSelection {
  dataName: string;
  backgroundUrl: string;
  manualPalette: ColorPalette | undefined;
  leftData: { method: string; palette: ColorPalette };
  rightData: { method: string; palette: ColorPalette };
  widget: { name: string; component: Component };
}

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
