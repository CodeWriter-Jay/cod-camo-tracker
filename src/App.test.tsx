import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

async function openWeapon(name: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.type(await screen.findByLabelText("搜索武器"), name);
  await user.click(screen.getByRole("button", { name: new RegExp(name) }));
  return user;
}

const favoritesPanel = () => screen.getByRole("region", { name: "收藏的挑战" });

describe("App", () => {
  it("should show translated challenge and increment progress", async () => {
    const user = await openWeapon("Han 86");

    expect(screen.getByText("架枪击杀 75 名敌人")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Smoke 增加 1" }));
    expect(screen.getByLabelText("Smoke 当前进度")).toHaveValue(1);
  });

  it("should move favorite to next camo after completing it", async () => {
    const user = await openWeapon("Han 86");
    await user.click(screen.getByRole("button", { name: "收藏 Smoke" }));
    await user.click(screen.getByRole("button", { name: /返回/ }));

    const panel = favoritesPanel();
    expect(within(panel).getByText("Smoke")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "完成" }));

    expect(within(favoritesPanel()).queryByText("Smoke")).not.toBeInTheDocument();
    expect(within(favoritesPanel()).getByText("Stormwave")).toBeInTheDocument();
  });

  it("should keep progress and favorites after reload", async () => {
    const user = await openWeapon("Han 86");
    await user.click(screen.getByRole("button", { name: "Smoke 增加 1" }));
    await user.click(screen.getByRole("button", { name: "收藏 Smoke" }));

    render(<App />);
    const panels = await screen.findAllByRole("region", { name: "收藏的挑战" });
    expect(within(panels[panels.length - 1]).getByLabelText("Smoke 当前进度")).toHaveValue(1);
  });

  it("should show empty state when no weapon matches", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByLabelText("搜索武器"), "not-a-gun");
    expect(screen.getByText("没有匹配的武器")).toBeInTheDocument();
  });
});
