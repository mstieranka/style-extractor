<script lang="ts">
  import Button from "../components/Button.svelte";
  import { cleanCss } from "../lib/clean-css";

  let inputCss: string = $state("");
  let outputCss: string | null = $state(null);
  let error: string = $state("");

  function onClick() {
    try {
      error = "";
      outputCss = cleanCss(inputCss);
    } catch (e) {
      error = e instanceof Error ? e.message : "An error occurred";
      outputCss = null;
    }
  }
</script>

<svelte:head>
  <title>Cleaner | Style Extractor</title>
</svelte:head>

<main class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">CSS Cleaner</h1>
  <div class="flex flex-col gap-4">
    <label for="css-input">Paste your CSS here:</label>
    <textarea
      class="rounded bg-gray-50 text-xs border-gray-300 border p-2 w-full h-48 resize-y focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
      id="css-input"
      bind:value={inputCss}
      placeholder="Paste your CSS here..."
    ></textarea>
    <Button onclick={() => onClick()}>Clean CSS</Button>
    {#if error}
      <p class="text-red-600 mt-2">{error}</p>
    {/if}
    <p class="mt-4">Output:</p>
    <textarea
      class="rounded bg-gray-50 text-xs border-gray-300 border p-2 w-full h-48 resize-y focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent font-mono"
      id="css-output"
      value={outputCss}
      readonly
    ></textarea>
  </div>
</main>
