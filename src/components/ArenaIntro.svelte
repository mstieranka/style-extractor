<script lang="ts">
  interface ArenaIntroProps {
    onStart: () => void;
  }

  let { onStart }: ArenaIntroProps = $props();
</script>

<h1 class="text-2xl font-bold mb-4">Arena</h1>
<section class="mb-6">
  <p class="mb-4">Here you can compare two extracted palettes side by side.</p>
  <p class="mb-4">
    You will be shown 10 pairs of themed widgets, where for each pair, the
    palette was extracted from the same website but using different extraction
    methods.
  </p>
  <p class="mb-4">
    After you choose which widget you prefer, you will be shown which extraction
    method was used to obtain which palette.
  </p>
</section>
<button
  class="bg-purple-500 text-white hover:bg-purple-700 py-2 px-4 rounded cursor-pointer"
  onclick={() => onStart()}
>
  Get Started
</button>
