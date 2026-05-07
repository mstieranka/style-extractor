import { describe, expect, it } from "vitest";
import { cleanCss } from "./clean-css";

describe("cleanCss", () => {
	describe("Basic color detection", () => {
		it("should keep declarations with hex colors", () => {
			const css = `
				.box {
					color: #ff0000;
					padding: 10px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("color:#ff0000");
			expect(result).not.toContain("padding");
		});

		it("should keep declarations with color keywords", () => {
			const css = `
				.box {
					background: orange;
					margin: 10px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("background:orange");
			expect(result).not.toContain("margin");
		});

		it("should keep declarations with rgb() functions", () => {
			const css = `
				.box {
					color: rgb(255, 0, 0);
					width: 100%;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("color:rgb(255,0,0)");
			expect(result).not.toContain("width");
		});

		it("should keep declarations with rgba() functions", () => {
			const css = `
				.box {
					background-color: rgba(0, 0, 0, 0.5);
					height: 50px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("background-color:rgba(0,0,0,.5)");
			expect(result).not.toContain("height");
		});

		it("should keep declarations with hsl() functions", () => {
			const css = `
				.box {
					color: hsl(120, 100%, 50%);
					font-size: 16px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("color:hsl(120,100%,50%)");
			expect(result).not.toContain("font-size");
		});

		it("should keep declarations with modern color functions (oklch)", () => {
			const css = `
				.box {
					color: oklch(0.5 0.2 180);
					display: flex;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("color:oklch(.5 .2 180)");
			expect(result).not.toContain("display");
		});

		it("should keep transparent keyword", () => {
			const css = `
				.box {
					background: transparent;
					z-index: 10;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("background:transparent");
			expect(result).not.toContain("z-index");
		});

		it("should keep currentColor keyword", () => {
			const css = `
				.box {
					border-color: currentColor;
					opacity: 0.5;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("border-color:currentColor");
			expect(result).not.toContain("opacity");
		});
	});

	describe("Shorthand properties", () => {
		it("should keep border shorthand with color", () => {
			const css = `
				.box {
					border: 1px solid red;
					margin: 10px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("border:1px solid red");
			expect(result).not.toContain("margin");
		});

		it("should keep background shorthand with color", () => {
			const css = `
				.box {
					background: url(image.png) no-repeat #fff;
					width: 100%;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("background:");
			expect(result).toContain("#fff");
			expect(result).not.toContain("width");
		});

		it("should keep box-shadow with color", () => {
			const css = `
				.box {
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					position: relative;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("box-shadow:");
			expect(result).toContain("rgba(0,0,0,.1)");
			expect(result).not.toContain("position");
		});

		it("should keep text-shadow with color", () => {
			const css = `
				.box {
					text-shadow: 1px 1px 2px black;
					font-weight: bold;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("text-shadow:");
			expect(result).toContain("black");
			expect(result).not.toContain("font-weight");
		});

		it("should keep outline with color", () => {
			const css = `
				.box {
					outline: 2px solid blue;
					cursor: pointer;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("outline:");
			expect(result).toContain("blue");
			expect(result).not.toContain("cursor");
		});
	});

	describe("CSS variables", () => {
		it("should keep color variables and their usages", () => {
			const css = `
				:root {
					--primary-color: #007bff;
					--spacing: 1rem;
				}
				.button {
					color: var(--primary-color);
					padding: var(--spacing);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("--primary-color:#007bff");
			expect(result).toContain("color:var(--primary-color)");
			expect(result).not.toContain("--spacing");
			expect(result).not.toContain("padding");
		});

		it("should keep variables with color keywords", () => {
			const css = `
				:root {
					--bg: white;
					--size: 100px;
				}
				.box {
					background: var(--bg);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("--bg:white");
			expect(result).toContain("background:var(--bg)");
			expect(result).not.toContain("--size");
		});

		it("should resolve nested var() references", () => {
			const css = `
				:root {
					--base-color: #ff0000;
					--primary: var(--base-color);
					--unrelated: 10px;
				}
				.box {
					color: var(--primary);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("--base-color:#ff0000");
			expect(result).toContain("--primary:var(--base-color)");
			expect(result).toContain("color:var(--primary)");
			expect(result).not.toContain("--unrelated");
		});

		it("should handle var() with fallbacks containing colors", () => {
			const css = `
				.box {
					color: var(--undefined, blue);
					padding: var(--also-undefined, 10px);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("color:var(--undefined,blue)");
			expect(result).not.toContain("padding");
		});

		it("should keep variables with var() to undefined variables (lenient)", () => {
			const css = `
				:root {
					--maybe-color: var(--external-color);
					--spacing: var(--external-spacing);
				}
				.box {
					color: var(--maybe-color);
					padding: var(--spacing);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("--maybe-color:var(--external-color)");
			expect(result).toContain("color:var(--maybe-color)");
			// Should keep --spacing too because it references undefined var
			expect(result).toContain("--spacing:var(--external-spacing)");
			expect(result).toContain("padding:var(--spacing)");
		});

		it("should keep variables in scoped rules", () => {
			const css = `
				.component {
					--local-color: #00ff00;
					--local-size: 20px;
				}
				.component .child {
					color: var(--local-color);
					font-size: var(--local-size);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("--local-color:#00ff00");
			expect(result).toContain("color:var(--local-color)");
			expect(result).not.toContain("--local-size");
			expect(result).not.toContain("font-size");
		});

		it("should detect cycles and keep them (lenient)", () => {
			const css = `
				:root {
					--a: var(--b);
					--b: var(--a);
				}
				.box {
					color: var(--a);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("--a:var(--b)");
			expect(result).toContain("--b:var(--a)");
			expect(result).toContain("color:var(--a)");
		});
	});

	describe("At-rules", () => {
		it("should keep @media rules with color declarations", () => {
			const css = `
				@media (prefers-color-scheme: dark) {
					.box {
						color: white;
						padding: 10px;
					}
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("@media");
			expect(result).toContain("color:white");
			expect(result).not.toContain("padding");
		});

		it("should remove @media rules with no color declarations", () => {
			const css = `
				@media (max-width: 600px) {
					.box {
						padding: 10px;
						margin: 5px;
					}
				}
			`;
			const result = cleanCss(css);
			expect(result).not.toContain("@media");
			expect(result).not.toContain("padding");
		});

		it("should keep @supports rules with color declarations", () => {
			const css = `
				@supports (display: grid) {
					.grid {
						background: #f0f0f0;
						display: grid;
					}
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("@supports");
			expect(result).toContain("background:#f0f0f0");
			expect(result).not.toContain("display:grid");
		});

		it("should remove @import rules", () => {
			const css = `
				@import url('style.css');
				.box {
					color: red;
				}
			`;
			const result = cleanCss(css);
			expect(result).not.toContain("@import");
			expect(result).toContain("color:red");
		});

		it("should remove @font-face rules", () => {
			const css = `
				@font-face {
					font-family: 'MyFont';
					src: url('font.woff');
				}
				.box {
					color: blue;
				}
			`;
			const result = cleanCss(css);
			expect(result).not.toContain("@font-face");
			expect(result).toContain("color:blue");
		});

		it("should keep @keyframes with color declarations", () => {
			const css = `
				@keyframes fade {
					from {
						opacity: 0;
						color: red;
					}
					to {
						opacity: 1;
						color: blue;
					}
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("@keyframes");
			expect(result).toContain("color:red");
			expect(result).toContain("color:blue");
			expect(result).not.toContain("opacity");
		});
	});

	describe("Property name matching", () => {
		it("should keep properties with 'color' in name", () => {
			const css = `
				.box {
					background-color: red;
					border-color: blue;
					caret-color: green;
					text-decoration-color: orange;
					width: 100px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("background-color:red");
			expect(result).toContain("border-color:blue");
			expect(result).toContain("caret-color:green");
			expect(result).toContain("text-decoration-color:orange");
			expect(result).not.toContain("width");
		});

		it("should keep SVG fill and stroke properties", () => {
			const css = `
				.svg-element {
					fill: #ff0000;
					stroke: #0000ff;
					stroke-width: 2px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("fill:#ff0000");
			expect(result).toContain("stroke:#0000ff");
			expect(result).not.toContain("stroke-width");
		});
	});

	describe("Empty rules", () => {
		it("should remove rules with no color declarations", () => {
			const css = `
				.no-colors {
					padding: 10px;
					margin: 5px;
					display: flex;
				}
				.has-color {
					color: red;
				}
			`;
			const result = cleanCss(css);
			expect(result).not.toContain(".no-colors");
			expect(result).toContain(".has-color");
		});

		it("should remove rules that become empty after filtering", () => {
			const css = `
				.mixed {
					color: red;
					padding: 10px;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain(".mixed");
			expect(result).toContain("color:red");
			expect(result).not.toContain("padding");
		});
	});

	describe("Complex cases", () => {
		it("should handle multiple selectors", () => {
			const css = `
				.box, .card, .panel {
					background: #fff;
					padding: 1rem;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("background:#fff");
			expect(result).not.toContain("padding");
		});

		it("should handle nested @media and rules", () => {
			const css = `
				@media screen and (min-width: 768px) {
					.container {
						background: #f5f5f5;
						max-width: 1200px;
					}
					.sidebar {
						width: 300px;
					}
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("@media");
			expect(result).toContain("background:#f5f5f5");
			expect(result).toContain(".container");
			expect(result).not.toContain(".sidebar");
			expect(result).not.toContain("max-width");
		});

		it("should handle real-world CSS with mixed content", () => {
			const css = `
				:root {
					--primary: #007bff;
					--secondary: #6c757d;
					--spacing: 1rem;
					--border-radius: 4px;
				}
				
				body {
					font-family: Arial, sans-serif;
					color: var(--secondary);
					margin: 0;
					padding: 0;
				}
				
				.button {
					background-color: var(--primary);
					border: none;
					border-radius: var(--border-radius);
					padding: var(--spacing);
					cursor: pointer;
				}
				
				.button:hover {
					background-color: #0056b3;
				}
			`;
			const result = cleanCss(css);

			// Should keep color variables
			expect(result).toContain("--primary:#007bff");
			expect(result).toContain("--secondary:#6c757d");

			// Should not keep non-color variables
			expect(result).not.toContain("--spacing");
			expect(result).not.toContain("--border-radius");

			// Should keep color declarations
			expect(result).toContain("color:var(--secondary)");
			expect(result).toContain("background-color:var(--primary)");
			expect(result).toContain("background-color:#0056b3");

			// Should not keep non-color declarations
			expect(result).not.toContain("font-family");
			expect(result).not.toContain("margin");
			expect(result).not.toContain("padding");
			expect(result).not.toContain("border:none");
			expect(result).not.toContain("border-radius");
			expect(result).not.toContain("cursor");
		});
	});

	describe("Options", () => {
		it("should respect includeShorthands option", () => {
			const css = `
				.box {
					animation: fade 1s ease;
					color: red;
				}
			`;
			const result = cleanCss(css, {
				includeShorthands: ["animation"],
			});
			expect(result).toContain("animation:");
			expect(result).toContain("color:red");
		});

		it("should respect maxVarDepth option", () => {
			const css = `
				:root {
					--a: var(--b);
					--b: var(--c);
					--c: var(--d);
					--d: red;
				}
				.box {
					color: var(--a);
				}
			`;
			const result = cleanCss(css, { maxVarDepth: 2 });
			// With depth 2, might not resolve fully, but should still be lenient
			expect(result).toContain("color:var(--a)");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty CSS", () => {
			const result = cleanCss("");
			expect(result).toBe("");
		});

		it("should handle CSS with only comments", () => {
			const css = `/* This is a comment */`;
			const result = cleanCss(css);
			expect(result.trim()).toBe("");
		});

		it("should handle malformed var() gracefully", () => {
			const css = `
				.box {
					color: var();
					background: red;
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("background:red");
		});

		it("should handle very long var() chains", () => {
			const css = `
				:root {
					--level-0: #ff0000;
					--level-1: var(--level-0);
					--level-2: var(--level-1);
					--level-3: var(--level-2);
					--level-4: var(--level-3);
					--level-5: var(--level-4);
				}
				.box {
					color: var(--level-5);
				}
			`;
			const result = cleanCss(css);
			expect(result).toContain("color:var(--level-5)");
			expect(result).toContain("--level-0:#ff0000");
		});
	});
});
