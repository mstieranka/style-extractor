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
            ...(await import("../data/llm/gpt-5-nano/01-material.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            })),
            ...(await import("../data/llm/gemma-3-12b-it/01-material.json")).default.map((entry, idx) => ({
                method: `LLM - gemma-3-12b-it (run #${idx + 1})`,
                color: entry.color,
            })),
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
            ...(await import("../data/llm/gpt-5-nano/02-m365.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gpt-5-nano/03-carbon.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gpt-5-nano/04-zed.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gpt-5-nano/05-recombee.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gpt-5-nano/06-stripe.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gpt-5-nano/07-react.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gemma-3-12b-it/08-reddit.json")).default.map((entry, idx) => ({
                method: `LLM - gemma-3-12b-it (run #${idx + 1})`,
                color: entry.color,
            })),
            ...(await import("../data/llm/gpt-5-nano/08-reddit.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gpt-5-nano/09-guardian.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
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
            ...(await import("../data/llm/gemma-3-12b-it/10-hackernews.json")).default.map((entry, idx) => ({
                method: `LLM - gemma-3-12b-it (run #${idx + 1})`,
                color: entry.color,
            })),
            ...(await import("../data/llm/gpt-5-nano/10-hackernews.json")).default.map((entry, idx) => ({
                method: `LLM - gpt-5-nano (run #${idx + 1})`,
                color: entry.color,
            }))
        ]
    },
];