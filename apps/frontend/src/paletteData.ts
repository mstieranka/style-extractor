import { type ColorPalette, deepUnique } from "@style-extractor/shared";

export const paletteData = [
	{
		name: "01-material",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/01-material.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/01-material.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/01-material.json")
				).default,
				"LLM - gpt-5-nano",
			)),
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gemma-3-12b-it/01-material.json")
				).default,
				"LLM - gemma-3-12b-it",
			)),
		],
	},
	{
		name: "02-m365",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/02-m365.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/02-m365.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/02-m365.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "03-carbon",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/03-carbon.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/03-carbon.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/03-carbon.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "04-zed",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/04-zed.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/04-zed.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/04-zed.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "05-recombee",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/05-recombee.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/05-recombee.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/05-recombee.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "06-stripe",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/06-stripe.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/06-stripe.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/06-stripe.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "07-react",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/07-react.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/07-react.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/07-react.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "08-reddit",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/08-reddit.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/08-reddit.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gemma-3-12b-it/08-reddit.json")
				).default,
				"LLM - gemma-3-12b-it",
			)),
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/08-reddit.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "09-guardian",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/09-guardian.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (await import("../../../data/dembrandt/09-guardian.output.json"))
					.color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/09-guardian.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
	{
		name: "10-hackernews",
		palettes: [
			{
				method: "Manual",
				color: (await import("../../../data/manual/10-hackernews.json")).color,
			},
			{
				method: "Dembrandt + post-processing",
				color: (
					await import("../../../data/dembrandt/10-hackernews.output.json")
				).color,
			},
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gemma-3-12b-it/10-hackernews.json")
				).default,
				"LLM - gemma-3-12b-it",
			)),
			...(await getUniquePalettes(
				(
					await import("../../../data/llm/gpt-5-nano/10-hackernews.json")
				).default,
				"LLM - gpt-5-nano",
			)),
		],
	},
];

async function getUniquePalettes(
	data: Array<{ color: ColorPalette }>,
	method: string,
) {
	return deepUnique(data).map((entry, idx: number) => ({
		method: `${method} (variation #${idx + 1})`,
		color: entry.color,
	}));
}
