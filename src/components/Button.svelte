<script lang="ts">
  import {
    IconLoader2,
    type Icon as IconType,
  } from "@tabler/icons-svelte-runes";
  import type { Snippet } from "svelte";

  type Variant = "primary" | "outline" | "ghost";
  type Size = "sm" | "md";

  interface ButtonProps {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    loading?: boolean;
    type?: "button" | "submit" | "reset";
    icon?: IconType;
    iconPosition?: "left" | "right";
    onclick?: (e: MouseEvent) => void;
    class?: string;
    children: Snippet;
    [key: string]: unknown;
  }

  let {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    type = "button",
    onclick,
    class: extraClass,
    children,
    icon: Icon,
    iconPosition = "left",
    ...rest
  }: ButtonProps = $props();

  const base =
    "inline-flex items-center justify-center gap-2 rounded transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses: Record<Variant, string> = {
    primary: "bg-purple-500 text-white hover:bg-purple-600",
    outline:
      "border border-purple-700 text-purple-700 hover:bg-purple-100 hover:text-purple-900",
    ghost: "text-gray-500 hover:text-gray-700",
  };

  const sizeClasses: Record<Size, string> = {
    sm: "text-sm px-3 py-1",
    md: "px-4 py-2",
  };

  let classes = $derived(
    `${base} ${variantClasses[variant]} ${sizeClasses[size]}${extraClass ? ` ${extraClass}` : ""}`,
  );
</script>

{#snippet icon()}
  {#if loading}
    <IconLoader2 class="animate-spin" size={size === "sm" ? 16 : 20} />
  {:else if Icon}
    <Icon size={size === "sm" ? 16 : 20} />
  {/if}
{/snippet}

<button
  {type}
  disabled={disabled || loading}
  aria-busy={loading}
  class={classes}
  {onclick}
  {...rest}
>
  {#if iconPosition === "left"}
    {@render icon()}
  {/if}
  {@render children()}
  {#if iconPosition === "right"}
    {@render icon()}
  {/if}
</button>
