<script lang="ts">
  import type { Snippet } from "svelte";
  import { p } from "../router";
  import {
    IconColorSwatch,
    IconFilePower,
    IconHome,
    IconVs,
  } from "@tabler/icons-svelte";
  import { isActiveLink } from "sv-router";

  let { children }: { children: Snippet } = $props();
</script>

<nav class="container mx-auto p-4">
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
  </ul>
</nav>
{@render children()}
