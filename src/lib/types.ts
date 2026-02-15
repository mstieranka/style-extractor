export interface ColorPalette {
  background: string | null;
  surface: string | null;
  text: string | null;
  muted: string | null;
  primary: string | null;
  primaryVariant: string | null;
  border: string | null;
  danger: string | null;
  dangerVariant: string | null;
  link: string | null;
  linkVariant: string | null;
  ring: string | null;
}

export type FontSizes = Record<string, string | null>;
