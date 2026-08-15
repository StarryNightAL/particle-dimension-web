// ============================================================
// 文件名: melee_damage_calculator.js
// 说明: 基岩版近战伤害计算引擎（纯逻辑 + 数据，无 UI 依赖）
//       通过统一的 meleeDamageTool 定义导出，供 tool.js 泛化渲染与调用。
//       新增工具时，可仿照本文件新建计算模块并导出同构的 tool 定义。
// ============================================================

// ---------- 1. 下拉选项数据 ----------
export const BASE_OPTIONS = [
    { value: '1', label: '玩家(1)' },
];
export const WEAPON_OPTIONS = [
    { value: '0', label: '无(0)' },
    { value: '7', label: '钻石剑(+7)' },
    { value: '8', label: '三叉戟(+8)' },
];
export const ENCHANT_TYPES = [
    { value: 'none',    label: '无附魔' },
    { value: 'sharpness', label: '锋利' },
    { value: 'smite',   label: '亡灵杀手' },
    { value: 'bane_of_arthropods', label: '节肢杀手' },
    { value: 'impaling', label: '穿刺' },
];
export const TARGET_TYPES = [
    { value: 'normal',    label: '普通生物' },
    { value: 'water',     label: '接触水的生物' },
    { value: 'undead',    label: '亡灵生物' },
    { value: 'arthropod', label: '节肢生物' },
];
export const VERSION_OPTIONS = [
    { value: 'new', label: '✅ 1.21.110.20 及之后' },
    { value: 'old', label: '🕰️ 1.21.110.20 之前' },
];
export const CRITICAL_OPTIONS = [
    { value: 'true',  label: '✅ 触发' },
    { value: 'false', label: '❌ 未触发' },
];

// ---------- 2. 数值工具 ----------
// 钳制：解析为整数（向下取整），空/非法视为 0
function clampInt(value, min = 0, max = 255) {
    let v = parseInt(value, 10);
    if (Number.isNaN(v)) v = 0;
    return Math.max(min, Math.min(max, v));
}

// 附魔等级：向下取整，低于 0 视为 0，高于 5 视为 5
function clampEnchantLevel(value) {
    let v = Math.floor(parseFloat(value) || 0);
    return Math.max(0, Math.min(5, v));
}

// ---------- 3. 附魔附加伤害算式 ----------
// n = 附魔等级（向下取整）；部分附魔带目标条件
// 锋利：1.25n（无条件）
// 亡灵杀手：2.5n（目标为亡灵生物）
// 节肢杀手：2.5n（目标为节肢生物）
// 穿刺：2.5n（接触水或雨水）
export function calcEnchantBonus(enchantType, level, targetType) {
    const n = Math.floor(level);
    switch (enchantType) {
        case 'sharpness':
            return 1.25 * n;
        case 'smite':
            return targetType === 'undead' ? 2.5 * n : 0;
        case 'bane_of_arthropods':
            return targetType === 'arthropod' ? 2.5 * n : 0;
        case 'impaling':
            return targetType === 'water' ? 2.5 * n : 0;
        default:
            return 0;  // 无附魔
    }
}

// ---------- 4. 核心近战伤害计算 ----------
// B 基础攻击力 / M 附魔附加伤害 / p 力量等级 / w 虚弱等级 / version 版本 / critical 是否暴击
// 结算顺序：状态效果在魔咒之后、暴击之前
// 虚弱：d_n = 0.8^n * d0 + (0.8^n - 1) / 0.4
// 力量：d_n = 1.3^n * d0 + (1.3^n - 1) / 0.3
// 同时存在时：先按力量公式，结果作为 d0 再按虚弱公式处理
// 规则：任一状态效果钳制后等级为 0，则跳过对应公式（不调用合并计算）
export function calculateMeleeDamage(B, M, p, w, version, critical) {
    let d0 = (version === 'new') ? (B + M) : B;

    // 先力量：d = 1.3^p * d0 + (1.3^p - 1) / 0.3（力量等级为 0 时跳过）
    if (p > 0) {
        const strMult = Math.pow(1.3, p);
        d0 = strMult * d0 + (strMult - 1) / 0.3;
    }
    // 后虚弱：将力量结果作为 d0，按 d = 0.8^w * d0 + (0.8^w - 1) / 0.4 处理（虚弱等级为 0 时跳过）
    if (w > 0) {
        const weakMult = Math.pow(0.8, w);
        d0 = weakMult * d0 + (weakMult - 1) / 0.4;
    }

    let damage = d0;

    if (version === 'old') {
        damage += M;
    }

    const rawPreCritical = damage;
    if (critical) {
        damage *= 1.5;
    }

    const preCritical = Math.max(0, rawPreCritical);
    const finalDamage = Math.max(0, damage);

    return { preCritical, final: finalDamage };
}

// ---------- 5. 高层计算入口：接收 UI 原始输入，返回完整结果 ----------
// input: { base, weapon, critical, strength, weakness, version, enchantType, enchantLevel, targetType }
// 返回:  { final, preCritical, critical, B, M, p, w, corrections }
function calculateMelee(input) {
    const corrections = [];

    // 基础攻击力 = 基础伤害 + 武器附加伤害
    const B = (parseInt(input.base, 10) || 0) + (parseInt(input.weapon, 10) || 0);

    // 附魔等级：向下取整并钳制到 0~5，附魔附加伤害由算式实时计算
    const rawLevel = parseFloat(input.enchantLevel);
    const eLevel = clampEnchantLevel(rawLevel);
    if (!Number.isNaN(rawLevel) && rawLevel !== eLevel) {
        corrections.push(`附魔等级已修正：${rawLevel} → ${eLevel}（向下取整，限制 0~5）`);
    }
    const M = calcEnchantBonus(input.enchantType, eLevel, input.targetType);

    // 力量 / 虚弱：向下取整并钳制到 0~255
    const rawP = parseFloat(input.strength);
    const p = clampInt(input.strength);
    if (!Number.isNaN(rawP) && rawP !== p) {
        corrections.push(`力量等级已修正：${rawP} → ${p}（向下取整，限制 0~255）`);
    }
    const rawW = parseFloat(input.weakness);
    const w = clampInt(input.weakness);
    if (!Number.isNaN(rawW) && rawW !== w) {
        corrections.push(`虚弱等级已修正：${rawW} → ${w}（向下取整，限制 0~255）`);
    }

    const version = input.version;
    const critical = input.critical === 'true';

    const { preCritical, final } = calculateMeleeDamage(B, M, p, w, version, critical);

    return { final, preCritical, critical, B, M, p, w, corrections };
}

// ---------- 6. 结果展示格式化（供 tool.js 直接渲染，无 UI 依赖） ----------
// 返回 UI 层可直接使用的展示数据：主值文本/样式、详情文本、修正提示列表
function formatMeleeResult(result) {
    const finalVal = result.final;
    const preVal = result.preCritical;
    const critical = result.critical;

    let mainValue, mainClass;
    if (finalVal <= 0) {
        mainValue = '0 ❌ (无伤害)';
        mainClass = 'negative';
    } else {
        mainValue = finalVal.toFixed(4);
        mainClass = '';
    }

    let detail;
    if (critical) {
        detail = `暴击前: ${preVal.toFixed(4)}  →  暴击后 (×1.5): ${finalVal.toFixed(4)}`;
    } else {
        detail = `未暴击，最终伤害: ${finalVal.toFixed(4)}`;
    }

    return {
        mainValue,
        mainClass,
        detail,
        corrections: result.corrections,
    };
}

// ---------- 7. 工具定义（供 tool.js 泛化渲染；多工具时按需加载其他计算模块） ----------
// fields: row 决定所在行，type: 'select' | 'number'
// calculate: 原始输入 → 计算结果；formatResult: 计算结果 → 展示数据
export const meleeDamageTool = {
    id: 'melee-damage',
    title: '⚔️ 基岩版近战伤害',
    buttonText: '🔢 计算伤害',
    note: '💡 若结果为负值，游戏内将不造成伤害 (强制归零)',
    fields: [
        { key: 'base',         row: 1, type: 'select', label: '🔰 基础伤害',     options: BASE_OPTIONS,    default: '1' },
        { key: 'weapon',       row: 1, type: 'select', label: '🗡️ 武器附加伤害', options: WEAPON_OPTIONS,  default: '7' },
        { key: 'critical',     row: 1, type: 'select', label: '💥 暴击',         options: CRITICAL_OPTIONS, default: 'true' },
        { key: 'strength',     row: 2, type: 'number', label: '💪 力量等级',     default: 3, min: 0, max: 255, step: 1 },
        { key: 'weakness',     row: 2, type: 'number', label: '🥀 虚弱等级',     default: 1, min: 0, max: 255, step: 1 },
        { key: 'version',      row: 2, type: 'select', label: '📅 版本规则',     options: VERSION_OPTIONS, default: 'new' },
        { key: 'enchantType',  row: 3, type: 'select', label: '✨ 附魔',         options: ENCHANT_TYPES,   default: 'smite' },
        { key: 'enchantLevel', row: 3, type: 'number', label: '🔢 附魔等级',     default: 4, min: 0, max: 5, step: 1 },
        { key: 'targetType',   row: 3, type: 'select', label: '🧟 生物类型',     options: TARGET_TYPES,    default: 'undead' },
    ],
    calculate: calculateMelee,
    formatResult: formatMeleeResult,
};