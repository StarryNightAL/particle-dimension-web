// ============================================================
// 文件名: level_exp_calculator.js
// 说明: 等级和经验值计算器（自定义渲染工具）
//       经验公式（f(x) = x 级升到下一级所需经验）：
//         f(x) = 10+(x-1)×5     (1≤x≤5,   0阶)
//         f(x) = 30+(x-5)×15    (6≤x≤10,  1阶)
//         f(x) = 105+(x-10)×20  (11≤x≤25, 2阶)
//         f(x) = 405+(x-25)×25  (26≤x≤40, 3阶)
//         f(x) = 780+(x-40)×30  (41≤x≤55, 4阶)
//         f(x) = 1230+(x-55)×35 (55≤x≤70, 5阶)
//         f(x) = 1755+(x-70)×40 (71≤x,    6阶)
//       通过 levelExpTool 定义导出，提供 render(container) 构建完整 UI。
// ============================================================

// ---------- 1. 分段经验公式数据 ----------
// base: 区间首级所需经验 f(min)，offset: 公式中的减数，step: 每级线性增量
// 注: 55 级处 4 阶与 5 阶公式结果一致（均为 1230），故 4 阶实际取 41~54，55 归入 5 阶
const TIERS = [
    { min: 1,   max: 5,   order: 0, base: 10,  offset: 1,  step: 5,  expr: '10+(x-1)×5' },
    { min: 6,   max: 10,  order: 1, base: 30,  offset: 5,  step: 15, expr: '30+(x-5)×15' },
    { min: 11,  max: 25,  order: 2, base: 105, offset: 10, step: 20, expr: '105+(x-10)×20' },
    { min: 26,  max: 40,  order: 3, base: 405, offset: 25, step: 25, expr: '405+(x-25)×25' },
    { min: 41,  max: 54,  order: 4, base: 780, offset: 40, step: 30, expr: '780+(x-40)×30' },
    { min: 55,  max: 70,  order: 5, base: 1230, offset: 55, step: 35, expr: '1230+(x-55)×35' },
    { min: 71,  max: Infinity, order: 6, base: 1755, offset: 70, step: 40, expr: '1755+(x-70)×40' },
];

// 查询等级 x 所在阶数
export function getTier(x) {
    return TIERS.find(t => x >= t.min && x <= t.max) || null;
}

// f(x)：x 级升到下一级所需经验
export function expForLevel(x) {
    const tier = getTier(x);
    if (!tier) return 0;
    return tier.base + (x - tier.offset) * tier.step;
}

// 从 from 级升到 to 级所需累计经验（含 from 级所需，不含 to 级）
export function totalExp(from, to) {
    let sum = 0;
    for (let x = from; x < to; x++) sum += expForLevel(x);
    return sum;
}

// 经验反推：当前等级 level，拥有 exp 经验，最多可升到多少级
// 返回 { toLevel, usedExp, remaining }
export function levelFromExp(level, exp) {
    let x = level;
    let remaining = exp;
    while (remaining >= expForLevel(x)) {
        remaining -= expForLevel(x);
        x++;
    }
    return { toLevel: x, usedExp: exp - remaining, remaining };
}

// ---------- 2. 工具定义（自定义渲染） ----------
export const levelExpTool = {
    id: 'level-exp',
    title: '📈 等级和经验值计算器',
    render(container) {
        // ---------- 2.1 注入局部样式（作用域到 .lexp-app） ----------
        const style = document.createElement('style');
        style.textContent = `
            .lexp-app {
                font-family: var(--font-main, 'Segoe UI', Tahoma, sans-serif);
                color: #e0e0f0;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .lexp-panel { display: flex; flex-direction: column; gap: 12px; }
            .lexp-panel + .lexp-panel {
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding-top: 8px;
            }
            .lexp-row { display: flex; gap: 14px; flex-wrap: wrap; }
            .lexp-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-size: 0.88rem;
                font-weight: 600;
                color: #c8c8dc;
                flex: 1;
                min-width: 160px;
            }
            .lexp-field input {
                padding: 8px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(10, 10, 20, 0.6);
                color: #fff;
                font-size: 1.02rem;
                outline: none;
                font-family: inherit;
                transition: 0.2s;
            }
            .lexp-field input:focus {
                border-color: var(--accent-cyan, #5eeadb);
                box-shadow: 0 0 8px rgba(94, 234, 219, 0.25);
            }
            .lexp-btn {
                align-self: flex-start;
                padding: 9px 22px;
                border-radius: 9px;
                border: 1px solid rgba(94, 234, 219, 0.35);
                background: rgba(94, 234, 219, 0.12);
                color: var(--accent-cyan, #5eeadb);
                font-size: 0.95rem;
                font-weight: 700;
                font-family: inherit;
                cursor: pointer;
                transition: 0.2s;
            }
            .lexp-btn:hover { background: rgba(94, 234, 219, 0.22); transform: scale(1.02); }
            .lexp-btn:active { transform: scale(0.97); }
            .lexp-result {
                background: rgba(10, 10, 20, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-left: 4px solid var(--accent-cyan, #5eeadb);
                border-radius: 12px;
                padding: 14px 18px;
                line-height: 1.7;
                display: none;
            }
            .lexp-value { font-size: 2rem; font-weight: 700; color: var(--accent-gold, #fbbf24); }
            .lexp-unit { font-size: 0.85rem; color: var(--text-secondary, #b0b0c8); font-weight: 400; }
            .lexp-sub { font-size: 0.85rem; color: var(--text-secondary, #b0b0c8); margin-bottom: 8px; }
            .lexp-info, .lexp-formula { font-size: 0.85rem; color: var(--text-secondary, #b0b0c8); margin-top: 4px; }
            .lexp-formula code {
                background: rgba(255, 255, 255, 0.06);
                padding: 1px 6px;
                border-radius: 5px;
                color: #e0e0f0;
            }
            .lexp-error { color: #f87171; font-weight: 600; }
            .lexp-summary { font-size: 0.85rem; color: var(--text-secondary, #b0b0c8); margin-top: 6px; }
            .lexp-table-wrap {
                margin-top: 10px;
                max-height: 260px;
                overflow-y: auto;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
            }
            .lexp-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
            .lexp-table th, .lexp-table td {
                padding: 6px 10px;
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            .lexp-table th {
                background: rgba(255, 255, 255, 0.06);
                color: var(--text-secondary, #b0b0c8);
                position: sticky;
                top: 0;
            }
            .lexp-table td.num { color: var(--accent-gold, #fbbf24); font-weight: 600; }
            .lexp-note {
                font-size: 0.78rem;
                color: var(--text-secondary, #b0b0c8);
                text-align: center;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding-top: 10px;
                line-height: 1.8;
            }
        `;
        document.head.appendChild(style);

        // ---------- 2.2 构建 DOM ----------
        container.innerHTML = `
            <div class="lexp-app">
                <div class="lexp-panel" id="lexp-panel-single">
                    <div class="lexp-row">
                        <label class="lexp-field">当前等级
                            <input type="number" id="lexp-single-level" min="1" max="2000" step="1" value="10">
                        </label>
                    </div>
                    <button class="lexp-btn" id="lexp-single-btn">🔢 计算升级所需</button>
                    <div class="lexp-result" id="lexp-single-result"></div>
                </div>

                <div class="lexp-panel" id="lexp-panel-range">
                    <div class="lexp-row">
                        <label class="lexp-field">起始等级
                            <input type="number" id="lexp-range-from" min="1" max="2000" step="1" value="1">
                        </label>
                        <label class="lexp-field">目标等级
                            <input type="number" id="lexp-range-to" min="2" max="2000" step="1" value="10">
                        </label>
                    </div>
                    <button class="lexp-btn" id="lexp-range-btn">📊 计算累计经验</button>
                    <div class="lexp-result" id="lexp-range-result"></div>
                </div>

                <div class="lexp-panel" id="lexp-panel-reverse">
                    <div class="lexp-row">
                        <label class="lexp-field">当前等级
                            <input type="number" id="lexp-rev-level" min="1" max="2000" step="1" value="1">
                        </label>
                        <label class="lexp-field">已有经验
                            <input type="number" id="lexp-rev-exp" min="0" step="1" value="100">
                        </label>
                    </div>
                    <button class="lexp-btn" id="lexp-rev-btn">🔄 反推最高等级</button>
                    <div class="lexp-result" id="lexp-rev-result"></div>
                </div>

                <div class="lexp-note">
                    💡 规则速览（4至5阶虽然等级要求被改但计算公式未改）：<br>0阶 1~5级 · 1阶 6~10级 · 2阶 11~25级 · 3阶 26~40级 · 4阶 41~54级 · 5阶 55~70级 · 6阶 71级及以上
                </div>
            </div>
        `;

        // ---------- 2.3 DOM 引用与工具函数 ----------
        const singleLevel = container.querySelector('#lexp-single-level');
        const singleResult = container.querySelector('#lexp-single-result');
        const rangeFrom = container.querySelector('#lexp-range-from');
        const rangeTo = container.querySelector('#lexp-range-to');
        const rangeResult = container.querySelector('#lexp-range-result');
        const revLevel = container.querySelector('#lexp-rev-level');
        const revExp = container.querySelector('#lexp-rev-exp');
        const revResult = container.querySelector('#lexp-rev-result');

        const fmt = (n) => n.toLocaleString();
        const describeTier = (tier) =>
            tier ? `${tier.order}阶（${tier.min}~${tier.max === Infinity ? '∞' : tier.max}级）` : '无效';

        function showResult(el, html) {
            el.innerHTML = html;
            el.style.display = 'block';
        }
        function showError(el, msg) {
            el.innerHTML = `<div class="lexp-error">⚠️ ${msg}</div>`;
            el.style.display = 'block';
        }

        // ---------- 2.4 模式一：单级所需 ----------
        function calcSingle() {
            const x = parseInt(singleLevel.value, 10);
            if (Number.isNaN(x) || x < 1) { showError(singleResult, '请输入有效的当前等级（≥1）'); return; }
            const tier = getTier(x);
            const need = expForLevel(x);
            showResult(singleResult, `
                <div class="lexp-value">${fmt(need)} <span class="lexp-unit">经验</span></div>
                <div class="lexp-sub">升到下一级（${x + 1} 级）所需经验</div>
                <div class="lexp-info">所在阶数：${describeTier(tier)}</div>
                <div class="lexp-formula">公式：f(x) = ${tier.expr} → f(${x}) = ${tier.base} + (${x} − ${tier.offset}) × ${tier.step} = <code>${fmt(need)}</code></div>
            `);
        }

        // ---------- 2.5 模式二：区间累计 ----------
        function calcRange() {
            const a = parseInt(rangeFrom.value, 10);
            const b = parseInt(rangeTo.value, 10);
            if (Number.isNaN(a) || Number.isNaN(b) || a < 1 || b < 1) {
                showError(rangeResult, '请输入有效的等级（≥1）');
                return;
            }
            if (a >= b) {
                showError(rangeResult, '目标等级必须大于起始等级');
                return;
            }
            const need = totalExp(a, b);
            const count = b - a;

            // 跨越的阶数
            const tierOrders = [];
            for (let x = a; x < b; x++) {
                const o = getTier(x).order;
                if (tierOrders[tierOrders.length - 1] !== o) tierOrders.push(o);
            }
            const tiersText = tierOrders.map(o => `${o}阶`).join(' → ');

            // 每级明细（超过 50 级时省略中间部分）
            const SHOW_MAX = 25;
            let rows = '';
            const buildRow = (x) =>
                `<tr><td>${x} → ${x + 1}</td><td class="num">${fmt(expForLevel(x))}</td><td>${getTier(x).order}阶</td></tr>`;
            if (count <= SHOW_MAX * 2) {
                for (let x = a; x < b; x++) rows += buildRow(x);
            } else {
                for (let x = a; x < a + SHOW_MAX; x++) rows += buildRow(x);
                rows += `<tr><td colspan="3" style="color:var(--text-secondary)">… 中间省略 ${count - SHOW_MAX * 2} 条 …</td></tr>`;
                for (let x = b - SHOW_MAX; x < b; x++) rows += buildRow(x);
            }
            const tableHtml = `
                <div class="lexp-table-wrap">
                    <table class="lexp-table">
                        <thead><tr><th>升级</th><th>所需经验</th><th>阶数</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;

            showResult(rangeResult, `
                <div class="lexp-value">${fmt(need)} <span class="lexp-unit">经验</span></div>
                <div class="lexp-sub">从 ${a} 级升到 ${b} 级所需累计经验（共 ${count} 次升级）</div>
                <div class="lexp-summary">跨越阶数：${tiersText}</div>
                ${tableHtml}
            `);
        }

        // ---------- 2.6 模式三：经验反推 ----------
        function calcReverse() {
            const lvl = parseInt(revLevel.value, 10);
            const exp = parseInt(revExp.value, 10);
            if (Number.isNaN(lvl) || lvl < 1) { showError(revResult, '请输入有效的当前等级（≥1）'); return; }
            if (Number.isNaN(exp) || exp < 0) { showError(revResult, '请输入有效的经验值（≥0）'); return; }
            const { toLevel, usedExp, remaining } = levelFromExp(lvl, exp);
            const gained = toLevel - lvl;
            const needNext = expForLevel(toLevel) - remaining;
            showResult(revResult, `
                <div class="lexp-value">${toLevel} <span class="lexp-unit">级</span></div>
                <div class="lexp-sub">拥有 ${fmt(exp)} 经验，从 ${lvl} 级可升到 ${toLevel} 级（共升 ${gained} 级）</div>
                <div class="lexp-info">消耗经验：${fmt(usedExp)}　|　剩余经验：${fmt(remaining)}</div>
                <div class="lexp-formula">升到 ${toLevel + 1} 级还需 <code>${fmt(needNext)}</code> 经验（f(${toLevel}) = ${fmt(expForLevel(toLevel))}，已积累 ${fmt(remaining)}）</div>
            `);
        }

        // ---------- 2.7 事件绑定 ----------
        container.querySelector('#lexp-single-btn').addEventListener('click', calcSingle);
        container.querySelector('#lexp-range-btn').addEventListener('click', calcRange);
        container.querySelector('#lexp-rev-btn').addEventListener('click', calcReverse);

        [singleLevel, rangeFrom, rangeTo, revLevel, revExp].forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        });

        // 初始自动计算
        calcSingle();
    }
};
