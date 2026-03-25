import { deepUnique } from "./lib/deepUnique";

export const paletteData = [
    {
        name: "01-material",
        backgroundUrl: "/public/widget-backgrounds/01-material.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/01-material.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/01-material.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/01-material.json", "LLM - gpt-5-nano")),
            ...(await getUniquePalettes("llm/gemma-3-12b-it/01-material.json", "LLM - gemma-3-12b-it")),
        ]
    },
    {
        name: "02-m365",
        backgroundUrl: "/public/widget-backgrounds/02-m365.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/02-m365.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/02-m365.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/02-m365.json", "LLM - gpt-5-nano"))
        ]
    },
    {
        name: "03-carbon",
        backgroundUrl: "/public/widget-backgrounds/03-carbon.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/03-carbon.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/03-carbon.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/03-carbon.json", "LLM - gpt-5-nano"))
        ]
    },
    {
        name: "04-zed",
        backgroundUrl: "/public/widget-backgrounds/04-zed.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/04-zed.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/04-zed.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/04-zed.json", "LLM - gpt-5-nano")),
        ]
    },
    {
        name: "05-recombee",
        backgroundUrl: "/public/widget-backgrounds/05-recombee.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/05-recombee.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/05-recombee.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/05-recombee.json", "LLM - gpt-5-nano"))
        ]
    },
    {
        name: "06-stripe",
        backgroundUrl: "/public/widget-backgrounds/06-stripe.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/06-stripe.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/06-stripe.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/06-stripe.json", "LLM - gpt-5-nano"))
        ]
    },
    {
        name: "07-react",
        backgroundUrl: "/public/widget-backgrounds/07-react.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/07-react.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/07-react.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/07-react.json", "LLM - gpt-5-nano"))
        ]
    },
    {
        name: "08-reddit",
        backgroundUrl: "/public/widget-backgrounds/08-reddit.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/08-reddit.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/08-reddit.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gemma-3-12b-it/08-reddit.json", "LLM - gemma-3-12b-it")),
            ...(await getUniquePalettes("llm/gpt-5-nano/08-reddit.json", "LLM - gpt-5-nano"))
        ]
    },
    {
        name: "09-guardian",
        backgroundUrl: "/public/widget-backgrounds/09-guardian.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/09-guardian.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/09-guardian.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gpt-5-nano/09-guardian.json", "LLM - gpt-5-nano"))
        ]
    },
    {
        name: "10-hackernews",
        backgroundUrl: "/public/widget-backgrounds/10-hackernews.png",
        palettes: [
            {
                method: "Manual",
                color: (await import("../data/manual/10-hackernews.json")).color,
            },
            {
                method: "Dembrandt + post-processing",
                color: (await import("../data/dembrandt/10-hackernews.output.json")).color,
            },
            ...(await getUniquePalettes("llm/gemma-3-12b-it/10-hackernews.json", "LLM - gemma-3-12b-it")),
            ...(await getUniquePalettes("llm/gpt-5-nano/10-hackernews.json", "LLM - gpt-5-nano")),
        ]
    },
];
console.log("Loaded palette data:", paletteData);

async function getUniquePalettes(location: string, method: string) {
    const importedData = await import(`../data/${location}`);
    return deepUnique(importedData.default || importedData).map((entry: any, idx: number) => ({
        method: `${method} (variation #${idx + 1})`,
        color: entry.color,
    }));
}
