// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getKeyboardInset } from "./useKeyboardInset.ts";

describe("getKeyboardInset", () => {
  let originalInnerHeight: number;
  let originalVisualViewport: VisualViewport | null;

  beforeEach(() => {
    originalInnerHeight = window.innerHeight;
    originalVisualViewport = window.visualViewport;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
      writable: true,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport,
      writable: true,
    });
  });

  it("returns 0 when visualViewport is unavailable", () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: null,
      writable: true,
    });

    expect(getKeyboardInset()).toBe(0);
  });

  it("computes inset from viewport height", () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { height: 500, offsetTop: 0 },
      writable: true,
    });

    expect(getKeyboardInset()).toBe(300);
  });

  it("accounts for iOS Safari offsetTop", () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { height: 500, offsetTop: 40 },
      writable: true,
    });

    expect(getKeyboardInset()).toBe(260);
  });

  it("never returns a negative inset", () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { height: 900, offsetTop: 0 },
      writable: true,
    });

    expect(getKeyboardInset()).toBe(0);
  });
});
