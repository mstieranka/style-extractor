<script lang="ts">
  import { IconArrowRight, IconPlus } from "@tabler/icons-svelte-runes";
  import Button from "./Button.svelte";
  import ArenaScreenWarning from "./ArenaScreenWarning.svelte";
  import ArenaDescription from "./ArenaDescription.svelte";

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
<ArenaDescription />
<ArenaScreenWarning />
{#if onContinue}
  <div class="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
    <p class="text-purple-800">
      You have an unfinished voting session (Round {resumeRound}/10).
    </p>
  </div>
  <div class="flex flex-col md:flex-row gap-3">
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
