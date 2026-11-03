import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import raw from "../data-source/codmunity-mw4-raw.json";
import App from "./App";

async function openWeapon(query: string, label: RegExp) {
  const user = userEvent.setup();
  render(<App />);
  await user.type(await screen.findByLabelText("搜索武器"), query);
  await user.click(screen.getByRole("button", { name: label }));
  return user;
}

const favoritesPanel = () => screen.getByRole("region", { name: "收藏的挑战" });

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should show chinese weapon name, translated challenge and increment progress", async () => {
    const user = await openWeapon("Han 86", /汉86/);

    expect(screen.getByRole("heading", { name: "汉86" })).toBeInTheDocument();
    expect(screen.getByText("架枪击杀 75 名敌人")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Smoke 增加 1" }));
    expect(screen.getByLabelText("Smoke 当前进度")).toHaveValue(1);
  });

  it("should move favorite to next camo after completing it", async () => {
    const user = await openWeapon("汉86", /汉86/);
    await user.click(screen.getByRole("button", { name: "收藏 Smoke" }));
    await user.click(screen.getByRole("button", { name: /返回/ }));

    const panel = favoritesPanel();
    expect(within(panel).getByText("Smoke")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "完成" }));

    expect(within(favoritesPanel()).queryByText("Smoke")).not.toBeInTheDocument();
    expect(within(favoritesPanel()).getByText("Stormwave")).toBeInTheDocument();
  });

  it("should keep progress and favorites after reload", async () => {
    const user = await openWeapon("Han 86", /汉86/);
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

  it("should switch interface to english in settings", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "设置" }));
    await user.click(screen.getByRole("radio", { name: "English" }));
    await user.click(screen.getByRole("button", { name: /Back/ }));

    await user.type(screen.getByLabelText("Search weapons"), "Han");
    await user.click(screen.getByRole("button", { name: /Han 86/ }));
    expect(
      screen.getByText("Get 75 Enemy Kills while Mounted against Enemies"),
    ).toBeInTheDocument();
  });

  it("should update weapons from codmunity and report new ones", async () => {
    const payload = structuredClone(raw);
    payload.page.weapons.push({
      ...payload.page.weapons[0],
      WeaponName: "New Gun",
      slug: "new-gun",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "设置" }));
    await user.click(screen.getByRole("button", { name: "更新武器和迷彩" }));
    expect(await screen.findByText("更新完成：新增 1 把武器、0 个迷彩")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /返回/ }));
    await user.type(screen.getByLabelText("搜索武器"), "New Gun");
    expect(screen.getByRole("button", { name: /New Gun/ })).toBeInTheDocument();
  });

  it("should keep current data and show reason when update fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 403 })));
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "设置" }));
    await user.click(screen.getByRole("button", { name: "更新武器和迷彩" }));
    expect(await screen.findByText(/更新失败，已保留当前数据：HTTP 403/)).toBeInTheDocument();
  });

  it("should reject shortcut without modifier", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "设置" }));
    await user.click(screen.getByRole("button", { name: "显示/隐藏浮层: Alt+C" }));
    await user.keyboard("k");
    expect(screen.getByRole("alert")).toHaveTextContent("需要包含 Ctrl、Alt 或 Shift 等修饰键");

    await user.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");
    expect(screen.getByRole("button", { name: "显示/隐藏浮层: Ctrl+Shift+K" })).toBeInTheDocument();
  });
});
