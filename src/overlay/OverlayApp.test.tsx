import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OverlayApp } from "./OverlayApp";

// 浏览器环境下浮层直接读取本地进度（桌面端由主窗口通过事件推送）
function seed(overlayOpacity = 0.7) {
  localStorage.setItem(
    "cod-camo-tracker:state",
    JSON.stringify({
      completed: {},
      favorites: ["han-86:smoke", "m4:gold"],
      settings: { mode: "dmz", language: "zh", overlayOpacity },
    }),
  );
}

describe("OverlayApp", () => {
  it("should show favorite challenges read-only with background opacity", async () => {
    seed();
    render(<OverlayApp />);

    const overlay = await screen.findByRole("main", { name: "收藏的挑战" });
    expect(overlay).toHaveStyle({ "--overlay-alpha": "0.7" });
    expect(within(overlay).getByText("汉86")).toBeInTheDocument();
    expect(within(overlay).getByText("架枪击杀 75 名敌人")).toBeInTheDocument();
  });

  it("should only offer the pin while pinned and reveal controls after unpinning", async () => {
    seed();
    const user = userEvent.setup();
    render(<OverlayApp />);

    const pin = await screen.findByRole("button", { name: /解除固定/ });
    expect(pin).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("tab", { name: "多人游戏" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "降低背景不透明度" })).not.toBeInTheDocument();

    await user.click(pin);
    expect(screen.getByRole("button", { name: /固定浮层/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await user.click(screen.getByRole("button", { name: "降低背景不透明度" }));
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("should switch challenge requirements between multiplayer and DMZ", async () => {
    seed();
    const user = userEvent.setup();
    render(<OverlayApp />);

    await user.click(await screen.findByRole("button", { name: /解除固定/ }));
    await user.click(screen.getByRole("tab", { name: "多人游戏" }));
    expect(screen.getByText("架枪击杀 20 名玩家")).toBeInTheDocument();
  });

  it("should mark a favorite done after unpinning and move on to the next camo", async () => {
    seed();
    const user = userEvent.setup();
    render(<OverlayApp />);

    const overlay = await screen.findByRole("main", { name: "收藏的挑战" });
    expect(within(overlay).queryByRole("checkbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /解除固定/ }));
    await user.click(screen.getByLabelText("Smoke 已完成"));

    expect(within(overlay).queryByText("Smoke")).not.toBeInTheDocument();
    expect(within(overlay).getByText("Stormwave")).toBeInTheDocument();
  });

  it("should allow lowering background opacity to fully transparent", async () => {
    seed(0.1);
    const user = userEvent.setup();
    render(<OverlayApp />);

    await user.click(await screen.findByRole("button", { name: /解除固定/ }));
    const decrease = screen.getByRole("button", { name: "降低背景不透明度" });
    await user.click(decrease);

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(decrease).toBeDisabled();
    expect(screen.getByRole("main", { name: "收藏的挑战" })).toHaveStyle({
      "--overlay-alpha": "0",
    });
  });
});
