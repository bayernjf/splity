// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import App from "./App";

afterEach(cleanup);

describe("App view switching", () => {
  it("keeps the typed text when returning from card view to edit", () => {
    render(<App />);

    const input = screen.getByRole("textbox") as HTMLTextAreaElement;
    const sample = "1. 光合作用：植物利用光能\n2. 细胞分裂：一分为二";
    fireEvent.change(input, { target: { value: sample } });

    fireEvent.click(screen.getByRole("button", { name: /分割成卡片/ }));
    // card view reached
    expect(screen.getByRole("button", { name: /返回编辑/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /返回编辑/ }));
    const again = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(again.value).toBe(sample);
  });

  it("starts with an empty textarea", () => {
    render(<App />);
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(input.value).toBe("");
  });
});
