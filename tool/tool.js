// ============================================================
// 文件名: toolcall.js
// 说明: 动态创建整个 UI，并调用 melee_damage_calculator.js 进行计算
// ============================================================

import { meleeDamageTool } from './melee_damage_calculator.js';
import { particleForgeTool } from './forging_simulator.js';

// ---------- 1. 注入工具专属样式（作用于所有 .tool-app 卡片，主题与 Wiki 保持一致） ----------
const style = document.createElement('style');
style.textContent = `
    .tool-app {
        font-family: var(--font-main, 'Segoe UI', Tahoma, sans-serif);
        color: #e0e0f0;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px 16px;
        align-items: start;
    }
    .tool-app h1,
    .tool-app .sub,
    .tool-app .row,
    .tool-app .btn-calc,
    .tool-app .result-box,
    .tool-app .note {
        grid-column: 1 / -1;
    }
    .tool-app h1 {
        text-align: center;
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 8px;
        color: #fff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 12px;
    }
    .tool-app .sub {
        text-align: center;
        font-size: 0.75rem;
        color: var(--text-secondary, #b0b0c8);
        margin-top: -4px;
        margin-bottom: 18px;
    }
    .tool-app .input-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;
    }
    .tool-app .input-group label {
        font-size: 0.88rem;
        font-weight: 600;
        margin-bottom: 4px;
        color: #c8c8dc;
    }
    .tool-app .input-group input, .tool-app .input-group select {
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
    .tool-app .input-group input:focus, .tool-app .input-group select:focus {
        border-color: var(--accent-cyan, #5eeadb);
        box-shadow: 0 0 8px rgba(94, 234, 219, 0.25);
    }
    .tool-app .row {
        display: flex;
        gap: 14px;
    }
    .tool-app .row .input-group {
        flex: 1;
    }
    .tool-app .btn-calc {
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
    .tool-app .btn-calc:hover {
        background: rgba(94, 234, 219, 0.22);
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(94, 234, 219, 0.25);
    }
    .tool-app .btn-calc:active {
        transform: scale(0.97);
    }
    .tool-app .result-box {
        margin-top: 18px;
        background: rgba(10, 10, 20, 0.6);
        padding: 14px 18px;
        border-radius: 12px;
        border-left: 4px solid var(--accent-cyan, #5eeadb);
        text-align: center;
    }
    .tool-app .result-box .label {
        font-size: 0.82rem;
        color: var(--text-secondary, #b0b0c8);
        display: block;
        margin-bottom: 4px;
    }
    .tool-app .result-box .value {
        font-size: 1.85rem;
        font-weight: 700;
        color: var(--accent-gold, #fbbf24);
    }
    .tool-app .result-box .value.negative {
        color: #ef5350;
    }
    .tool-app .note {
        font-size: 0.78rem;
        color: var(--text-secondary, #b0b0c8);
        text-align: center;
        margin-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 10px;
    }
    .tool-app .badge {
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
        .tool-app {
            grid-template-columns: 1fr;
        }
        .tool-app h1,
        .tool-app .sub,
        .tool-app .row,
        .tool-app .btn-calc,
        .tool-app .result-box,
        .tool-app .note {
            grid-column: auto;
        }
    }
    /* 工具页子导航（仿 point.html 的 sub-nav） */
    #tool-apps .sub-nav {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        margin-bottom: 20px;
    }
    #tool-apps .sub-nav-link {
        color: var(--text-secondary);
        text-decoration: none;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.3s;
    }
    #tool-apps .sub-nav-link:hover {
        color: #fff;
        background: rgba(94, 234, 219, 0.1);
    }
    #tool-apps .sub-nav-separator {
        color: rgba(180, 180, 200, 0.3);
    }
    /* 工具卡片间距 */
    #tool-apps .tool-card {
        margin-bottom: 24px;
    }
    #tool-apps .tool-card:last-child {
        margin-bottom: 0;
    }
`;
document.head.appendChild(style);

// ---------- 2. 工具注册表（新增工具时在此追加即可） ----------
const TOOLS = [meleeDamageTool, particleForgeTool];

// ---------- 3. 泛化表单控件工厂（根据 field.type 渲染 select / number） ----------
function createFieldControl(field) {
    const group = document.createElement('div');
    group.className = 'input-group';

    const label = document.createElement('label');
    label.textContent = field.label;
    group.appendChild(label);

    let control;
    if (field.type === 'select') {
        control = document.createElement('select');
        control.id = field.key;
        for (const opt of field.options) {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            control.appendChild(o);
        }
        if (field.default !== undefined) control.value = field.default;
    } else {  // number
        control = document.createElement('input');
        control.type = 'number';
        control.id = field.key;
        control.value = field.default;
        if (field.min !== undefined) control.min = field.min;
        if (field.max !== undefined) control.max = field.max;
        if (field.step !== undefined) control.step = field.step;
    }
    group.appendChild(control);
    return group;
}

// ---------- 4. 泛化渲染 fields-based 工具 ----------
function renderFieldsTool(tool, container) {
    // 按 tool.fields 的 row 分组排布表单
    const maxRow = Math.max(...tool.fields.map(f => f.row));
    for (let r = 1; r <= maxRow; r++) {
        const rowFields = tool.fields.filter(f => f.row === r);
        if (rowFields.length === 0) continue;
        const row = document.createElement('div');
        row.className = 'row';
        for (const field of rowFields) {
            row.appendChild(createFieldControl(field));
        }
        container.appendChild(row);
    }

    // 计算按钮
    const calcBtn = document.createElement('button');
    calcBtn.className = 'btn-calc';
    calcBtn.textContent = tool.buttonText || '🔢 计算';
    container.appendChild(calcBtn);

    // 结果显示区域
    const resultBox = document.createElement('div');
    resultBox.className = 'result-box';
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
    note.textContent = tool.note;
    container.appendChild(note);

    // 引用输入控件（id = 字段 key）与结果元素
    const controls = {};
    for (const field of tool.fields) {
        controls[field.key] = document.getElementById(field.key);
    }
    const damageValue = document.getElementById('damageValue');
    const detailInfo = document.getElementById('detailInfo');
    const clampInfo = document.getElementById('clampInfo');

    // 计算（委托给计算引擎 tool.calculate / tool.formatResult）
    function performCalculation() {
        const input = {};
        for (const field of tool.fields) {
            input[field.key] = controls[field.key].value;
        }
        const result = tool.calculate(input);
        const view = tool.formatResult(result);

        damageValue.className = view.mainClass ? `value ${view.mainClass}` : 'value';
        damageValue.textContent = view.mainValue;
        detailInfo.textContent = view.detail;

        clampInfo.innerHTML = view.corrections.join('<br>');
        clampInfo.hidden = view.corrections.length === 0;
    }

    // 绑定事件
    calcBtn.addEventListener('click', performCalculation);
    Object.values(controls).forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performCalculation();
            }
        });
    });

    performCalculation();
}

// ---------- 5. 渲染单个工具到容器（支持自定义 render 与 fields 通用渲染） ----------
function renderTool(tool, container) {
    if (typeof tool.render === 'function') {
        // 自定义渲染（如粒子锻造模拟器）
        tool.render(container);
    } else if (Array.isArray(tool.fields)) {
        renderFieldsTool(tool, container);
    }
}

// ---------- 6. 为每个工具动态创建卡片并渲染 ----------
const host = document.getElementById('tool-apps');
if (host) {
    // 子导航（仿 point.html 的 sub-nav，点击锚点跳转到对应工具卡片）
    const subNav = document.createElement('nav');
    subNav.className = 'sub-nav';
    TOOLS.forEach((tool, i) => {
        if (i > 0) {
            const sep = document.createElement('span');
            sep.className = 'sub-nav-separator';
            sep.textContent = '|';
            subNav.appendChild(sep);
        }
        const link = document.createElement('a');
        link.className = 'sub-nav-link';
        link.href = `#tool-card-${tool.id}`;
        link.textContent = tool.title;
        subNav.appendChild(link);
    });
    host.appendChild(subNav);

    // 工具卡片
    for (const tool of TOOLS) {
        const card = document.createElement('article');
        card.className = 'content-card tool-card';
        card.id = `tool-card-${tool.id}`;

        const title = document.createElement('h2');
        title.className = 'content-title';
        title.textContent = tool.title;
        card.appendChild(title);

        const body = document.createElement('div');
        body.className = 'tool-app';
        card.appendChild(body);

        host.appendChild(card);
        renderTool(tool, body);
    }
} else {
    // 兜底：无宿主元素时直接渲染首个工具到 body
    const body = document.createElement('div');
    body.className = 'tool-app';
    document.body.appendChild(body);
    renderTool(TOOLS[0], body);
}