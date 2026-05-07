import { paletteData } from "../apps/frontend/src/paletteData";

const paletteNames = paletteData.map((p) => p.name);

console.log("Palette Names:");
console.log(paletteNames);
console.log("Total Palettes:", paletteNames.length);

const methods = new Set<string>();
paletteData.forEach((p) => {
	p.palettes.forEach((entry) => {
		methods.add(entry.method);
	});
});

console.log("Methods:");
console.log(Array.from(methods).toSorted());
console.log("Total Methods:", methods.size);
