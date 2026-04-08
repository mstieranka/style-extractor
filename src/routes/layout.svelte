<script lang="ts">
  import type { Snippet } from "svelte";
  import { p } from "../router";
  import {
    IconAlbum,
    IconColorSwatch,
    IconFilePower,
    IconHome,
    IconLogout,
    IconVs,
  } from "@tabler/icons-svelte-runes";
  import { isActiveLink } from "sv-router";
  import { SvelteToast } from "@zerodevx/svelte-toast";
  import { getUser, signOut } from "../lib/frontend/auth.svelte";
  import Button from "../components/Button.svelte";

  let { children }: { children: Snippet } = $props();
</script>

<nav class="container mx-auto p-4 relative">
  <ul class="flex items-center justify-center w-full gap-8">
    <li>
      <a
        class="text-purple-700 hover:text-purple-900 flex items-center gap-1"
        href={p("/")}
        {@attach isActiveLink({ className: "underline" })}><IconHome /> Home</a
      >
    </li>
    <li>
      <a
        class="text-purple-700 hover:text-purple-900 flex items-center gap-1"
        href={p("/extractor")}
        {@attach isActiveLink({ className: "underline" })}
        ><IconColorSwatch /> Extractor</a
      >
    </li>
    <li>
      <a
        class="text-purple-700 hover:text-purple-900 flex items-center gap-1"
        href={p("/cleaner")}
        {@attach isActiveLink({ className: "underline" })}
        ><IconFilePower /> Cleaner</a
      >
    </li>
    <li>
      <a
        class="text-purple-700 hover:text-purple-900 flex items-center gap-1"
        href={p("/arena")}
        {@attach isActiveLink({ className: "underline" })}><IconVs /> Arena</a
      >
    </li>
    <li>
      <a
        class="text-purple-700 hover:text-purple-900 flex items-center gap-1"
        href={p("/gallery")}
        {@attach isActiveLink({ className: "underline" })}
        ><IconAlbum /> Gallery</a
      >
    </li>
  </ul>
  {#if getUser()}
    <Button
      size="sm"
      variant="outline"
      class="absolute right-4 top-1/2 -translate-y-1/2"
      onclick={() => signOut()}
      icon={IconLogout}
    >
      Sign out
    </Button>
  {/if}
</nav>
<SvelteToast />
{@render children()}
