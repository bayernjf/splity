// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import CardView from "./CardView";
import type { FlashCard } from "../lib/parser";

const cards: FlashCard[] = [
  { id: "1", front: "光合作用", back: "植物利用光能", source: "raw" },
  { id: "2", front: "细胞分裂", back: "一分为二", source: "raw" },
];

function isFlipped(): boolean {
  return Boolean(document.querySelector(".flashcard.flipped"));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CardView keyboard handling", () => {
  it("flips the card when Space is pressed on the card container", () => {
    const { container } = render(<CardView cards={cards} onBack={() => {}} />);
    const cardView = container.querySelector(".card-view") as HTMLElement;
    expect(isFlipped()).toBe(false);

    fireEvent.keyDown(cardView, { key: " " });

    expect(isFlipped()).toBe(true);
  });

  it("does not hijack Space on a focused control, so the button stays keyboard-activatable", () => {
    render(<CardView cards={cards} onBack={() => {}} />);
    const masterButton = screen.getByRole("button", { name: /标记掌握/ });
    masterButton.focus();

    fireEvent.keyDown(masterButton, { key: " " });

    // 容器没有翻卡，Space 留给控件自身
    expect(isFlipped()).toBe(false);
    // 键盘激活按钮仍可标记掌握
    fireEvent.click(masterButton);
    expect(screen.getByRole("button", { name: /已掌握/ })).toBeTruthy();
  });

  it("does not hijack Enter on a focused navigation control", () => {
    render(<CardView cards={cards} onBack={() => {}} />);
    const nextButton = screen.getByRole("button", { name: /下一张/ });
    nextButton.focus();

    fireEvent.keyDown(nextButton, { key: "Enter" });

    expect(isFlipped()).toBe(false);
  });

  it("keeps arrow-key navigation working while focus sits on a button", () => {
    vi.useFakeTimers();
    render(<CardView cards={cards} onBack={() => {}} />);
    const nextButton = screen.getByRole("button", { name: /下一张/ });
    nextButton.focus();

    fireEvent.keyDown(nextButton, { key: "ArrowRight" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText("2 / 2")).toBeTruthy();
  });
});
