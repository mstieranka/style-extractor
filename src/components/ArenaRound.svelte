<script lang="ts">
  import type { Component } from "svelte";
  import type { ColorPalette } from "../lib/types";
  import WidgetPair from "./WidgetPair.svelte";
  import Button from "./Button.svelte";

  interface Props {
    currentStep: number;
    dataName: string;
    leftData: { method: string; palette: ColorPalette };
    rightData: { method: string; palette: ColorPalette };
    currentWidget: { name: string; component: Component<{}> };
    backgroundUrl: string;
    reveal: boolean;
    leftDeltaEScore: number | null;
    rightDeltaEScore: number | null;
    votedSide: "left" | "right" | null;
    onVoteLeft: () => void | Promise<void>;
    onVoteRight: () => void | Promise<void>;
    onNextRound: () => void;
    onReset: () => void;
  }

  let {
    currentStep,
    dataName,
    leftData,
    rightData,
    currentWidget,
    backgroundUrl,
    reveal,
    leftDeltaEScore,
    rightDeltaEScore,
    votedSide,
    onVoteLeft,
    onVoteRight,
    onNextRound,
    onReset,
  }: Props = $props();
</script>

<main class="md:p-4">
  <div class="p-4 md:p-0 flex items-center justify-between md:pb-4">
    <h2 class="text-2xl font-bold">Round {currentStep}/10 - {dataName}</h2>
    <Button variant="ghost" size="sm" onclick={onReset}>End Arena</Button>
  </div>
  <WidgetPair
    widget={currentWidget.component}
    {backgroundUrl}
    {onVoteLeft}
    {onVoteRight}
    {leftData}
    {rightData}
    {reveal}
    {leftDeltaEScore}
    {rightDeltaEScore}
    {votedSide}
  />
  {#if reveal}
    <div class="flex justify-center">
      <Button class="mb-4 md:mb-0 mt-4" onclick={onNextRound}>
        Next Round
      </Button>
    </div>
  {/if}
</main>
