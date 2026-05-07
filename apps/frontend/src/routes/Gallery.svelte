<script lang="ts">
  import type { ColorPalette } from "@style-extractor/shared";
  import Button from "../components/Button.svelte";
  import { widgets } from "../components/widgets";
  import { camelToKebab } from "../lib/camelToKebab";
  import { paletteToStyle } from "../lib/paletteToStyle";
  import { paletteData } from "../paletteData";

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const allSchemes = paletteData.flatMap((site) =>
    site.palettes.map((p) => ({
      siteName: site.name,
      method: p.method,
      palette: p.color as ColorPalette,
    })),
  );
</script>

<div class="flex gap-6 container mx-auto p-4">
  <nav
    class="hidden lg:block top-4 self-start shrink-0 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto"
  >
    <h2 class="text-sm font-semibold text-gray-500 uppercase mb-2">Widgets</h2>
    <ul class="flex flex-col gap-1">
      {#each widgets as { name }}
        <li>
          <Button
            variant="ghost"
            size="sm"
            onclick={() => scrollTo(camelToKebab(name))}
          >
            {name}
          </Button>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="flex-1 min-w-0">
    <h1 class="text-2xl font-bold mb-6">Widget Gallery</h1>

    {#each widgets as { name, component: Widget }}
      <section id={camelToKebab(name)} class="mb-12 scroll-mt-4">
        <h2
          class="text-xl font-semibold mb-4 py-2 border-b sticky top-0 z-20 bg-white"
        >
          {name}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each allSchemes as scheme}
            {@const backgroundImagePrefix = `/widget-backgrounds/${scheme.siteName}`}
            <div class="flex flex-col gap-1">
              <div
                class="relative rounded overflow-hidden border border-gray-300 p-4 flex items-center justify-center min-h-64"
              >
                <picture
                  class="absolute -z-10 inset-0 w-full h-full pointer-events-none"
                >
                  <source
                    type="image/avif"
                    sizes="100vw"
                    srcset="{backgroundImagePrefix}-800w.avif 800w, {backgroundImagePrefix}-1600w.avif 1600w, {backgroundImagePrefix}-2992w.avif 2992w"
                  />
                  <source
                    type="image/webp"
                    sizes="100vw"
                    srcset="{backgroundImagePrefix}-800w.webp 800w, {backgroundImagePrefix}-1600w.webp 1600w, {backgroundImagePrefix}-2992w.webp 2992w"
                  />
                  <img
                    alt="Widget Background"
                    aria-hidden="true"
                    fetchpriority="high"
                    class="h-full w-full object-cover object-top"
                  />
                </picture>
                <div
                  class="absolute inset-0 bg-black/10 z-0 pointer-events-none"
                ></div>
                <div class="relative z-20 rounded-lg drop-shadow min-w-72">
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
