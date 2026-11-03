/** 把 codmunity 的英文挑战描述按词组规则翻译为中文；遇到未覆盖的句式返回 null */

// 句式不规则、无法用词组规则覆盖的描述
const SPECIAL_TRANSLATIONS: Record<string, string> = {
  "Get 2500 Tier 3+ enemy kills": "击杀 2500 名 3 级及以上敌人",
  "Exfil 2 LT dog tags in a single deployment 50 times":
    "单次部署中带 2 个中尉狗牌撤离，达成 50 次",
  "Get 25000 Kills using Legendary Weapons on a Max Level Operator":
    "使用满级干员和传说武器击杀 25000 次",
};

// [匹配正则, 中文前缀]，按顺序拼接为“条件 + 击杀方式”
const CONDITIONS: [string, string][] = [
  ["in a single match in dmz", "DMZ 单局内"],
  ["in a single match", "单场内"],
  ["in a match", "单场内"],
  ["without dying", "不阵亡"],
  ["without taking damage", "不受伤"],
  ["without reloading", "不换弹"],
  ["without releasing the trigger", "不松开扳机"],
  ["(?:within|in) 5 seconds", "5 秒内"],
  ["from behind", "从背后"],
  ["while prone", "卧倒时"],
  ["while crouched", "蹲下时"],
  ["while jumping", "跳跃时"],
  ["while moving", "移动时"],
  ["while focused", "专注状态下"],
  ["while (?:aiming down sights?|ads)", "开镜时"],
  ["(?:while )?using a silencer", "装配消音器"],
  ["while using akimbo", "双持时"],
  ["while ledge hanging", "悬挂边缘时"],
  ["using the heavy melee finisher", "用重击终结技"],
  ["with miri 40mm grenade launcher", "用 Miri 40MM 榴弹发射器"],
  ["while mounted", "架枪"],
];

const KILL_KINDS: [string, string][] = [
  ["headshot kills|headshots", "爆头"],
  ["hipfire kills", "腰射"],
  ["longshot kills", "远距离"],
  ["mounted kills", "架枪"],
  ["point blank kills", "近身"],
  ["quickscope kills", "快速开镜"],
  ["one shot kills", "一枪"],
  ["direct shot kills", "直接命中"],
  ["kills", ""],
];

export function translateChallenge(text: string): string | null {
  const special = SPECIAL_TRANSLATIONS[text];
  if (special) return special;

  const level = /^Reach Weapon Level (\d+)$/.exec(text);
  if (level) return `武器等级达到 ${level[1]} 级`;
  const destroy = /^Destroy (\d+) Killstreaks or Vehicles$/.exec(text);
  if (destroy) return `摧毁 ${destroy[1]} 个连杀奖励或载具`;

  let rest = text.toLowerCase();
  const timesMatch = / (\d+) times/.exec(rest);
  const times = timesMatch?.[1] ?? null;
  if (timesMatch) rest = rest.replace(timesMatch[0], "");

  let target = "";
  if (/against players|\bplayers?\b/.test(rest)) target = "玩家";
  else if (/against enemies|\benem(?:y|ies)\b/.test(rest)) target = "敌人";
  rest = rest.replace(/\s*\b(?:against players|against enemies|players?|enem(?:y|ies))\b/g, "");

  const getMatch = /^get (\d+) (.+)$/.exec(rest.trim());
  if (!getMatch) return null;
  const count = getMatch[1];
  rest = ` ${getMatch[2]} `;
  const withTimes = (body: string) => (times ? `${body}，达成 ${times} 次` : body);

  if (rest.trim() === "double kills") {
    return withTimes(target ? `对${target}达成 ${count} 次双杀` : `达成 ${count} 次双杀`);
  }

  let prefix = "";
  for (const [pattern, label] of CONDITIONS) {
    const regex = new RegExp(` ${pattern} `);
    if (regex.test(rest)) {
      prefix += label;
      rest = rest.replace(regex, " ");
    }
  }
  const kind = KILL_KINDS.find(([pattern]) => new RegExp(`^\\s*(?:${pattern})\\s*$`).test(rest));
  if (!kind) return null;
  prefix += kind[1];

  if (target) return withTimes(`${prefix}击杀 ${count} 名${target}`);
  // 未区分目标时，按“单次连续击杀若干人”或“累计击杀次数”两种语义表达
  return withTimes(times ? `${prefix}击杀 ${count} 人` : `${prefix}击杀 ${count} 次`);
}

/** 挑战需完成的次数：带 “N times” 的取 N，单场类与升级类为 1，其余取首个数字 */
export function parseTarget(text: string): number {
  if (text.startsWith("Reach Weapon Level") || text.includes("single match")) return 1;
  const times = /(\d+) times/.exec(text);
  if (times) return Number(times[1]);
  const first = /\d+/.exec(text);
  return first ? Number(first[0]) : 1;
}
