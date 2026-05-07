# Style Extractor

<img src="https://fit.cvut.cz/static/images/fit-cvut-logo-en.svg" alt="FIT CTU logo" height="200">

This software was developed with the support of the **Faculty of Information Technology, Czech Technical University in Prague**.
For more information, visit [fit.cvut.cz](https://fit.cvut.cz).

## Overview

This repository contains an implementation of a system for extracting a **color palette** from a webpage (or its CSS) and applying it to a different page. A primary motivation is theming iframe-based widgets to match a host page.

The repo has the following parts:

- **Python / Gradio app** (`apps/python-llm`): runs a local LLM and extracts a palette.
- **Heuristic palette extractor** (`packages/extractor`): a TypeScript implementation of a heuristic-based palette extraction method.
- **Dembrandt post-processor** (`packages/dembrandt-post`): a TypeScript implementation of a post-processor for the output of [Dembrandt](https://github.com/dembrandt/dembrandt), an existing palette extraction method.
- **Shared utilities** (`packages/shared`): shared code and types for the above parts. Also includes a CSS cleaner that removes all CSS declarations for a stylesheet that aren't necessary for the palette extraction (to save tokens).
- **Svelte UI** (`apps/frontend`): heuristic palette extractor, a CSS cleaner, and an arena that allows users to select which one of two randomly selected palettes looks better on a given webpage.

## Python (Gradio + local LLM)

### Install using `uv`

Use `uv` to create a virtual environment and install dependencies:

```bash
cd apps/python-llm
uv sync
```

### Run

```bash
uv run app.py
```

This starts a Gradio UI for running local inference and extracting a palette from the input.

## TypeScript (Svelte UI, heuristic extractor, Dembrandt post-processor)

### Install using `pnpm`

```bash
pnpm install
```

### Run the frontend (heuristic extractor, CSS cleaner, arena)

For the arena backend to work, you need to set up an `apps/frontend/.env` file with variables from `apps/frontend/.env.example`. Then run:

```bash
pnpm dev
```

### Get evaluation metrics for the Dembrandt post-processor

```bash
pnpm -F dembrandt-post test
```

### Get evaluation metrics for the heuristic extractor

```bash
pnpm -F extractor test
```

### Get evaluation metrics for the LLM-based extractor

The outputs are stored in `data/llm`. You can get the metrics from those outputs by running:

```bash
pnpm compare-llm
```

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
