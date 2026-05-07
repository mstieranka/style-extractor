import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

const mountTarget = document.getElementById("app");
if (!mountTarget) {
	throw new Error("Mount target not found");
}

const app = mount(App, {
	target: mountTarget,
});

export default app;
