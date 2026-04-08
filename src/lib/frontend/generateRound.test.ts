import { describe, expect, it, vi } from "vitest";

vi.mock("../../paletteData", () => {
  const p = (bg: string, text: string) => ({
    background: bg,
    surface: null,
    text,
    muted: null,
    primary: null,
    primaryVariant: null,
    border: null,
    danger: null,
    dangerVariant: null,
    link: null,
    linkVariant: null,
    ring: null,
  });
  return {
    paletteData: [
      {
        name: "01-test",
        backgroundUrl: "/test1.png",
        palettes: [
          { method: "Manual", color: p("#fff", "#000") },
          { method: "LLM - test", color: p("#000", "#fff") },
          { method: "Dembrandt", color: p("#f00", "#0f0") },
        ],
      },
      {
        name: "02-test",
        backgroundUrl: "/test2.png",
        palettes: [
          { method: "Manual", color: p("#eee", "#111") },
          { method: "LLM - test", color: p("#111", "#eee") },
        ],
      },
      {
        name: "03-test",
        backgroundUrl: "/test3.png",
        palettes: [
          { method: "Manual", color: p("#abc", "#cba") },
          { method: "Dembrandt", color: p("#123", "#321") },
          { method: "LLM - test", color: p("#456", "#654") },
        ],
      },
    ],
  };
});

vi.mock("../../components/widgets", () => ({
  widgets: [
    { name: "TestWidget", component: {} },
    { name: "OtherWidget", component: {} },
    { name: "ThirdWidget", component: {} },
  ],
}));

import { generateRound } from "./generateRound";

describe("generateRound", () => {
  it("is deterministic: same inputs produce the same output", () => {
    const a = generateRound("session-abc-123", 1);
    const b = generateRound("session-abc-123", 1);

    expect(a.dataName).toBe(b.dataName);
    expect(a.backgroundUrl).toBe(b.backgroundUrl);
    expect(a.leftData.method).toBe(b.leftData.method);
    expect(a.rightData.method).toBe(b.rightData.method);
    expect(a.widget.name).toBe(b.widget.name);
  });

  it("produces different results across round numbers", () => {
    const keys = Array.from({ length: 5 }, (_, i) => {
      const r = generateRound("session-abc-123", i + 1);
      return `${r.dataName}:${r.leftData.method}:${r.rightData.method}:${r.widget.name}`;
    });
    expect(new Set(keys).size).toBeGreaterThan(1);
  });

  it("left and right methods are always different", () => {
    for (let round = 1; round <= 10; round++) {
      const { leftData, rightData } = generateRound("test-session-xyz", round);
      expect(leftData.method).not.toBe(rightData.method);
    }
  });

  it("returns a complete RoundSelection shape", () => {
    const result = generateRound("session-abc-123", 1);

    expect(typeof result.dataName).toBe("string");
    expect(typeof result.backgroundUrl).toBe("string");
    expect(result).toHaveProperty("manualPalette");
    expect(typeof result.leftData.method).toBe("string");
    expect(result.leftData.palette).toBeDefined();
    expect(typeof result.rightData.method).toBe("string");
    expect(result.rightData.palette).toBeDefined();
    expect(typeof result.widget.name).toBe("string");
    expect(result.widget.component).toBeDefined();
  });

  it("produces different results for different session IDs", () => {
    const a = generateRound("session-one", 1);
    const b = generateRound("session-two", 1);
    const aKey = `${a.dataName}:${a.leftData.method}:${a.widget.name}`;
    const bKey = `${b.dataName}:${b.leftData.method}:${b.widget.name}`;
    expect(aKey).not.toBe(bKey);
  });
});
