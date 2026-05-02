import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const inputDir = "./images/widget-backgrounds";
const outputDir = "./public/widget-backgrounds";
const widths = [800, 1600, 2992];

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
	const files = fs
		.readdirSync(inputDir)
		.filter((file) => /\.(png|jpe?g)$/i.test(file));

	for (const file of files) {
		const inputPath = path.join(inputDir, file);
		const fileName = path.parse(file).name;

		for (const width of widths) {
			const isMobile = width === 800;

			// Mobile gets a 1:2.5 portrait ratio. Desktop gets a 16:10 landscape ratio.
			const height = isMobile
				? Math.round(width * 2.5)
				: Math.round(width * (10 / 16));

			const image = sharp(inputPath).resize({
				width: width,
				height: height,
				fit: "cover",
				// 'top' anchors to the top and centers horizontally.
				// Use 'left top' if you want to anchor to the top-left corner instead!
				position: "top",
			});

			// Generate AVIF
			await image
				.avif({ quality: 60 })
				.toFile(path.join(outputDir, `${fileName}-${width}w.avif`));

			// Generate WebP
			await image
				.webp({ quality: 75 })
				.toFile(path.join(outputDir, `${fileName}-${width}w.webp`));

			console.log(
				`Generated: ${fileName}-${width}w (${isMobile ? "Mobile Ratio" : "Desktop Ratio"})`,
			);
		}
	}
	console.log("✅ All responsive images optimized successfully!");
}

processImages();
