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
  import testPalette1 from "../../data/manual/05-recombee.json";
  import testPalette2 from "../../data/llm/gpt-5-nano/05-recombee.json";
  import ArenaIntro from "../components/ArenaIntro.svelte";
  import type { ColorPalette } from "../lib/types";
  import { paletteData } from "../paletteData";

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

  function onVoteLeft() {
    console.log("Voted left");
    reveal = true;
  }

  function onVoteRight() {
    console.log("Voted right");
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
  }

  function nextRound() {
    CurrentWidget = getRandomWidget();
    currentStep++;
    reveal = false;
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
  <main class="container mx-auto p-4 text-center mt-20">
    <h2 class="text-2xl font-bold mb-4">Thanks for participating!</h2>
    <!-- TODO: Results compared to deltaE -->
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
