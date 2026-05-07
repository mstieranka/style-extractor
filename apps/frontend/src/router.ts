import { createRouter } from "sv-router";
import PageNotFound from "./routes/404.svelte";
import Arena from "./routes/Arena.svelte";
import Cleaner from "./routes/Cleaner.svelte";
import Extractor from "./routes/Extractor.svelte";
import Gallery from "./routes/Gallery.svelte";
import Home from "./routes/Home.svelte";
import Layout from "./routes/layout.svelte";

export const { p, navigate, isActive, route } = createRouter({
	"/": Home,
	"/extractor": Extractor,
	"/cleaner": Cleaner,
	"/arena": Arena,
	"/gallery": Gallery,
	"*": PageNotFound,
	layout: Layout,
});
