<script lang="ts">
  import { IconAlertTriangle } from "@tabler/icons-svelte-runes";
</script>

<section
  class="flex flex-col gap-4 md:hidden mb-6 rounded-lg text-amber-800 border border-amber-200 bg-amber-50 p-4"
>
  <div class="flex items-center gap-2">
    <IconAlertTriangle />
    <p class="font-semibold">Warning</p>
  </div>
  <p>
    Your screen is narrower than <code>48rem</code>. The arena shows a
    background image to provide context for how well the widgets match the
    original site design, which may not be fully visible on smaller screens.
  </p>
  <p>
    You may have a degraded experience in the arena, and we recommend using a
    larger screen if possible.
  </p>
</section>
