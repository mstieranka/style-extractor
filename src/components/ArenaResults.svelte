<script lang="ts">
  import { IconCheck, IconX } from "@tabler/icons-svelte-runes";
  import Button from "./Button.svelte";
  import type { RoundResult } from "../lib/frontend/arenaTypes";
  import { computeMethodRanking } from "../lib/frontend/arenaUtils";

  interface Props {
    rounds: RoundResult[];
    onReset: () => void;
  }

  let { rounds, onReset }: Props = $props();

  let methodRanking = $derived.by(() => computeMethodRanking(rounds));
</script>

<main class="container mx-auto p-4 text-center mt-10">
  <h2 class="text-2xl font-bold mb-4">Thanks for participating!</h2>

  {#if rounds.length > 0}
    {@const alignedCount = rounds.filter(
      (r) => r.alignedWithDeltaE === true,
    ).length}
    {@const scoredCount = rounds.filter(
      (r) => r.alignedWithDeltaE !== null,
    ).length}
    <p class="mb-4 text-lg">
      You agreed with &Delta;E {alignedCount}/{scoredCount} times
    </p>
    <div class="overflow-x-auto">
      <table class="mx-auto text-sm text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-300">
            <th class="px-3 py-2">Round</th>
            <th class="px-3 py-2 pr-8">Dataset</th>
            <th class="px-3 py-2">Left Method</th>
            <th class="px-3 py-2">&Delta;E Score</th>
            <th class="px-3 py-2 pl-8">Your Pick</th>
            <th class="px-3 py-2 pr-8">Aligned?</th>
            <th class="px-3 py-2">Right Method</th>
            <th class="px-3 py-2">&Delta;E Score</th>
          </tr>
        </thead>
        <tbody>
          {#each rounds as round, i}
            <tr class="border-b border-gray-200">
              <td class="px-3 py-2">{i + 1}</td>
              <td class="px-3 py-2 pr-8">{round.dataName}</td>
              <td class="px-3 py-2" class:font-bold={round.votedSide === "left"}
                >{round.leftMethod}</td
              >
              <td class="px-3 py-2"
                >{round.leftMethod === "Manual"
                  ? "(baseline)"
                  : round.leftDeltaEScore != null
                    ? round.leftDeltaEScore.toFixed(1)
                    : "\u2014"}</td
              >
              <td class="px-3 py-2 pl-8"
                >{round.votedSide === "left"
                  ? "\u2190 Left"
                  : "Right \u2192"}</td
              >
              <td class="px-3 py-2 pr-8">
                {#if round.alignedWithDeltaE === true}
                  <span class="text-green-600"><IconCheck /></span>
                {:else if round.alignedWithDeltaE === false}
                  <span class="text-red-500"><IconX /></span>
                {:else}
                  &mdash;
                {/if}
              </td>
              <td
                class="px-3 py-2"
                class:font-bold={round.votedSide === "right"}
                >{round.rightMethod}</td
              >
              <td class="px-3 py-2"
                >{round.rightMethod === "Manual"
                  ? "(baseline)"
                  : round.rightDeltaEScore != null
                    ? round.rightDeltaEScore.toFixed(1)
                    : "\u2014"}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if methodRanking.length > 0}
    <h3 class="text-xl font-bold mt-8 mb-3">Recommended Method For You</h3>
    <div
      class="mx-auto mb-4 w-max rounded-lg border-2 border-purple-400 bg-purple-50 px-6 py-3"
    >
      <p class="text-lg font-semibold text-purple-700">
        {methodRanking[0].method}
      </p>
      <p class="text-sm text-purple-600">
        Win rate: {(methodRanking[0].winRate * 100).toFixed(0)}% ({methodRanking[0]
          .wins}/{methodRanking[0].appearances})
      </p>
    </div>
    <div class="overflow-x-auto">
      <table class="mx-auto text-sm text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-300">
            <th class="px-3 py-2">Rank</th>
            <th class="px-3 py-2">Method</th>
            <th class="px-3 py-2">Wins</th>
            <th class="px-3 py-2">Appeared</th>
            <th class="px-3 py-2">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {#each methodRanking as entry, i}
            <tr class="border-b border-gray-200" class:font-bold={i === 0}>
              <td class="px-3 py-2">{i + 1}</td>
              <td class="px-3 py-2">{entry.method}</td>
              <td class="px-3 py-2">{entry.wins}</td>
              <td class="px-3 py-2">{entry.appearances}</td>
              <td class="px-3 py-2">{(entry.winRate * 100).toFixed(0)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  <Button onclick={onReset}>Start Over</Button>
</main>
