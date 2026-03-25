<script lang="ts">
  import AnalyticsDashboard from "../components/widgets/AnalyticsDashboard.svelte";
  import ChatWidget from "../components/widgets/ChatWidget.svelte";
  import CommentBox from "../components/widgets/CommentBox.svelte";
  import CookieConsent from "../components/widgets/CookieConsent.svelte";
  import EmbedPlayer from "../components/widgets/EmbedPlayer.svelte";
  import FeedbackForm from "../components/widgets/FeedbackForm.svelte";
  import LoginPrompt from "../components/widgets/LoginPrompt.svelte";
  import NewsletterSignup from "../components/widgets/NewsletterSignup.svelte";
  import NotificationToast from "../components/widgets/NotificationToast.svelte";
  import RatingCard from "../components/widgets/RatingCard.svelte";
  import SocialShare from "../components/widgets/SocialShare.svelte";
  const widgets = [
    AnalyticsDashboard,
    ChatWidget,
    CommentBox,
    CookieConsent,
    EmbedPlayer,
    FeedbackForm,
    LoginPrompt,
    NewsletterSignup,
    NotificationToast,
    RatingCard,
    SocialShare,
  ];

  import WidgetPair from "../components/WidgetPair.svelte";
  import ArenaIntro from "../components/ArenaIntro.svelte";
  import type { ColorPalette } from "../lib/types";
  import { paletteData } from "../paletteData";
  import { computeMetrics } from "../lib/compareTokens";
  import { IconCheck, IconX } from "@tabler/icons-svelte";

  interface RoundResult {
    dataName: string;
    leftMethod: string;
    rightMethod: string;
    leftDeltaEScore: number | null;
    rightDeltaEScore: number | null;
    votedSide: "left" | "right";
    alignedWithDeltaE: boolean | null;
  }

  function getRandomWidget() {
    return widgets[Math.floor(Math.random() * widgets.length)];
  }

  let currentStep = $state(0);
  let CurrentWidget = $state(getRandomWidget());
  let reveal = $state(false);
  let leftData = $state<{ method: string; palette: ColorPalette }>();
  let rightData = $state<{ method: string; palette: ColorPalette }>();
  let backgroundUrl = $state("");
  let dataName = $state("");
  let manualPalette = $state<ColorPalette>();
  let leftDeltaEScore = $state<number | null>(null);
  let rightDeltaEScore = $state<number | null>(null);
  let votedSide = $state<"left" | "right" | null>(null);
  let rounds = $state<RoundResult[]>([]);

  function computeDeltaEScores() {
    if (!manualPalette || !leftData || !rightData) return;
    const emptyFontSizes = {};
    const leftMetrics = computeMetrics(
      { color: leftData.palette, fontSize: emptyFontSizes },
      { color: manualPalette, fontSize: emptyFontSizes },
      { computeColors: true, computeFontSizes: false, computeSyntax: false },
    );
    const rightMetrics = computeMetrics(
      { color: rightData.palette, fontSize: emptyFontSizes },
      { color: manualPalette, fontSize: emptyFontSizes },
      { computeColors: true, computeFontSizes: false, computeSyntax: false },
    );
    leftDeltaEScore = leftMetrics.deltaEScoreMean;
    rightDeltaEScore = rightMetrics.deltaEScoreMean;
  }

  function recordRound(side: "left" | "right") {
    if (!leftData || !rightData) return;
    votedSide = side;
    computeDeltaEScores();

    let aligned: boolean | null = null;
    if (leftDeltaEScore != null && rightDeltaEScore != null) {
      if (leftDeltaEScore !== rightDeltaEScore) {
        const betterSide =
          leftDeltaEScore > rightDeltaEScore ? "left" : "right";
        aligned = side === betterSide;
      }
    }

    rounds.push({
      dataName,
      leftMethod: leftData.method,
      rightMethod: rightData.method,
      leftDeltaEScore,
      rightDeltaEScore,
      votedSide: side,
      alignedWithDeltaE: aligned,
    });
  }

  function onVoteLeft() {
    recordRound("left");
    reveal = true;
  }

  function onVoteRight() {
    recordRound("right");
    reveal = true;
  }

  function start() {
    currentStep = 1;
    pickRandomData();
  }

  function reset() {
    currentStep = 0;
    leftData = undefined;
    rightData = undefined;
    dataName = "";
    manualPalette = undefined;
    leftDeltaEScore = null;
    rightDeltaEScore = null;
    votedSide = null;
    rounds = [];
  }

  function nextRound() {
    CurrentWidget = getRandomWidget();
    currentStep++;
    reveal = false;
    leftDeltaEScore = null;
    rightDeltaEScore = null;
    votedSide = null;
    if (currentStep > 10) {
      // End of arena
      return;
    }
    pickRandomData();
  }

  function pickRandomData() {
    // pick random item from paletteData
    const paletteDataIdx = Math.floor(Math.random() * paletteData.length);
    const webData = paletteData[paletteDataIdx];
    dataName = webData.name;

    // pick two random palettes from the selected webData
    const leftPaletteIdx = Math.floor(Math.random() * webData.palettes.length);
    let rightPaletteIdx = leftPaletteIdx;
    // ensure different palettes for left and right
    while (rightPaletteIdx === leftPaletteIdx) {
      rightPaletteIdx = Math.floor(Math.random() * webData.palettes.length);
    }

    backgroundUrl = webData.backgroundUrl;
    const manualEntry = webData.palettes.find((p) => p.method === "Manual");
    manualPalette = manualEntry?.color;
    leftData = {
      method: webData.palettes[leftPaletteIdx].method,
      palette: webData.palettes[leftPaletteIdx].color,
    };
    rightData = {
      method: webData.palettes[rightPaletteIdx].method,
      palette: webData.palettes[rightPaletteIdx].color,
    };
  }
</script>

<svelte:head>
  <title>Arena | Style Extractor</title>
</svelte:head>

{#if currentStep === 0}
  <main class="container mx-auto p-4">
    <ArenaIntro onStart={() => start()} />
  </main>
{:else if currentStep > 10}
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
                <td
                  class="px-3 py-2"
                  class:font-bold={round.votedSide === "left"}
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

    <!-- TODO: Recommended Model For You -->
    <!-- TODO: Small backend with results -->
    <!-- TODO: (optional) compare your voting to other people -->
    <button
      class="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors duration-150"
      onclick={() => reset()}
    >
      Start Over
    </button>
  </main>
{:else}
  <main class="p-4">
    <div class="flex items-center justify-between pb-4">
      <h2 class="text-2xl font-bold">Round {currentStep}/10 - {dataName}</h2>
      <button
        class="text-sm text-gray-500 hover:text-gray-700 mr-4"
        onclick={() => reset()}
      >
        End Arena
      </button>
    </div>
    {#if leftData && rightData}
      <WidgetPair
        widget={CurrentWidget}
        {backgroundUrl}
        {onVoteLeft}
        {onVoteRight}
        {leftData}
        {rightData}
        {reveal}
        {leftDeltaEScore}
        {rightDeltaEScore}
        {votedSide}
      />
    {/if}
    {#if reveal}
      <div class="flex justify-center">
        <button
          class="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors duration-150"
          onclick={() => nextRound()}
        >
          Next Round
        </button>
      </div>
    {/if}
  </main>
{/if}
