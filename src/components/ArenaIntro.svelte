<script lang="ts">
  import { IconArrowRight, IconPlus } from "@tabler/icons-svelte-runes";
  import Button from "./Button.svelte";

  interface ArenaIntroProps {
    onStart: () => void;
    onContinue: (() => void) | null;
    resumeRound: number | null;
  }

  let {
    onStart,
    onContinue = null,
    resumeRound = null,
  }: ArenaIntroProps = $props();
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
{#if onContinue}
  <div class="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
    <p class="text-purple-800">
      You have an unfinished voting session (Round {resumeRound}/10).
    </p>
  </div>
  <div class="flex gap-3">
    <Button
      variant="primary"
      size="md"
      onclick={() => onContinue()}
      icon={IconArrowRight}
      iconPosition="right"
    >
      Continue
    </Button>
    <Button
      variant="outline"
      size="md"
      onclick={() => onStart()}
      icon={IconPlus}
      iconPosition="left"
    >
      Start New Session
    </Button>
  </div>
{:else}
  <Button
    variant="primary"
    size="md"
    onclick={() => onStart()}
    icon={IconArrowRight}
    iconPosition="right"
  >
    Get Started
  </Button>
{/if}
