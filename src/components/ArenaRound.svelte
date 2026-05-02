<script lang="ts">
  import {
    IconArrowDownSquare,
    IconArrowLeftSquare,
    IconArrowRightSquare,
    IconArrowUpSquare,
    IconQuestionMark,
  } from "@tabler/icons-svelte-runes";
  import type { Component } from "svelte";
  import type { Vote } from "../lib/frontend/arenaTypes";
  import { paletteToStyle } from "../lib/paletteToStyle";
  import type { ColorPalette } from "../lib/types";
  import Button from "./Button.svelte";

  interface Props {
    currentStep: number;
    dataName: string;
    leftData: { method: string; palette: ColorPalette };
    rightData: { method: string; palette: ColorPalette };
    currentWidget: { name: string; component: Component<object> };
    backgroundUrl: string;
    reveal: boolean;
    leftDeltaEScore: number | null;
    rightDeltaEScore: number | null;
    onVote: (vote: Vote) => void | Promise<void>;
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
    onVote,
    onNextRound,
    onReset,
  }: Props = $props();

  const baseUrl = import.meta.env.BASE_URL || "/";

  let processingVote = $state<Vote | null>(null);

  async function handleVote(vote: Vote) {
    processingVote = vote;
    try {
      await onVote(vote);
    } finally {
      processingVote = null;
    }
  }

  let leftStyle = $derived(paletteToStyle(leftData.palette));
  let rightStyle = $derived(paletteToStyle(rightData.palette));
  let Widget = $derived(currentWidget.component);

  function formatDeltaE(
    score: number | null | undefined,
    method: string,
  ): string {
    if (method === "Manual") return "(baseline)";
    if (score == null) return "No colors extracted.";
    return `ΔE score: ${score.toFixed(1)}`;
  }
</script>

<main class="md:p-4">
  <div class="p-4 md:p-0 flex items-center justify-between md:pb-4">
    <h2 class="text-2xl font-bold">Round {currentStep}/10 - {dataName}</h2>
    <Button variant="ghost" size="sm" onclick={onReset}>End Arena</Button>
  </div>
  <div
    class="widget-pair min-h-[calc(100vh-8rem)] relative flex flex-col md:grid md:grid-cols-2 md:grid-rows-[1fr_auto] pb-4 rounded overflow-hidden border border-gray-300 after:content-[''] after:bg-black/10 after:absolute after:inset-0 after:pointer-events-none"
    style="background-image: url({baseUrl}{backgroundUrl}); background-size: cover; background-position: top;"
  >
    <div
      class="z-10 flex-1 flex flex-col items-center justify-center m-4 md:m-8 order-1 gap-8"
    >
      <div class="rounded-lg drop-shadow min-w-80">
        <Widget style={leftStyle} />
      </div>
      {#if reveal}
        <div class="bg-white rounded p-2 drop-shadow text-center">
          <p>Method used: {leftData.method}</p>
          {#if formatDeltaE(leftDeltaEScore, leftData.method)}
            <p class="text-sm text-gray-600">
              {formatDeltaE(leftDeltaEScore, leftData.method)}
            </p>
          {/if}
        </div>
      {/if}
    </div>
    <div
      class="z-10 flex-1 flex flex-col items-center justify-center m-4 md:m-8 order-3 md:order-2 gap-8"
    >
      <div class="rounded-lg drop-shadow min-w-80">
        <Widget style={rightStyle} />
      </div>
      {#if reveal}
        <div class="bg-white rounded p-2 drop-shadow text-center">
          <p>Method used: {rightData.method}</p>
          {#if formatDeltaE(rightDeltaEScore, rightData.method)}
            <p class="text-sm text-gray-600">
              {formatDeltaE(rightDeltaEScore, rightData.method)}
            </p>
          {/if}
        </div>
      {/if}
    </div>

    {#if reveal}
      <div
        class="z-10 flex items-center justify-center w-full order-3 md:order-2 md:col-span-2 px-4"
      >
        <Button class="w-fit" onclick={onNextRound}>Next Round</Button>
      </div>
    {:else}
      <div
        class="z-10 flex items-center justify-around w-full order-2 md:order-3 md:col-span-2 gap-4 px-4"
      >
        <Button
          variant="primary"
          class="hidden md:inline-flex"
          onclick={() => handleVote("left")}
          loading={processingVote === "left"}
          disabled={processingVote !== null}
          icon={IconArrowLeftSquare}
          iconPosition="left"
        >
          Vote Left
        </Button>
        <Button
          variant="primary"
          class="inline-flex md:hidden"
          onclick={() => handleVote("left")}
          loading={processingVote === "left"}
          disabled={processingVote !== null}
          icon={IconArrowUpSquare}
          iconPosition="left"
        >
          Vote Top
        </Button>
        <Button
          variant="primary"
          onclick={() => handleVote("draw")}
          loading={processingVote === "draw"}
          disabled={processingVote !== null}
          icon={IconQuestionMark}
          iconPosition="left"
        >
          Vote Draw
        </Button>
        <Button
          variant="primary"
          class="hidden md:inline-flex"
          onclick={() => handleVote("right")}
          loading={processingVote === "right"}
          disabled={processingVote !== null}
          icon={IconArrowRightSquare}
          iconPosition="right"
        >
          Vote Right
        </Button>
        <Button
          variant="primary"
          class="inline-flex md:hidden"
          onclick={() => handleVote("right")}
          loading={processingVote === "right"}
          disabled={processingVote !== null}
          icon={IconArrowDownSquare}
          iconPosition="right"
        >
          Vote Bottom
        </Button>
      </div>
    {/if}
  </div>
</main>
