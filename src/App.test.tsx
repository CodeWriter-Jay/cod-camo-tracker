import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("should show chinese weapon name, translated challenge and mark camo done", async () => {
    const user = await openWeapon("Han 86", /汉86/);

    expect(screen.getByRole("heading", { name: "汉86" })).toBeInTheDocument();
    expect(screen.getByText("架枪击杀 75 名敌人")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Smoke 已完成"));
    expect(screen.getByLabelText("Smoke 已完成")).toBeChecked();
  });

  it("should share completion between modes", async () => {
    const user = await openWeapon("汉86", /汉86/);
    await user.click(screen.getByLabelText("Smoke 已完成"));
    await user.click(screen.getByRole("tab", { name: "多人游戏" }));

    expect(screen.getByText("架枪击杀 20 名玩家")).toBeInTheDocument();
    expect(screen.getByLabelText("Smoke 已完成")).toBeChecked();
  });

  it("should switch favorite requirement with mode and move to next camo when done", async () => {
    const user = await openWeapon("汉86", /汉86/);
    await user.click(screen.getByRole("button", { name: "收藏 Smoke" }));
    await user.click(screen.getByRole("button", { name: /返回/ }));

    expect(within(favoritesPanel()).getByText("架枪击杀 75 名敌人")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "多人游戏" }));
    expect(within(favoritesPanel()).getByText("架枪击杀 20 名玩家")).toBeInTheDocument();

    await user.click(within(favoritesPanel()).getByLabelText("Smoke 已完成"));
    expect(within(favoritesPanel()).queryByText("Smoke")).not.toBeInTheDocument();
    expect(within(favoritesPanel()).getByText("Stormwave")).toBeInTheDocument();
  });

  it("should keep completion and favorites after reload", async () => {
    const user = await openWeapon("Han 86", /汉86/);
    await user.click(screen.getByLabelText("Stormwave 已完成"));
    await user.click(screen.getByRole("button", { name: "收藏 Smoke" }));

    render(<App />);
    const panels = await screen.findAllByRole("region", { name: "收藏的挑战" });
    expect(within(panels[panels.length - 1]).getByText("Smoke")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /汉86/ }).length).toBeGreaterThan(0);
  });

  it("should migrate counts and favorites saved by previous versions", async () => {
    localStorage.setItem(
      "cod-camo-tracker:state",
      JSON.stringify({
        progress: { "dmz:han-86:smoke": 75, "mp:han-86:stormwave": 3 },
        favorites: ["dmz:han-86:stormwave"],
        settings: { mode: "dmz", pinnedWeaponId: null },
      }),
    );
    // 收藏面板里也有“汉86”链接，按带进度的武器卡片名定位
    const user = await openWeapon("Han 86", /汉86\s*\d+\/\d+/);

    expect(screen.getByLabelText("Smoke 已完成")).toBeChecked();
    expect(screen.getByLabelText("Stormwave 已完成")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "取消收藏 Stormwave" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /返回/ }));
    expect(within(favoritesPanel()).getByText("Stormwave")).toBeInTheDocument();
  });

  it("should show empty state when no weapon matches", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByLabelText("搜索武器"), "not-a-gun");
    expect(screen.getByText("没有匹配的武器")).toBeInTheDocument();
  });

  it("should keep weapon filters after returning from weapon detail and clear them at once", async () => {
    const user = userEvent.setup();
    render(<App />);
    const categories = await screen.findByRole("group", { name: "武器类别" });
    await user.click(within(categories).getByRole("button", { name: "突击步枪" }));
    await user.click(within(categories).getByRole("button", { name: "冲锋枪" }));
    await user.selectOptions(screen.getByLabelText("按迷彩筛选未完成武器"), "gold");

    expect(screen.getByRole("button", { name: /ISO夜影\s*\d+\/\d+/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ISO夜影\s*\d+\/\d+/ }));
    await user.click(screen.getByLabelText("Gold 已完成"));
    await user.click(screen.getByRole("button", { name: /返回/ }));

    // 返回后列表重新挂载，需重新查询
    const categoriesAfterBack = screen.getByRole("group", { name: "武器类别" });
    expect(within(categoriesAfterBack).getByRole("button", { name: "冲锋枪" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("按迷彩筛选未完成武器")).toHaveValue("gold");
    // 已完成黄金的武器不再出现在“未完成 Gold”结果中
    expect(screen.queryByRole("button", { name: /ISO夜影\s*\d+\/\d+/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /玄铁/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "清除筛选" }));
    expect(screen.getByRole("button", { name: "全部类别", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ISO夜影\s*\d+\/\d+/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除筛选" })).toBeDisabled();
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
    await user.click(screen.getByRole("button", { name: "显示/隐藏窗口: Alt+C" }));
    await user.keyboard("k");
    expect(screen.getByRole("alert")).toHaveTextContent("需要包含 Ctrl、Alt 或 Shift 等修饰键");

    await user.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");
    expect(screen.getByRole("button", { name: "显示/隐藏窗口: Ctrl+Shift+K" })).toBeInTheDocument();
  });

  it("should adjust overlay background opacity and remember it", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "设置" }));
    fireEvent.change(screen.getByRole("slider", { name: /背景不透明度/ }), {
      target: { value: "0.5" },
    });

    expect(screen.getByText("50%")).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem("cod-camo-tracker:state") ?? "{}");
    expect(saved.settings.overlayOpacity).toBe(0.5);
  });

  it("should explain why export script is unavailable when nothing is missing", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "设置" }));

    expect(screen.getByRole("button", { name: "复制导出脚本" })).toBeDisabled();
    expect(screen.getByText(/当前所有图片都已离线保存，无需导出/)).toBeInTheDocument();
  });

  it("should allow clearing a shortcut", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "设置" }));
    const [clearWindowShortcut] = screen.getAllByRole("button", { name: "清空" });
    await user.click(clearWindowShortcut);

    expect(screen.getByRole("button", { name: "显示/隐藏窗口: 未设置" })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem("cod-camo-tracker:state") ?? "{}");
    expect(saved.settings.shortcuts).toEqual({ toggleWindow: "", toggleOverlay: "Alt+X" });
  });

  it("should migrate shortcuts saved by 1.0.0", async () => {
    localStorage.setItem(
      "cod-camo-tracker:state",
      JSON.stringify({
        completed: {},
        favorites: [],
        settings: {
          mode: "dmz",
          shortcuts: { toggleOverlay: "Ctrl+1", toggleClickThrough: "Ctrl+2" },
        },
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "设置" }));

    expect(screen.getByRole("button", { name: "显示/隐藏窗口: Ctrl+1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "显示/隐藏浮层: Ctrl+2" })).toBeInTheDocument();
  });
});
