<script lang="ts">
  import { extractPalette } from "@style-extractor/extractor";
  import type { ColorPaletteOptions } from "@style-extractor/shared";
  import Button from "../components/Button.svelte";

  let input: string = $state("");
  let output: string | null = $state(null);
  let palette: ColorPaletteOptions | null = $state(null);
  function onClick() {
    const result = extractPalette(input);
    output = JSON.stringify(result, null, 2);
    palette = result;
  }
</script>

<svelte:head>
  <title>Extractor | Style Extractor</title>
</svelte:head>

<main class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Style Extractor</h1>
  <div class="flex flex-col gap-4">
    <label for="input">Paste your CSS here:</label>
    <textarea
      class="rounded bg-gray-50 text-xs border-gray-300 border p-2 w-full h-48 resize-y focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
      id="input"
      bind:value={input}
      placeholder="Paste your CSS here..."
    ></textarea>
    <Button onclick={() => onClick()}>Extract Styles</Button>
    <p class="mt-4">Output:</p>
    <div>
      {#each Object.entries(palette || {}) as [key, color]}
        <div class="mb-4">
          <h2 class="font-semibold">{key}:</h2>
          <div class="flex flex-wrap gap-2 mt-2">
            {#each color as c}
              <div
                class="size-8 rounded border border-gray-300"
                style="background-color: {c};"
                title={c}
              ></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    <pre
      class="font-mono text-xs border border-gray-300 p-2 rounded min-h-32">{output}</pre>
  </div>
</main>
