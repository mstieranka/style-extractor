<script lang="ts">
  import {
    IconAlbum,
    IconColorSwatch,
    IconFilePower,
    IconHome,
    IconLogout,
    IconVs,
  } from "@tabler/icons-svelte-runes";
  import { SvelteToast } from "@zerodevx/svelte-toast";
  import { isActiveLink } from "sv-router";
  import type { Snippet } from "svelte";
  import Button from "../components/Button.svelte";
  import { getUser, signOut } from "../lib/frontend/auth.svelte";
  import { p } from "../router";

  let { children }: { children: Snippet } = $props();

  const links = [
    { name: "Home", icon: IconHome, href: p("/") },
    { name: "Extractor", icon: IconColorSwatch, href: p("/extractor") },
    { name: "Cleaner", icon: IconFilePower, href: p("/cleaner") },
    { name: "Arena", icon: IconVs, href: p("/arena") },
    { name: "Gallery", icon: IconAlbum, href: p("/gallery") },
  ];
</script>

<nav class="lg:container mx-auto p-4 relative flex items-center justify-center">
  <!-- desktop nav -->
  <ul class="hidden md:flex items-center justify-center lg:grow gap-8">
    {#each links as { name, icon: Icon, href }}
      <li>
        <a
          class="text-purple-700 hover:text-purple-900 flex items-center gap-1"
          {href}
          {@attach isActiveLink({ className: "underline" })}
        >
          <Icon />
          {name}
        </a>
      </li>
    {/each}
  </ul>
  <!-- mobile nav -->
  <ul class="flex md:hidden items-center justify-center gap-4">
    {#each links as { icon: Icon, href }}
      <li>
        <a
          class="text-purple-700 hover:text-purple-900 border-2 border-transparent flex items-center gap-1 p-1 rounded"
          {href}
          {@attach isActiveLink({
            className: "border-purple-700! bg-purple-100",
          })}
        >
          <Icon />
        </a>
      </li>
    {/each}
  </ul>

  <!-- logout button -->
  {#if getUser()}
    <Button
      size="sm"
      variant="outline"
      class="gap-0! md:gap-2! px-2! md:px-3! flex-col md:flex-row ml-4 md:ml-16 lg:ml-0 lg:absolute lg:right-4 lg:top-1/2 lg:-translate-y-1/2"
      onclick={() => signOut()}
      icon={IconLogout}
    >
      <span class="text-xs md:text-sm">Log out</span>
    </Button>
  {/if}
</nav>
<SvelteToast />
{@render children()}
