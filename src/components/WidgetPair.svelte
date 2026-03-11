<script lang="ts">
  import type { Component } from "svelte";
  import type { ColorPalette } from "../lib/types";
  import {
    IconArrowLeftSquare,
    IconArrowRightSquare,
  } from "@tabler/icons-svelte";

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
  }

  let {
    backgroundUrl,
    widget: Widget,
    leftData,
    rightData,
    onVoteLeft,
    onVoteRight,
    reveal,
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
</script>

<div
  class="widget-pair h-[calc(100vh-208px)] relative grid grid-cols-2 items-center justify-items-center pb-4 rounded overflow-hidden border border-gray-300 after:content-[''] after:bg-black/10 after:absolute after:inset-0 after:pointer-events-none"
  style="background-image: url({backgroundUrl}); background-size: cover; grid-template-rows: 1fr auto;"
>
  <div class="relative z-10 m-4 rounded-lg drop-shadow min-w-80">
    <Widget style={leftStyle} />
  </div>
  <div class="relative z-10 m-4 rounded-lg drop-shadow min-w-80">
    <Widget style={rightStyle} />
  </div>

  {#if reveal}
    <p class="relative z-10 bg-white rounded w-max p-2 drop-shadow">
      Method used: {leftData.method}
    </p>
    <p class="relative z-10 bg-white rounded w-max p-2 drop-shadow">
      Method used: {rightData.method}
    </p>
  {:else}
    <div class="relative z-10 flex items-center justify-center">
      <button
        class="bg-purple-500 text-white px-4 py-2 flex gap-2 rounded hover:bg-purple-600 transition-colors duration-150"
        onclick={() => onVoteLeft()}
      >
        <IconArrowLeftSquare /> Vote Left
      </button>
    </div>
    <div class="relative z-10 flex items-center justify-center">
      <button
        class="bg-purple-500 text-white px-4 py-2 flex gap-2 rounded hover:bg-purple-600 transition-colors duration-150"
        onclick={() => onVoteRight()}
      >
        Vote Right <IconArrowRightSquare />
      </button>
    </div>
  {/if}
</div>
