# Style Extractor

<img src="https://fit.cvut.cz/static/images/fit-cvut-logo-en.svg" alt="FIT CTU logo" height="200">

This software was developed with the support of the **Faculty of Information Technology, Czech Technical University in Prague**.
For more information, visit [fit.cvut.cz](https://fit.cvut.cz).

## Overview

This repository contains an implementation of a system for extracting a **color palette** from a webpage (or its CSS) and applying it to a different page. A primary motivation is theming iframe-based widgets to match a host page.

The repo has two main parts:

- **Python / Gradio app** ([app.py](app.py)): runs a local LLM and extracts a palette.
- **TypeScript utilities + Svelte UI**: heuristic palette extractor, Dembrandt output post-processor, and a CSS cleaner.

## Python (Gradio + local LLM)

### Install

Create a virtual environment and install dependencies from [requirements.txt](requirements.txt):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run

```bash
python app.py
```

This starts a Gradio UI for running local inference and extracting a palette from the input.

## TypeScript utilities + Svelte UI

### Install

```bash
pnpm install
```

### Run the frontend (heuristic extractor + CSS cleaner)

```bash
pnpm dev
```

### Run the Dembrandt post-processor

This repo contains a post-processor for the output of Dembrandt: https://github.com/dembrandt/dembrandt

```bash
pnpm test -- src/lib/dembrandt-post/postprocess.integration.test.ts
```

### Obtain heuristic extractor results

```bash
pnpm test -- src/lib/extractScored.integration.test.ts
```

## License

Licensed under the MIT License. See [LICENSE](LICENSE).