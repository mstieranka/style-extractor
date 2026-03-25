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
  import type { ColorPalette } from "../lib/types";
  import { paletteData } from "../paletteData";

  const widgets = [
    { name: "AnalyticsDashboard", component: AnalyticsDashboard },
    { name: "ChatWidget", component: ChatWidget },
    { name: "CommentBox", component: CommentBox },
    { name: "CookieConsent", component: CookieConsent },
    { name: "EmbedPlayer", component: EmbedPlayer },
    { name: "FeedbackForm", component: FeedbackForm },
    { name: "LoginPrompt", component: LoginPrompt },
    { name: "NewsletterSignup", component: NewsletterSignup },
    { name: "NotificationToast", component: NotificationToast },
    { name: "RatingCard", component: RatingCard },
    { name: "SocialShare", component: SocialShare },
  ];

  function camelToKebab(str: string) {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  }

  function paletteToStyle(palette: ColorPalette) {
    return Object.entries(palette)
      .filter(([, color]) => color != null)
      .map(([key, color]) => `--color-${camelToKebab(key)}: ${color}`)
      .join("; ");
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const allSchemes = paletteData.flatMap((site) =>
    site.palettes.map((p) => ({
      siteName: site.name,
      backgroundUrl: site.backgroundUrl,
      method: p.method,
      palette: p.color as ColorPalette,
    })),
  );
</script>

<div class="flex gap-6 container mx-auto p-4">
  <nav
    class="sticky top-4 self-start shrink-0 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto"
  >
    <h2 class="text-sm font-semibold text-gray-500 uppercase mb-2">Widgets</h2>
    <ul class="flex flex-col gap-1">
      {#each widgets as { name }}
        <li>
          <button
            onclick={() => scrollTo(camelToKebab(name))}
            class="text-sm text-purple-700 hover:text-purple-900 hover:underline text-left cursor-pointer"
            >{name}</button
          >
        </li>
      {/each}
    </ul>
  </nav>

  <div class="flex-1 min-w-0">
    <h1 class="text-2xl font-bold mb-6">Widget Gallery</h1>

    {#each widgets as { name, component: Widget }}
      <section id={camelToKebab(name)} class="mb-12 scroll-mt-4">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2">{name}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each allSchemes as scheme}
            <div class="flex flex-col gap-1">
              <div
                class="relative rounded overflow-hidden border border-gray-300 p-4 flex items-center justify-center min-h-64"
                style="background-image: url({scheme.backgroundUrl}); background-size: cover;"
              >
                <div
                  class="absolute inset-0 bg-black/10 pointer-events-none"
                ></div>
                <div class="relative z-10 rounded-lg drop-shadow min-w-72">
                  <Widget style={paletteToStyle(scheme.palette)} />
                </div>
              </div>
              <p class="text-xs text-gray-600 text-center">
                {scheme.siteName} — {scheme.method}
              </p>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>
