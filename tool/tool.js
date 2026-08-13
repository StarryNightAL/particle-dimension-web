// ============================================================
// 文件名: toolcall.js
// 说明: 动态创建整个 UI，并调用 melee_damage_calculator.js 进行计算
// ============================================================

import { calculateMeleeDamage } from './melee_damage_calculator.js';

// ---------- 1. 注入工具专属样式（仅作用于 #tool-app，主题与 Wiki 保持一致） ----------
const style = document.createElement('style');
style.textContent = `
    #tool-app {
        font-family: var(--font-main, 'Segoe UI', Tahoma, sans-serif);
        color: #e0e0f0;
        width: 100%;
    }
    /* 平铺到整个卡片：透明容器 + 两列网格 */
    #tool-app .container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px 16px;
        align-items: start;
        padding: 0;
        background: transparent;
        border: none;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
    }
    #tool-app h1,
    #tool-app .sub,
    #tool-app .row,
    #tool-app .btn-calc,
    #tool-app .result-box,
    #tool-app .note {
        grid-column: 1 / -1;
    }
    #tool-app h1 {
        text-align: center;
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 8px;
        color: #fff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 12px;
    }
    #tool-app .sub {
        text-align: center;
        font-size: 0.75rem;
        color: var(--text-secondary, #b0b0c8);
        margin-top: -4px;
        margin-bottom: 18px;
    }
    #tool-app .input-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;
    }
    #tool-app .input-group label {
        font-size: 0.88rem;
        font-weight: 600;
        margin-bottom: 4px;
        color: #c8c8dc;
    }
    #tool-app .input-group input, #tool-app .input-group select {
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(10, 10, 20, 0.6);
        color: #fff;
        font-size: 1.02rem;
        outline: none;
        transition: 0.2s;
        font-family: inherit;
    }
    #tool-app .input-group input:focus, #tool-app .input-group select:focus {
        border-color: var(--accent-cyan, #5eeadb);
        box-shadow: 0 0 8px rgba(94, 234, 219, 0.25);
    }
    #tool-app .row {
        display: flex;
        gap: 14px;
    }
    #tool-app .row .input-group {
        flex: 1;
    }
    #tool-app .btn-calc {
        width: 100%;
        padding: 10px;
        font-size: 1.02rem;
        font-weight: 700;
        font-family: inherit;
        background: rgba(94, 234, 219, 0.12);
        color: var(--accent-cyan, #5eeadb);
        border: 1px solid rgba(94, 234, 219, 0.35);
        border-radius: 10px;
        cursor: pointer;
        transition: 0.2s;
        margin-top: 4px;
    }
    #tool-app .btn-calc:hover {
        background: rgba(94, 234, 219, 0.22);
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(94, 234, 219, 0.25);
    }
    #tool-app .btn-calc:active {
        transform: scale(0.97);
    }
    #tool-app .result-box {
        margin-top: 18px;
        background: rgba(10, 10, 20, 0.6);
        padding: 14px 18px;
        border-radius: 12px;
        border-left: 4px solid var(--accent-cyan, #5eeadb);
        text-align: center;
    }
    #tool-app .result-box .label {
        font-size: 0.82rem;
        color: var(--text-secondary, #b0b0c8);
        display: block;
        margin-bottom: 4px;
    }
    #tool-app .result-box .value {
        font-size: 1.85rem;
        font-weight: 700;
        color: var(--accent-gold, #fbbf24);
    }
    #tool-app .result-box .value.negative {
        color: #ef5350;
    }
    #tool-app .note {
        font-size: 0.78rem;
        color: var(--text-secondary, #b0b0c8);
        text-align: center;
        margin-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 10px;
    }
    #tool-app .badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.08);
        padding: 1px 8px;
        border-radius: 20px;
        font-size: 0.72rem;
        margin-left: 6px;
        color: #bbb;
        font-weight: 400;
    }
    /* 窄屏回退为单列 */
    @media (max-width: 640px) {
        #tool-app .container {
            grid-template-columns: 1fr;
        }
        #tool-app h1,
        #tool-app .sub,
        #tool-app .row,
        #tool-app .btn-calc,
        #tool-app .result-box,
        #tool-app .note {
            grid-column: auto;
        }
    }
`;
document.head.appendChild(style);

// ---------- 2. 构建根容器（挂载到 index.html 提供的 #tool-app 宿主） ----------
const host = document.getElementById('tool-app');
const container = host || document.createElement('div');
if (!host) {
    // 兜底：无宿主元素时（如独立调试），回退到 body 居中布局
    container.className = 'container';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.padding = '20px';
    document.body.appendChild(container);
} else {
    container.classList.add('container');
}

// ---------- 3. 标题 ----------
const title = document.createElement('h1');
title.textContent = '⚔️ 基岩版近战伤害';
container.appendChild(title);

// 副标题已按要求删除

// ---------- 4. 下拉选项数据（⚠️ 部分为占位数据，待提供实际数值后替换） ----------
const OPTIONS = {
    base: {
        label: '🔰 基础伤害',
        options: [
            { value: '1', label: '玩家(1)' },
        ],
        default: '1',
    },
    weapon: {
        label: '🗡️ 武器附加伤害',
        options: [
            { value: '0', label: '无(0)' },
            { value: '7', label: '钻石剑(+7)' },
        ],
        default: '7',
    },
};

// 附魔类型选项
const ENCHANT_TYPES = [
    { value: 'none',    label: '无附魔' },
    { value: 'sharpness', label: '锋利' },
    { value: 'smite',   label: '亡灵杀手' },
    { value: 'bane_of_arthropods', label: '节肢杀手' },
    { value: 'impaling', label: '穿刺' },
];

// 生物类型选项（决定附魔条件是否生效）
const TARGET_TYPES = [
    { value: 'normal',    label: '普通生物' },
    { value: 'water',     label: '接触水的生物' },
    { value: 'undead',    label: '亡灵生物' },
    { value: 'arthropod', label: '节肢生物' },
];

// ---------- 附魔附加伤害算式 ----------
// n = 附魔等级（向下取整）；部分附魔带目标条件
// 锋利：1.25n（无条件）
// 亡灵杀手：2.5n（目标为亡灵生物）
// 节肢杀手：2.5n（目标为节肢生物）
// 穿刺：2.5n（接触水或雨水）
function calcEnchantBonus(enchantType, level, targetType) {
    const n = Math.floor(level);  // 向下取整
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

// ---------- 5. 创建下拉组（工厂函数，支持 {value,label} 或字符串选项） ----------
function createSelectGroup(labelText, options, defaultValue, extraAttrs = {}) {
    const group = document.createElement('div');
    group.className = 'input-group';

    const label = document.createElement('label');
    label.innerHTML = labelText;  // 允许包含 HTML 标签（如 badge）
    group.appendChild(label);

    const select = document.createElement('select');
    for (const opt of options) {
        const o = document.createElement('option');
        if (typeof opt === 'object' && opt !== null) {
            o.value = opt.value;
            o.textContent = opt.label;
        } else {
            o.value = opt;
            o.textContent = opt;
        }
        select.appendChild(o);
    }
    if (defaultValue !== undefined && defaultValue !== '') select.value = defaultValue;
    for (const [key, val] of Object.entries(extraAttrs)) {
        select.setAttribute(key, val);
    }
    group.appendChild(select);

    return group;
}

// ---------- 6. 第一行：基础伤害 / 武器附加伤害 / 暴击（3 个） ----------
const row1 = document.createElement('div');
row1.className = 'row';

const baseSelect = createSelectGroup(
    OPTIONS.base.label,
    OPTIONS.base.options,
    OPTIONS.base.default,
    { id: 'baseDamage' }
);
const weaponSelect = createSelectGroup(
    OPTIONS.weapon.label,
    OPTIONS.weapon.options,
    OPTIONS.weapon.default,
    { id: 'weaponBonus' }
);

// 暴击下拉
const criticalGroup = document.createElement('div');
criticalGroup.className = 'input-group';
const criticalLabel = document.createElement('label');
criticalLabel.textContent = '💥 暴击';
criticalGroup.appendChild(criticalLabel);
const criticalSelect = document.createElement('select');
criticalSelect.id = 'criticalLevel';
criticalSelect.innerHTML = `
    <option value="true">✅ 触发</option>
    <option value="false">❌ 未触发</option>
`;
criticalGroup.appendChild(criticalSelect);

row1.appendChild(baseSelect);
row1.appendChild(weaponSelect);
row1.appendChild(criticalGroup);
container.appendChild(row1);

// ---------- 7. 第二行：力量等级 / 虚弱等级 / 版本规则（3 个同行） ----------
function createNumberGroup(labelText, id, defaultValue, extraAttrs = {}) {
    const group = document.createElement('div');
    group.className = 'input-group';
    const label = document.createElement('label');
    label.textContent = labelText;
    group.appendChild(label);
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultValue;
    for (const [key, val] of Object.entries(extraAttrs)) {
        input.setAttribute(key, val);
    }
    group.appendChild(input);
    return group;
}

const row2 = document.createElement('div');
row2.className = 'row';

const strengthGroup = createNumberGroup('💪 力量等级', 'strengthLevel', '3', { min: '0', max: '255', step: '1' });
const weaknessGroup = createNumberGroup('🥀 虚弱等级', 'weaknessLevel', '1', { min: '0', max: '255', step: '1' });

// 版本下拉（与力量、虚弱同行）
const versionGroup = document.createElement('div');
versionGroup.className = 'input-group';
const versionLabel = document.createElement('label');
versionLabel.textContent = '📅 版本规则';
versionGroup.appendChild(versionLabel);
const versionSelect = document.createElement('select');
versionSelect.id = 'versionRule';
versionSelect.innerHTML = `
    <option value="new">✅ 1.21.110.20 及之后</option>
    <option value="old">🕰️ 1.21.110.20 之前</option>
`;
versionGroup.appendChild(versionSelect);

row2.appendChild(strengthGroup);
row2.appendChild(weaknessGroup);
row2.appendChild(versionGroup);
container.appendChild(row2);

// ---------- 8. 第三行：附魔类型 / 等级 / 生物类型（3 个并排） ----------
const row3 = document.createElement('div');
row3.className = 'row';

// 附魔类型下拉
const enchantTypeGroup = document.createElement('div');
enchantTypeGroup.className = 'input-group';
const enchantTypeLabel = document.createElement('label');
enchantTypeLabel.textContent = '✨ 附魔';
enchantTypeGroup.appendChild(enchantTypeLabel);
const enchantTypeSelect = document.createElement('select');
enchantTypeSelect.id = 'enchantType';
for (const opt of ENCHANT_TYPES) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    enchantTypeSelect.appendChild(o);
}
enchantTypeGroup.appendChild(enchantTypeSelect);
row3.appendChild(enchantTypeGroup);

// 附魔等级输入（0~5）
const enchantLevelGroup = document.createElement('div');
enchantLevelGroup.className = 'input-group';
const enchantLevelLabel = document.createElement('label');
enchantLevelLabel.textContent = '🔢 附魔等级';
enchantLevelGroup.appendChild(enchantLevelLabel);
const enchantLevelInput = document.createElement('input');
enchantLevelInput.type = 'number';
enchantLevelInput.id = 'enchantLevel';
enchantLevelInput.value = '3';
enchantLevelInput.min = '0';
enchantLevelInput.max = '5';
enchantLevelInput.step = '1';
enchantLevelGroup.appendChild(enchantLevelInput);
row3.appendChild(enchantLevelGroup);

// 生物类型下拉（决定附魔条件是否生效）
const targetGroup = document.createElement('div');
targetGroup.className = 'input-group';
const targetLabel = document.createElement('label');
targetLabel.textContent = '🧟 生物类型';
targetGroup.appendChild(targetLabel);
const targetSelect = document.createElement('select');
targetSelect.id = 'targetType';
for (const opt of TARGET_TYPES) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    targetSelect.appendChild(o);
}
targetGroup.appendChild(targetSelect);
row3.appendChild(targetGroup);
container.appendChild(row3);

// ---------- 9. 计算按钮 ----------
const calcBtn = document.createElement('button');
calcBtn.className = 'btn-calc';
calcBtn.textContent = '🔢 计算伤害';
container.appendChild(calcBtn);

// ---------- 10. 结果显示区域 ----------
const resultBox = document.createElement('div');
resultBox.className = 'result-box';
resultBox.id = 'resultDisplay';
resultBox.innerHTML = `
    <span class="label">⚡ 最终造成伤害</span>
    <div class="value" id="damageValue">--</div>
    <div style="font-size:15px; color:#aaa; margin-top:4px;" id="detailInfo">等待计算...</div>
    <div style="font-size:13px; color:var(--accent-gold, #fbbf24); margin-top:6px; line-height:1.7;" id="clampInfo" hidden></div>
`;
container.appendChild(resultBox);

// 底部备注
const note = document.createElement('div');
note.className = 'note';
note.textContent = '💡 若结果为负值，游戏内将不造成伤害 (强制归零)';
container.appendChild(note);

// ---------- 11. 引用输入元素（用于事件） ----------
const baseInput = document.getElementById('baseDamage');
const weaponInput = document.getElementById('weaponBonus');
// 注：enchantTypeSelect / enchantLevelInput / targetSelect 已在第 8 节构建时声明，此处直接复用
const strengthInput = document.getElementById('strengthLevel');
const weaknessInput = document.getElementById('weaknessLevel');
const versionSelectEl = document.getElementById('versionRule');
const criticalSelectEl = document.getElementById('criticalLevel');

// 结果元素
const damageValue = document.getElementById('damageValue');
const detailInfo = document.getElementById('detailInfo');
const clampInfo = document.getElementById('clampInfo');

// ---------- 12. 核心计算函数 ----------
// 数值钳制：小于0视为0，大于255视为255
function clampInt(value, min = 0, max = 255) {
    let v = parseInt(value, 10);
    if (Number.isNaN(v)) v = 0;
    return Math.max(min, Math.min(max, v));
}

function performCalculation() {
    const corrections = [];

    // 基础攻击力 = 基础伤害 + 武器附加伤害
    const base = parseInt(baseInput.value) || 0;
    const weapon = parseInt(weaponInput.value) || 0;
    const B = base + weapon;

    // 附魔等级：向下取整并钳制到 0~5，附魔附加伤害由算式实时计算
    const rawLevel = parseFloat(enchantLevelInput.value);
    const eLevel = clampEnchantLevel(rawLevel);
    if (!Number.isNaN(rawLevel) && rawLevel !== eLevel) {
        corrections.push(`附魔等级已修正：${rawLevel} → ${eLevel}（向下取整，限制 0~5）`);
    }
    const eType = enchantTypeSelect.value;
    const M = calcEnchantBonus(eType, eLevel, targetSelect.value);

    // 力量 / 虚弱：向下取整并钳制到 0~255
    const rawP = parseFloat(strengthInput.value);
    const p = clampInt(strengthInput.value);
    if (!Number.isNaN(rawP) && rawP !== p) {
        corrections.push(`力量等级已修正：${rawP} → ${p}（向下取整，限制 0~255）`);
    }
    const rawW = parseFloat(weaknessInput.value);
    const w = clampInt(weaknessInput.value);
    if (!Number.isNaN(rawW) && rawW !== w) {
        corrections.push(`虚弱等级已修正：${rawW} → ${w}（向下取整，限制 0~255）`);
    }

    const version = versionSelectEl.value;
    const critical = criticalSelectEl.value === 'true';

    // 显示钳制 / 取整提示
    clampInfo.innerHTML = corrections.join('<br>');
    clampInfo.hidden = corrections.length === 0;

    const result = calculateMeleeDamage(B, M, p, w, version, critical);

    const finalVal = result.final;
    const preVal = result.preCritical;

    if (finalVal <= 0) {
        damageValue.className = 'value negative';
        damageValue.textContent = '0 ❌ (无伤害)';
    } else {
        damageValue.className = 'value';
        damageValue.textContent = finalVal.toFixed(4);
    }

    if (critical) {
        detailInfo.textContent = `暴击前: ${preVal.toFixed(4)}  →  暴击后 (×1.5): ${finalVal.toFixed(4)}`;
    } else {
        detailInfo.textContent = `未暴击，最终伤害: ${finalVal.toFixed(4)}`;
    }
}

// ---------- 13. 绑定事件 ----------
calcBtn.addEventListener('click', performCalculation);

// 附魔等级钳制：向下取整，低于0视为0，高于5视为5
function clampEnchantLevel(value) {
    let v = Math.floor(parseFloat(value) || 0);
    return Math.max(0, Math.min(5, v));
}

// 回车支持（限定在工具容器内，避免误触页面其他元素）
(host || document).querySelectorAll('input, select').forEach(el => {
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performCalculation();
        }
    });
});

// 初始化：自动计算一次
performCalculation();