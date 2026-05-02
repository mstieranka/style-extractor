import fs from "node:fs/promises";
import { type CDPSession, chromium } from "playwright";
import prettier from "prettier";

type CssChunk = {
	label: string;
	css: string;
};

interface CdpStyleSheetHeader {
	styleSheetId: string;
	sourceURL?: string;
	title?: string;
	origin?: string;
	disabled?: boolean;
}

function usage(): never {
	console.error("Usage: tsx extract-css.ts <url> <output.css>");
	process.exit(1);
}

function waitForPause(): Promise<void> {
	return new Promise((resolve) => {
		console.log("Press Enter to continue...");
		const handler = () => {
			process.stdin.removeListener("data", handler);
			process.stdin.pause();
			resolve();
		};
		process.stdin.once("data", handler);
	});
}

async function safeFormatCss(
	cssText: string,
	label = "chunk",
): Promise<string> {
	// Remove lines that contain `:;` which is invalid CSS
	const cleanedCss = cssText
		.split("\n")
		.filter((line) => !line.includes(":;"))
		.join("\n");
	try {
		// Prettier can choke on some edge-case / nonstandard CSS.
		// Formatting per-chunk keeps the run resilient.
		const formatted = await prettier.format(cleanedCss, { parser: "css" });
		// Filter again after Prettier in case it created any :; patterns
		return formatted
			.split("\n")
			.filter((line) => !line.includes(":;"))
			.join("\n");
	} catch (e) {
		return (
			`/* ===== Prettier failed for ${label}: ${String(e)} ===== */\n` +
			cleanedCss +
			"\n"
		);
	}
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const wait = args.includes("--wait");
	const positionalArgs = args.filter((arg) => !arg.startsWith("--"));
	const [url, outPath] = positionalArgs;
	if (!url || !outPath) usage();

	const context = await chromium.launchPersistentContext("./data/playwright", {
		headless: !wait,
	});

	try {
		const page = await context.newPage();

		// tsx/esbuild workaround for page.evaluate scripts
		await page.addInitScript({
			// esbuild keepNames helper shim (tsx)
			content: "globalThis.__name = (fn, _name) => fn;",
		});

		const cdp: CDPSession = await context.newCDPSession(page);
		await cdp.send("DOM.enable");
		await cdp.send("CSS.enable");

		const sheets = new Map<string, CdpStyleSheetHeader>();
		cdp.on("CSS.styleSheetAdded", (evt: { header?: CdpStyleSheetHeader }) => {
			if (evt?.header?.styleSheetId) {
				sheets.set(evt.header.styleSheetId, evt.header);
			}
		});

		await page.goto(url, { waitUntil: "domcontentloaded" });
		if (wait) await waitForPause();

		const chunks: CssChunk[] = [];

		// 1) Collect CDP stylesheet texts
		for (const [id, header] of sheets.entries()) {
			const label: string =
				header?.sourceURL || header?.title || "(inline/constructed)";
			let text = "";

			try {
				const res = (await cdp.send("CSS.getStyleSheetText", {
					styleSheetId: id,
				})) as { text?: string };
				text = res.text ?? "";
			} catch (e) {
				text = `/* Failed to read sheet ${id}: ${String(e)} */\n`;
			}

			chunks.push({
				label: `Stylesheet: ${label} | origin=${String(
					header?.origin ?? "unknown",
				)} | disabled=${String(header?.disabled ?? false)}`,
				css: text,
			});
		}

		// 2) Serialize adoptedStyleSheets + open shadow-root <style> tags as a fallback
		const adoptedDump = await page.evaluate(() => {
			type DumpChunk = { label: string; css: string };

			const serializeRules = (sheet: CSSStyleSheet): string => {
				try {
					// Accessing cssRules can throw if it’s not readable.
					return Array.from(sheet.cssRules || [])
						.map((r) => r.cssText)
						.join("\n");
				} catch (e) {
					return `/* cannot read cssRules: ${String(e)} */`;
				}
			};

			const out: DumpChunk[] = [];

			if (
				"adoptedStyleSheets" in document &&
				Array.isArray(document.adoptedStyleSheets)
			) {
				for (const s of document.adoptedStyleSheets) {
					out.push({
						label: "document.adoptedStyleSheets",
						css: serializeRules(s),
					});
				}
			}

			for (const el of Array.from(
				document.querySelectorAll<HTMLElement>("*"),
			)) {
				// Only open shadow roots are visible here.
				const sr = el.shadowRoot;
				if (!sr) continue;

				if (
					"adoptedStyleSheets" in sr &&
					Array.isArray(sr.adoptedStyleSheets)
				) {
					for (const s of sr.adoptedStyleSheets) {
						out.push({
							label: "shadowRoot.adoptedStyleSheets",
							css: serializeRules(s),
						});
					}
				}

				for (const styleEl of Array.from(
					sr.querySelectorAll<HTMLStyleElement>("style"),
				)) {
					out.push({
						label: "<style> inside open shadowRoot",
						css: styleEl.textContent || "",
					});
				}
			}

			return out;
		});

		chunks.push(...adoptedDump);

		const inlineVarsCss = await page.evaluate(() => {
			const esc = (s: string) =>
				globalThis.CSS?.escape !== undefined
					? CSS.escape(s)
					: s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");

			const blocks: string[] = [];

			const emitFromStyle = (selector: string, style: CSSStyleDeclaration) => {
				const decls: string[] = [];
				for (let i = 0; i < style.length; i++) {
					const prop = style[i];
					if (prop.startsWith("--")) {
						const val = style.getPropertyValue(prop).trim();
						if (val) decls.push(`  ${prop}: ${val};`);
					}
				}
				if (decls.length) blocks.push(`${selector} {\n${decls.join("\n")}\n}`);
			};

			// Most theme token injection happens here:
			emitFromStyle(":root", document.documentElement.style);
			if (document.body) emitFromStyle("body", document.body.style);

			// Optional: other elements with inline custom properties
			for (const el of Array.from(
				document.querySelectorAll<HTMLElement>("[style*='--']"),
			)) {
				if (el === document.documentElement || el === document.body) continue;

				// Best-effort selector; skip if we can't name it reasonably.
				let sel = "";
				if (el.id) sel = `#${esc(el.id)}`;
				else if (el.classList.length)
					sel = `${el.tagName.toLowerCase()}.${esc(el.classList[0])}`;
				else continue;

				emitFromStyle(sel, el.style);
			}

			return blocks.join("\n\n");
		});

		chunks.push({
			label: "Inline style custom properties",
			css: inlineVarsCss,
		});

		// 4) Inline styles (full) - serialize all inline style attributes
		// Skip custom properties (already collected in inlineVarsCss)
		const inlineFullCss = await page.evaluate(() => {
			// Helper to generate a unique selector for an element
			const getCssPath = (el: Element): string => {
				if (!(el instanceof Element)) return "";
				const path: string[] = [];
				while (el.nodeType === Node.ELEMENT_NODE) {
					let selector = el.nodeName.toLowerCase();

					if (el.id) {
						// Use CSS.escape() to handle special characters
						selector += `#${CSS.escape(el.id)}`;
						path.unshift(selector);
						break;
					} else {
						let sib = el.previousElementSibling as Element | null;
						let nth = 1;
						while (sib !== null) {
							if (sib.nodeName.toLowerCase() === selector) nth++;
							sib = sib.previousElementSibling as Element | null;
						}
						if (nth !== 1) selector += `:nth-of-type(${nth})`;
					}
					path.unshift(selector);
					el = el.parentNode as Element;
				}
				return path.join(" > ");
			};

			const inlineElements = document.querySelectorAll("*[style]");
			const inlineStyles = Array.from(inlineElements).map((el) => {
				const selector = getCssPath(el);
				const style = (el as HTMLElement).style;
				if (!style || style.length === 0) return "";

				// Iterate through style properties for canonical formatting
				// Skip custom properties (--*) as they're handled separately
				const declarations: string[] = [];
				for (let i = 0; i < style.length; i++) {
					const prop = style[i];
					if (prop.startsWith("--")) continue; // Skip custom properties
					const value = style.getPropertyValue(prop);
					const priority = style.getPropertyPriority(prop);
					// Skip invalid declarations with empty values (would create "prop:;")
					if (value?.trim()) {
						const declaration = `  ${prop}: ${value}${priority ? ` !${priority}` : ""};`;
						// Extra safety: ensure we don't create invalid :; patterns
						if (!declaration.includes(":;")) {
							declarations.push(declaration);
						}
					}
				}

				if (declarations.length === 0) return "";

				return `/* Inline style from: <${el.tagName.toLowerCase()}> */\n${selector} {\n${declarations.join("\n")}\n}`;
			});

			return inlineStyles.filter((s) => s).join("\n\n");
		});

		chunks.push({ label: "Inline styles (full)", css: inlineFullCss });

		// 5) HTML color attributes (bgcolor, color, link, vlink, alink)
		const htmlAttrsCss = await page.evaluate(() => {
			const getCssPath = (el: Element): string => {
				if (!(el instanceof Element)) return "";
				const path: string[] = [];
				while (el.nodeType === Node.ELEMENT_NODE) {
					let selector = el.nodeName.toLowerCase();

					if (el.id) {
						selector += `#${CSS.escape(el.id)}`;
						path.unshift(selector);
						break;
					} else {
						let sib = el.previousElementSibling as Element | null;
						let nth = 1;
						while (sib !== null) {
							if (sib.nodeName.toLowerCase() === selector) nth++;
							sib = sib.previousElementSibling as Element | null;
						}
						if (nth !== 1) selector += `:nth-of-type(${nth})`;
					}
					path.unshift(selector);
					el = el.parentNode as Element;
				}
				return path.join(" > ");
			};

			const blocks: string[] = [];

			// Extract bgcolor attributes (table, body, td, tr, etc.)
			const bgColorElements = document.querySelectorAll("[bgcolor]");
			for (const el of Array.from(bgColorElements)) {
				const bgcolor = el.getAttribute("bgcolor");
				if (!bgcolor?.trim()) continue;

				const selector = getCssPath(el);
				blocks.push(
					`/* bgcolor attribute from: <${el.tagName.toLowerCase()}> */\n${selector} {\n  background-color: ${bgcolor};\n}`,
				);
			}

			// Extract color attribute (font, body, etc.)
			const colorElements = document.querySelectorAll("[color]");
			for (const el of Array.from(colorElements)) {
				const color = el.getAttribute("color");
				if (!color?.trim()) continue;

				const selector = getCssPath(el);
				blocks.push(
					`/* color attribute from: <${el.tagName.toLowerCase()}> */\n${selector} {\n  color: ${color};\n}`,
				);
			}

			// Extract link colors from body element (link, vlink, alink)
			const body = document.querySelector("body");
			if (body) {
				const link = body.getAttribute("link");
				const vlink = body.getAttribute("vlink");
				const alink = body.getAttribute("alink");

				if (link?.trim()) {
					blocks.push(
						`/* link attribute from body */\na:link {\n  color: ${link};\n}`,
					);
				}
				if (vlink?.trim()) {
					blocks.push(
						`/* vlink attribute from body */\na:visited {\n  color: ${vlink};\n}`,
					);
				}
				if (alink?.trim()) {
					blocks.push(
						`/* alink attribute from body */\na:active {\n  color: ${alink};\n}`,
					);
				}
			}

			return blocks.join("\n\n");
		});

		chunks.push({
			label: "HTML color attributes (bgcolor, color, link, vlink, alink)",
			css: htmlAttrsCss,
		});

		// 6) Prettify + assemble final CSS
		let finalCss = "";
		for (const { label, css } of chunks) {
			if (!css?.trim()) continue;
			finalCss += `\n/* ===== ${label} ===== */\n`;
			finalCss += await safeFormatCss(css, label);
		}

		// Final safety: remove any remaining lines with :; patterns
		const safeCss = finalCss
			.split("\n")
			.filter((line) => !line.includes(":;"))
			.join("\n");

		await fs.writeFile(outPath, safeCss, "utf8");
		console.log(`Wrote ${safeCss.length} chars to ${outPath}`);
	} finally {
		await context.close();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
