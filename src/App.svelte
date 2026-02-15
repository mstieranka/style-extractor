<script lang="ts">
  import Extractor from "./lib/Extractor.svelte";
  import Cleaner from "./lib/Cleaner.svelte";
</script>

<main class="container mx-auto p-4">
  <section>
    <h1 class="text-2xl font-bold mb-4">Style Extractor</h1>
    <Extractor />
  </section>
  <section>
    <h1 class="text-2xl font-bold mb-4 mt-8">CSS Cleaner</h1>
    <Cleaner />
  </section>
</main>
