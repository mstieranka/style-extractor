<script lang="ts">
  import type { Component } from "svelte";
  import type { ColorPalette } from "../lib/types";
  import {
    IconArrowLeftSquare,
    IconArrowRightSquare,
  } from "@tabler/icons-svelte-runes";
  import Button from "./Button.svelte";

  interface SideData {
    palette: ColorPalette;
    method: string;
  }

  interface WidgetPairProps {
    backgroundUrl: string;
    widget: Component<{}>;
    leftData: SideData;
    rightData: SideData;
    onVoteLeft: () => void;
    onVoteRight: () => void;
    reveal?: boolean;
    leftDeltaEScore?: number | null;
    rightDeltaEScore?: number | null;
    votedSide?: "left" | "right" | null;
  }

  let {
    backgroundUrl,
    widget: Widget,
    leftData,
    rightData,
    onVoteLeft,
    onVoteRight,
    reveal,
    leftDeltaEScore,
    rightDeltaEScore,
    votedSide,
  }: WidgetPairProps = $props();

  function paletteToStyle(palette: ColorPalette) {
    return Object.entries(palette)
      .map(([key, color]) => `--color-${camelToKebab(key)}: ${color}`)
      .join("; ");
  }

  let leftStyle = $derived.by(() => paletteToStyle(leftData.palette));
  let rightStyle = $derived.by(() => paletteToStyle(rightData.palette));

  function camelToKebab(str: string) {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  }
  function formatDeltaE(
    score: number | null | undefined,
    method: string,
  ): string {
    if (method === "Manual") return "(baseline)";
    if (score == null) return "No colors extracted.";
    return `ΔE score: ${score.toFixed(1)}`;
  }

  let alignmentText = $derived.by(() => {
    if (!votedSide || leftDeltaEScore == null || rightDeltaEScore == null)
      return null;
    if (leftDeltaEScore === rightDeltaEScore) return null;
    const betterSide = leftDeltaEScore > rightDeltaEScore ? "left" : "right";
    return votedSide === betterSide
      ? "You picked the more accurate palette"
      : "You picked the less accurate palette";
  });
</script>

<div
  class="widget-pair md:h-[calc(100vh-192px)] relative grid grid-cols-1 md:grid-cols-2 items-center justify-items-center pb-4 rounded overflow-hidden border border-gray-300 after:content-[''] after:bg-black/10 after:absolute after:inset-0 after:pointer-events-none"
  style="background-image: url({backgroundUrl}); background-size: cover; background-position: top; grid-template-rows: 1fr auto;"
>
  <div class="z-10 m-4 rounded-lg drop-shadow min-w-80 order-1 md:order-1">
    <Widget style={leftStyle} />
  </div>
  <div class="z-10 m-4 rounded-lg drop-shadow min-w-80 order-3 md:order-2">
    <Widget style={rightStyle} />
  </div>

  {#if reveal}
    <div
      class="mb-12 md:mb-0 z-10 bg-white rounded w-max p-2 drop-shadow text-center order-2 md:order-3"
    >
      <p>Method used: {leftData.method}</p>
      {#if formatDeltaE(leftDeltaEScore, leftData.method)}
        <p class="text-sm text-gray-600">
          {formatDeltaE(leftDeltaEScore, leftData.method)}
        </p>
      {/if}
    </div>
    <div
      class="mb-12 md:mb-0 z-10 bg-white rounded w-max p-2 drop-shadow text-center order-4 md:order-4"
    >
      <p>Method used: {rightData.method}</p>
      {#if formatDeltaE(rightDeltaEScore, rightData.method)}
        <p class="text-sm text-gray-600">
          {formatDeltaE(rightDeltaEScore, rightData.method)}
        </p>
      {/if}
    </div>
    {#if alignmentText}
      <p
        class="order-5 z-10 md:col-span-2 text-center bg-white/90 rounded px-3 py-1 mt-2 drop-shadow text-sm font-medium"
      >
        {alignmentText}
      </p>
    {/if}
  {:else}
    <div
      class="z-10 flex items-center justify-center order-2 md:order-3 mb-12 md:mb-0"
    >
      <Button
        variant="primary"
        onclick={() => onVoteLeft()}
        icon={IconArrowLeftSquare}
        iconPosition="left"
      >
        Vote Left
      </Button>
    </div>
    <div class="z-10 flex items-center justify-center order-4 md:order-4">
      <Button
        variant="primary"
        onclick={() => onVoteRight()}
        icon={IconArrowRightSquare}
        iconPosition="right"
      >
        Vote Right
      </Button>
    </div>
  {/if}
</div>
