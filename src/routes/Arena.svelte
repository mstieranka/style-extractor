<script lang="ts">
  import ArenaIntro from "../components/ArenaIntro.svelte";
  import ArenaLogin from "../components/ArenaLogin.svelte";
  import ArenaResults from "../components/ArenaResults.svelte";
  import ArenaRound from "../components/ArenaRound.svelte";
  import type {
    PendingSession,
    RoundResult,
    RoundSelection,
    Vote,
  } from "../lib/frontend/arenaTypes";
  import { paletteData } from "../paletteData";
  import { computeMetrics } from "../lib/compareTokens";
  import { supabase } from "../lib/frontend/supabaseClient";
  import { getUser, isLoading } from "../lib/frontend/auth.svelte";
  import { toast } from "@zerodevx/svelte-toast";
  import Loading from "../components/Loading.svelte";
  import { generateRound } from "../lib/frontend/generateRound";

  let currentStep = $state(0);
  let selection = $state<RoundSelection | undefined>(undefined);
  let reveal = $state(false);
  let leftDeltaEScore = $state<number | null>(null);
  let rightDeltaEScore = $state<number | null>(null);
  let vote = $state<Vote | null>(null);
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

  async function fetchSessionRounds(sid: string): Promise<RoundResult[]> {
    const user = getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("votes")
      .select("data_id, method_left, method_right, voted_for, round_number")
      .eq("user_id", user.id)
      .eq("session_id", sid)
      .order("round_number");

    if (error || !data) return [];

    const emptyFontSizes = {};
    return data.map((row) => {
      const siteEntry = paletteData.find((s) => s.name === row.data_id);
      const manualPaletteEntry = siteEntry?.palettes.find(
        (p) => p.method === "Manual",
      );
      const leftPaletteEntry = siteEntry?.palettes.find(
        (p) => p.method === row.method_left,
      );
      const rightPaletteEntry = siteEntry?.palettes.find(
        (p) => p.method === row.method_right,
      );

      let leftDeltaE: number | null = null;
      let rightDeltaE: number | null = null;
      let aligned: boolean | null = null;

      if (manualPaletteEntry && leftPaletteEntry && rightPaletteEntry) {
        const manual = manualPaletteEntry.color;
        const leftMetrics = computeMetrics(
          { color: leftPaletteEntry.color, fontSize: emptyFontSizes },
          { color: manual, fontSize: emptyFontSizes },
          {
            computeColors: true,
            computeFontSizes: false,
            computeSyntax: false,
          },
        );
        const rightMetrics = computeMetrics(
          { color: rightPaletteEntry.color, fontSize: emptyFontSizes },
          { color: manual, fontSize: emptyFontSizes },
          {
            computeColors: true,
            computeFontSizes: false,
            computeSyntax: false,
          },
        );
        leftDeltaE = leftMetrics.deltaEScoreMean;
        rightDeltaE = rightMetrics.deltaEScoreMean;

        if (
          leftDeltaE != null &&
          rightDeltaE != null &&
          leftDeltaE !== rightDeltaE
        ) {
          const betterSide = leftDeltaE > rightDeltaE ? "left" : "right";
          aligned = row.voted_for === betterSide;
        }
      }

      return {
        dataName: row.data_id,
        leftMethod: row.method_left,
        rightMethod: row.method_right,
        vote: row.voted_for,
        leftDeltaEScore: leftDeltaE,
        rightDeltaEScore: rightDeltaE,
        alignedWithDeltaE: aligned,
      };
    });
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
    rounds = await fetchSessionRounds(sessionId);

    if (maxRound >= 10) {
      currentStep = 11;
    } else {
      currentStep = maxRound + 1;
      reveal = false;
      leftDeltaEScore = null;
      rightDeltaEScore = null;
      vote = null;
      pickRandomData();
    }

    toast.push(
      "This session was continued on another device. Resynced to the latest round.",
    );
  }

  function computeDeltaEScores() {
    if (!selection?.manualPalette) return;
    const emptyFontSizes = {};
    const leftMetrics = computeMetrics(
      { color: selection.leftData.palette, fontSize: emptyFontSizes },
      { color: selection.manualPalette, fontSize: emptyFontSizes },
      { computeColors: true, computeFontSizes: false, computeSyntax: false },
    );
    const rightMetrics = computeMetrics(
      { color: selection.rightData.palette, fontSize: emptyFontSizes },
      { color: selection.manualPalette, fontSize: emptyFontSizes },
      { computeColors: true, computeFontSizes: false, computeSyntax: false },
    );
    leftDeltaEScore = leftMetrics.deltaEScoreMean;
    rightDeltaEScore = rightMetrics.deltaEScoreMean;
  }

  async function recordRound(roundVote: Vote) {
    if (!selection) return;
    vote = roundVote;
    computeDeltaEScores();

    let aligned: boolean | null = null;
    if (leftDeltaEScore != null && rightDeltaEScore != null) {
      if (leftDeltaEScore !== rightDeltaEScore) {
        const betterSide =
          leftDeltaEScore > rightDeltaEScore ? "left" : "right";
        aligned = vote === betterSide;
      }
    }

    rounds.push({
      dataName: selection.dataName,
      leftMethod: selection.leftData.method,
      rightMethod: selection.rightData.method,
      leftDeltaEScore,
      rightDeltaEScore,
      vote: roundVote,
      alignedWithDeltaE: aligned,
    });

    const { error } = await supabase.from("votes").insert({
      user_id: getUser()!.id,
      data_id: selection.dataName,
      widget_id: selection.widget.name,
      method_left: selection.leftData.method,
      method_right: selection.rightData.method,
      voted_for: roundVote,
      round_number: currentStep,
      session_id: sessionId!,
    });

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation — session continued on another device
        rounds.pop();
        vote = null;
        await resyncSession();
        return false;
      }
      console.error("Error recording vote:", error);
    }
    return true;
  }

  async function onVote(vote: Vote) {
    const ok = await recordRound(vote);
    if (ok) reveal = true;
  }

  async function continueSession() {
    if (!pendingSession) return;
    sessionLoading = true;
    const sid = pendingSession.sessionId;
    const nextStep = pendingSession.maxRound + 1;
    try {
      rounds = await fetchSessionRounds(sid);
    } finally {
      sessionId = sid;
      currentStep = nextStep;
      pendingSession = null;
      pickRandomData();
      sessionLoading = false;
    }
  }

  function start() {
    pendingSession = null;
    sessionId = crypto.randomUUID();
    currentStep = 1;
    pickRandomData();
  }

  function reset() {
    currentStep = 0;
    selection = undefined;
    leftDeltaEScore = null;
    rightDeltaEScore = null;
    vote = null;
    rounds = [];
    sessionId = null;
    sessionChecked = false;
    pendingSession = null;
  }

  function nextRound() {
    currentStep++;
    reveal = false;
    leftDeltaEScore = null;
    rightDeltaEScore = null;
    vote = null;
    if (currentStep > 10) {
      // End of arena
      return;
    }
    pickRandomData();
  }

  function pickRandomData() {
    selection = generateRound(sessionId!, currentStep);
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
{:else if selection}
  <ArenaRound
    {currentStep}
    dataName={selection.dataName}
    leftData={selection.leftData}
    rightData={selection.rightData}
    currentWidget={selection.widget}
    backgroundUrl={selection.backgroundUrl}
    {reveal}
    {leftDeltaEScore}
    {rightDeltaEScore}
    {onVote}
    onNextRound={() => nextRound()}
    onReset={() => reset()}
  />
{/if}
