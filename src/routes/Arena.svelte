<script lang="ts">
  import ArenaIntro from "../components/ArenaIntro.svelte";
  import ArenaLogin from "../components/ArenaLogin.svelte";
  import ArenaResults from "../components/ArenaResults.svelte";
  import ArenaRound from "../components/ArenaRound.svelte";
  import type { ColorPalette } from "../lib/types";
  import type { PendingSession, RoundResult } from "../lib/frontend/arenaTypes";
  import { paletteData } from "../paletteData";
  import { computeMetrics } from "../lib/compareTokens";
  import { supabase } from "../lib/frontend/supabaseClient";
  import { getUser, isLoading } from "../lib/frontend/auth.svelte";
  import { toast } from "@zerodevx/svelte-toast";
  import Loading from "../components/Loading.svelte";
  import { getRandomWidget } from "../components/widgets";

  let currentStep = $state(0);
  let currentWidget = $state(getRandomWidget());
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
  let sessionId = $state<string | null>(null);
  let sessionLoading = $state(false);
  let sessionChecked = $state(false);
  let pendingSession = $state<PendingSession | null>(null);

  $effect(() => {
    const user = getUser();
    if (user && !sessionChecked && !sessionLoading && currentStep === 0) {
      loadSession();
    }
  });

  async function loadSession() {
    const user = getUser();
    if (!user) return;
    sessionLoading = true;
    try {
      const { data, error } = await supabase
        .from("session_max_rounds")
        .select("session_id, max_round")
        .eq("user_id", user.id)
        .lt("max_round", 10)
        .limit(1);

      if (error) {
        console.error("Error loading session:", error);
        return;
      }

      if (
        data &&
        data.length > 0 &&
        data[0].session_id &&
        data[0].max_round != null
      ) {
        pendingSession = {
          sessionId: data[0].session_id,
          maxRound: data[0].max_round,
        };
      }
    } finally {
      sessionLoading = false;
      sessionChecked = true;
    }
  }

  async function resyncSession() {
    const user = getUser();
    if (!user || !sessionId) return;

    const { data, error } = await supabase
      .from("votes")
      .select("round_number")
      .eq("user_id", user.id)
      .eq("session_id", sessionId);

    if (error || !data || data.length === 0) return;

    const maxRound = Math.max(...data.map((r) => r.round_number));

    if (maxRound >= 10) {
      currentStep = 11;
    } else {
      currentStep = maxRound + 1;
      currentWidget = getRandomWidget();
      reveal = false;
      leftDeltaEScore = null;
      rightDeltaEScore = null;
      votedSide = null;
      pickRandomData();
    }

    toast.push(
      "This session was continued on another device. Resynced to the latest round.",
    );
  }

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

  async function recordRound(side: "left" | "right") {
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

    const { error } = await supabase.from("votes").insert({
      user_id: getUser()!.id,
      data_id: dataName,
      widget_id: currentWidget.name,
      method_left: leftData.method,
      method_right: rightData.method,
      voted_for: side,
      round_number: currentStep,
      session_id: sessionId!,
    });

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation — session continued on another device
        rounds.pop();
        votedSide = null;
        await resyncSession();
        return false;
      }
      console.error("Error recording vote:", error);
    }
    return true;
  }

  async function onVoteLeft() {
    const ok = await recordRound("left");
    if (ok) reveal = true;
  }

  async function onVoteRight() {
    const ok = await recordRound("right");
    if (ok) reveal = true;
  }

  function continueSession() {
    if (!pendingSession) return;
    sessionId = pendingSession.sessionId;
    currentStep = pendingSession.maxRound + 1;
    pendingSession = null;
    currentWidget = getRandomWidget();
    pickRandomData();
  }

  function start() {
    pendingSession = null;
    sessionId = crypto.randomUUID();
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
    sessionId = null;
    sessionChecked = false;
    pendingSession = null;
  }

  function nextRound() {
    currentWidget = getRandomWidget();
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

{#if isLoading() || sessionLoading}
  <main class="container mx-auto p-4 text-center mt-10">
    <Loading />
  </main>
{:else if !getUser()}
  <main class="container mx-auto p-4">
    <ArenaLogin />
  </main>
{:else if currentStep === 0}
  <main class="container mx-auto p-4">
    <ArenaIntro
      onStart={() => start()}
      onContinue={pendingSession ? () => continueSession() : null}
      resumeRound={pendingSession ? pendingSession.maxRound + 1 : null}
    />
  </main>
{:else if currentStep > 10}
  <ArenaResults {rounds} onReset={() => reset()} />
{:else if leftData && rightData}
  <ArenaRound
    {currentStep}
    {dataName}
    {leftData}
    {rightData}
    {currentWidget}
    {backgroundUrl}
    {reveal}
    {leftDeltaEScore}
    {rightDeltaEScore}
    {votedSide}
    {onVoteLeft}
    {onVoteRight}
    onNextRound={() => nextRound()}
    onReset={() => reset()}
  />
{/if}
