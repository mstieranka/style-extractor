import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

let user = $state<User | null>(null);
let loading = $state(true);

supabase.auth.getSession().then(({ data: { session } }) => {
	user = session?.user ?? null;
	loading = false;
});

supabase.auth.onAuthStateChange((_, session) => {
	user = session?.user ?? null;
});

function getRedirectTo() {
	return window.location.origin + window.location.pathname;
}

export function signInWithGitHub() {
	return supabase.auth.signInWithOAuth({
		provider: "github",
		options: { redirectTo: getRedirectTo() },
	});
}

export function signInWithGoogle() {
	return supabase.auth.signInWithOAuth({
		provider: "google",
		options: { redirectTo: getRedirectTo() },
	});
}

export function signOut() {
	return supabase.auth.signOut();
}

export function getUser() {
	return user;
}

export function isLoading() {
	return loading;
}
