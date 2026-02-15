import Color from "colorjs.io";
import { findAll, parse, type CssNode } from "css-tree";
import { groupByHueSmart } from "./groupByHue";

const invalidCssColors = [
	"inherit",
	"initial",
	"currentColor",
	"unset",
	"revert",
];

export const extractStyles = (css: string) => {
	const ast = parse(css);
	const allColors = findAll(ast, (node, _item, _list) => {
		return (
			node.type === "Declaration" &&
			node.property.toLowerCase().includes("color") &&
			node.property.startsWith("--") === false
		);
	});
	console.log("Found color declarations:", allColors);

	// get all CSS variables that are colors
	const colorVariables = findAll(ast, (node, _item, _list) => {
		return (
			node.type === "Declaration" &&
			node.property.startsWith("--") &&
			node.property.toLowerCase().includes("color")
		);
	});
	const colorVariablesProcessed = Object.fromEntries(
		colorVariables.map((decl) => {
			if (decl.type !== "Declaration") return [];
			const prop = decl.property;
			const value = getValue(decl.value);
			return [prop, value];
		}),
	);
	console.log("Found color variables:", colorVariablesProcessed);

	// group allColors by property name and evaluate var()
	const colorsByProperty = allColors.reduce(
		(acc: Record<string, string[]>, decl) => {
			if (decl.type !== "Declaration") return acc;
			const prop = decl.property;
			const value =
				decl.value.type === "Value" ? getValue(decl.value.children.first) : "";
			if (!acc[prop]) {
				acc[prop] = [];
			}
			if (value && !acc[prop].includes(value)) {
				if (prop === "color-scheme") {
					console.log("Skipping color-scheme property with value:", value);
					return acc;
				}
				const hexValue = colorValueToHex(value, colorVariablesProcessed);
				if (!hexValue) {
					return acc;
				}
				acc[prop].push(hexValue);
			}
			return acc;
		},
		{},
	);

	// make colors unique and sort them
	for (const prop in colorsByProperty) {
		colorsByProperty[prop] = Array.from(new Set(colorsByProperty[prop])).sort();
	}

	// get border properties and extract colors
	const borderProperties = findAll(ast, (node, _item, _list) => {
		if (node.type !== "Declaration") return false;
		if (node.property !== "border") return false;
		// Check that the last part of the value is not an Identifier, Number or Dimension
		if (node.value.type === "Value") {
			const lastChild = node.value.children.last;
			if (
				lastChild &&
				(lastChild.type === "Identifier" ||
					lastChild.type === "Number" ||
					lastChild.type === "Dimension")
			) {
				return false;
			}
		}
		return true;
	});
	const borderColors = borderProperties
		.map((decl) => {
			if (decl.type !== "Declaration") return null;
			return decl.value.type === "Value"
				? colorValueToHex(
						getValue(decl.value.children.last),
						colorVariablesProcessed,
					)
				: null;
		})
		.filter((color): color is string => color !== null || color !== "");
	console.log("Found border color declarations:", borderColors);

	// join colorsByProperty['border-color'], colorsByProperty['border-top-color'], etc. with borderColors and make unique
	const borderColorProps = [
		"border-color",
		"border-top-color",
		"border-right-color",
		"border-bottom-color",
		"border-left-color",
	];
	let allBorderColors: string[] = [];
	for (const prop of borderColorProps) {
		if (colorsByProperty[prop]) {
			allBorderColors = allBorderColors.concat(colorsByProperty[prop]);
		}
	}
	allBorderColors = allBorderColors.concat(borderColors);
	const uniqueBorderColors = Array.from(new Set(allBorderColors)).sort();

	const backgroundColors = colorsByProperty["background-color"] || [];
	const foregroundColors = colorsByProperty.color || [];

	const groupedBackground = groupByHueSmart(backgroundColors, {
		maxGapDegrees: 30,
		achromaticChroma: 0.03,
	});
	const groupedForeground = groupByHueSmart(foregroundColors, {
		maxGapDegrees: 30,
		achromaticChroma: 0.03,
	});
	console.log("Grouped background colors:", groupedBackground);
	console.log("Grouped foreground colors:", groupedForeground);

	// select 5 evenly spaced colors from all colors
	const sampleColors = (colors: string[]): string[] => {
		const sampleSize = 5;
		if (colors.length <= sampleSize) {
			return colors;
		}
		const step = colors.length / sampleSize;
		const sampled: string[] = [];
		for (let i = 0; i < sampleSize; i++) {
			sampled.push(colors[Math.floor(i * step)]);
		}
		return sampled;
	};

	const backgroundColorsSampled = sampleColors(backgroundColors);
	const foregroundColorsSampled = sampleColors(foregroundColors);
	const borderColorsSampled = sampleColors(uniqueBorderColors);

	return {
		colorVariablesProcessed,
		backgroundColors: backgroundColorsSampled,
		foregroundColors: foregroundColorsSampled,
		borderColors: borderColorsSampled,
		groupedBackground,
		groupedForeground,
	};
};

function getValue(node: CssNode | null): string {
	if (!node) return "";
	if (node.type === "Function") {
		const args = node.children.toArray().map(getValue);
		return `${node.name}(${args.join("")})`;
	} else if (node.type === "Identifier") {
		return node.name;
	} else if (node.type === "Hash") {
		return `#${node.value}`;
	} else if (node.type === "Dimension") {
		return `${node.value}${node.unit}`;
	} else if (node.type === "Percentage") {
		return `${node.value}%`;
	} else if (node.type === "String") {
		return `"${node.value}"`;
	} else if (
		node.type === "Number" ||
		node.type === "Operator" ||
		node.type === "Raw"
	) {
		return node.value;
	} else {
		return "";
	}
}

function colorValueToHex(
	value: string,
	colorVariables: Record<string, string>,
): string | null {
	if (value.startsWith("var(")) {
		const varArgs = value.slice(4, -1).trim().split(",");
		const varName = varArgs[0].trim();
		const varFallback = varArgs[1]?.trim();
		const varValue = colorVariables[varName] || varFallback;
		return colorToHex(varValue);
	}
	return colorToHex(value);
}

function colorToHex(color: string): string | null {
	if (invalidCssColors.includes(color)) {
		return null;
	}
	try {
		const parsedColor = new Color(color);
		const hex = parsedColor
			.to("srgb")
			.toString({ format: "hex" })
			.toLowerCase();
		let s = hex.startsWith("#") ? hex.slice(1) : hex;

		if (s.length === 3) {
			// #rgb -> #rrggbbff
			s = `${s
				.split("")
				.map((c) => c + c)
				.join("")}ff`;
		} else if (s.length === 4) {
			// #rgba -> #rrggbbaa
			s = s
				.split("")
				.map((c) => c + c)
				.join("");
		} else if (s.length === 6) {
			// #rrggbb -> #rrggbbff
			s = `${s}ff`;
		} else if (s.length === 8) {
			// already #rrggbbaa
		} else {
			console.warn(`Unexpected hex from Color.js: ${hex}`);
			return null;
		}
		return `#${s}`;
	} catch (e) {
		console.warn(`Failed to parse color: ${color}`, e);
		return null;
	}
}
