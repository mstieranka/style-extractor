import { createRouter } from 'sv-router';
import Home from './routes/Home.svelte';
import Extractor from './routes/Extractor.svelte';
import Cleaner from './routes/Cleaner.svelte';
import Arena from './routes/Arena.svelte';
import Gallery from './routes/Gallery.svelte';
import Layout from './routes/layout.svelte';

export const { p, navigate, isActive, route } = createRouter({
	'/': Home,
	'/extractor': Extractor,
    '/cleaner': Cleaner,
    '/arena': Arena,
    '/gallery': Gallery,
    layout: Layout,
});
