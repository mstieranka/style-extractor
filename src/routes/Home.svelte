<svelte:head>
  <title>Home | Style Extractor</title>
</svelte:head>

<main class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Welcome to Style Extractor</h1>
  <p class="my-4">This web application contains the following utilities:</p>
  <ul class="list-disc list-inside mb-4">
    <li>
      <strong class="font-semibold">Extractor:</strong> Extract color palettes from
      your CSS files.
    </li>
    <li>
      <strong class="font-semibold">Cleaner:</strong> Remove CSS rules which are not
      needed for LLM-based palette extraction and save tokens.
    </li>
  </ul>
  <p class="my-4">
    It also contains two interactive features to explore and compare the results
    of the extraction methods:
  </p>
  <ul class="list-disc list-inside mb-4">
    <li>
      <strong class="font-semibold">Gallery:</strong> Browse and compare the extracted
      palettes for various widgets and websites.
    </li>
    <li>
      <strong class="font-semibold">Arena:</strong> Participate in a voting session
      to compare the quality of different extraction methods on the same website.
    </li>
  </ul>
  <p class="my-4">Use the navigation links above to get started!</p>
  <div class="mt-8 text-sm text-gray-500">
    This project is a research prototype.
    <a
      href="https://github.com/mstieranka/style-extractor"
      class="text-purple-700 hover:text-purple-900 underline"
    >
      View the source code on GitHub.
    </a>
  </div>
</main>
