// ============================================================
// 文件名: crate_simulator.js
// 说明: 开箱模拟器（左侧开箱，右侧操作日志）
// ============================================================

export const crateSimulator = {
    id: 'crate',
    title: '🎁 开箱模拟器',
    render(container) {
        // ---------- 1. 注入局部样式（作用域 .crate-app） ----------
        const style = document.createElement('style');
        style.textContent = `
            .crate-app {
                font-family: var(--font-main, 'Segoe UI', Tahoma, sans-serif);
                color: #e0e0f0;
            }
            .crate-wrap {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                align-items: start;
            }
            .crate-main {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .crate-row {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: center;
            }
            .crate-label {
                font-size: 0.95rem;
                font-weight: 600;
                color: #c8c8dc;
            }
            .crate-select {
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(10, 10, 20, 0.6);
                color: #fff;
                font-size: 0.95rem;
                outline: none;
                font-family: inherit;
            }
            .crate-select:focus {
                border-color: var(--accent-cyan, #5eeadb);
            }
            .crate-btn {
                padding: 8px 18px;
                border-radius: 8px;
                border: 1px solid rgba(94, 234, 219, 0.35);
                background: rgba(94, 234, 219, 0.12);
                color: var(--accent-cyan, #5eeadb);
                font-size: 0.95rem;
                font-weight: 600;
                font-family: inherit;
                cursor: pointer;
                transition: all 0.2s;
            }
            .crate-btn:hover { background: rgba(94, 234, 219, 0.22); }
            .crate-result {
                background: rgba(10, 10, 20, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 12px 16px;
                font-size: 0.95rem;
                color: var(--text-secondary, #b0b0c8);
                line-height: 1.7;
                min-height: 48px;
            }
            .crate-table-wrap {
                background: rgba(10, 10, 20, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 10px 14px;
            }
            .crate-table-title {
                font-size: 0.85rem;
                font-weight: 700;
                color: #c8c8dc;
                margin-bottom: 8px;
            }
            .crate-table {
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-size: 0.9rem;
            }
            .crate-table-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .crate-table-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .crate-table-name {
                flex: 1;
                color: #e0e0f0;
            }
            .crate-table-percent {
                font-weight: 600;
                font-family: monospace;
            }
            .crate-side {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .crate-side-title {
                font-size: 0.92rem;
                font-weight: 700;
                color: var(--accent-cyan, #5eeadb);
                padding-left: 8px;
                border-left: 3px solid var(--accent-cyan, #5eeadb);
            }
            .crate-log {
                background: rgba(10, 10, 20, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 12px;
                max-height: 280px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 0.85rem;
                line-height: 1.7;
            }
        `;
        document.head.appendChild(style);

        // ---------- 2. 构建 DOM（左：开箱控件；右：操作日志） ----------
        container.innerHTML = `
            <div class="crate-app">
                <div class="crate-wrap">
                    <div class="crate-main">
                        <div class="crate-row">
                            <label class="crate-label">📦 选择箱子</label>
                            <select class="crate-select" id="crate-select"></select>
                            <button class="crate-btn" id="crate-open">🎲 开箱</button>
                        </div>
                        <div class="crate-result" id="crate-result">选择一个箱子后点击开箱</div>
                        <div class="crate-table-wrap">
                            <div class="crate-table-title">📋 当前箱子掉落表</div>
                            <div class="crate-table" id="crate-table"></div>
                        </div>
                    </div>
                    <div class="crate-side">
                        <div class="crate-side-title">📜 开箱记录</div>
                        <div class="crate-log" id="crate-log"></div>
                    </div>
                </div>
            </div>
        `;

        // ---------- 3. 掉落表数据 + 颜色标签 ----------
        // 颜色标签（集中管理，便于后续手动调整）：
        //   粒子水晶 / 远古残骸 → #FFAA00
        //   粒子圣晶 / 沉重核心 → #FF5555
        //   星晶              → #55FFFF
        //   其余物品默认      → #55FF55
        const ITEM_COLORS = {
            '粒子水晶': '#FFAA00',
            '远古残骸': '#FFAA00',
            '粒子圣晶': '#FF5555',
            '沉重核心': '#FF5555',
            '星晶': '#55FFFF',
        };
        // 按物品基础名（去掉 *数量 后缀）取颜色
        function itemColor(name) {
            const base = name.replace(/\*\d+$/, '');
            return ITEM_COLORS[base] || '#55FF55';
        }

        // CRATES: 每个箱子 { id, name, group, items:[{name, weight}] }，weight 为权重
        const CRATES = [
            { id: 'tianzai_zombie', name: '天灾•僵尸', group: '天灾系列', items: [
                { name: '铁块*1', weight: 40 },
                { name: '铁块*2', weight: 50 },
                { name: '粒子水晶*1', weight: 10 },
            ]},
            { id: 'tianzai_cave_skeleton', name: '天灾•洞穴骷髅', group: '天灾系列', items: [
                { name: '骷髅头骨*3', weight: 50 },
                { name: '金锭*5', weight: 30 },
                { name: '粒子水晶*1', weight: 20 },
            ]},
            { id: 'tianzai_ice_skeleton', name: '天灾•极寒冰骷', group: '天灾系列', items: [
                { name: '极寒凝晶*2', weight: 40 },
                { name: '钻石*1', weight: 40 },
                { name: '粒子水晶*2', weight: 20 },
            ]},
            { id: 'tianzai_snow_skeleton', name: '天灾•雪山骷髅', group: '天灾系列', items: [
                { name: '永恒枯骨*1', weight: 50 },
                { name: '金锭*5', weight: 30 },
                { name: '粒子水晶*1', weight: 20 },
            ]},
            { id: 'tianzai_swamp_spider', name: '天灾•沼泽魔蛛', group: '天灾系列', items: [
                { name: '坚韧蛛网*3', weight: 50 },
                { name: '魔蛛眼*2', weight: 30 },
                { name: '粒子水晶*2', weight: 20 },
            ]},
            { id: 'tianzai_desert_zombie', name: '天灾•荒漠狂尸', group: '天灾系列', items: [
                { name: '火晶石*1', weight: 40 },
                { name: '钻石*1', weight: 40 },
                { name: '粒子水晶*2', weight: 20 },
            ]},
            { id: 'tianzai_mutated_core', name: '天灾•突变晶核', group: '天灾系列', items: [
                { name: '大型紫水晶芽*2', weight: 60 },
                { name: '红石粉*8', weight: 20 },
                { name: '粒子水晶*3', weight: 20 },
            ]},
            { id: 'tianzai_creeper', name: '天灾•苦力怕', group: '天灾系列', items: [
                { name: '红石粒子源*1', weight: 60 },
                { name: '星晶*70', weight: 20 },
                { name: '粒子水晶*3', weight: 20 },
            ]},
            { id: 'nixing_particle_construct', name: '拟影•粒子幻构', group: '拟影系列', items: [
                { name: '粒子枯枝*2', weight: 50 },
                { name: '幻尘之沙*1', weight: 40 },
                { name: '粒子水晶*2', weight: 10 },
            ]},
            { id: 'nixing_nightmare', name: '拟影•梦魇', group: '拟影系列', items: [
                { name: '回响碎片*2', weight: 40 },
                { name: '粒子水晶*3', weight: 30 },
                { name: '星晶*30', weight: 20 },
                { name: '粒子圣晶*1', weight: 10 },
            ]},
            { id: 'yuangu_abyss_jelly', name: '远古•深渊晶冻体', group: '远古系列', items: [
                { name: '远古海棱晶*1', weight: 70 },
                { name: '海晶砂粒*8', weight: 10 },
                { name: '侵蚀海绵*1', weight: 10 },
                { name: '粒子水晶*3', weight: 10 },
            ]},
            { id: 'yuangu_tide_dolphin', name: '远古•潮汐海豚', group: '远古系列', items: [
                { name: '潮汐鱼鳞*1', weight: 70 },
                { name: '粒子水晶*3', weight: 20 },
                { name: '潮汐海绵*1', weight: 10 },
            ]},
            { id: 'volcano_energy', name: '火山能源中枢', group: '特殊系列', items: [
                { name: '红石枢纽*1', weight: 65 },
                { name: '星晶*50', weight: 15 },
                { name: '粒子水晶*5', weight: 10 },
                { name: '沉重核心*1', weight: 10 },
            ]},
            { id: 'hell_molten', name: '地狱-熔痕宝箱', group: '地狱系列', items: [
                { name: '硫火裂片*2', weight: 40 },
                { name: '火晶石*2', weight: 20 },
                { name: '净魂石英*6', weight: 20 },
                { name: '远古残骸*1', weight: 10 },
                { name: '烬灭符文石*1', weight: 10 },
            ]},
            { id: 'hell_blackstone', name: '地狱-黑石宝箱', group: '地狱系列', items: [
                { name: '黑曜石*1', weight: 50 },
                { name: '黑曜石*2', weight: 20 },
                { name: '玄武岩髓*12', weight: 20 },
                { name: '粒子水晶*3', weight: 7 },
                { name: '粒子圣晶*1', weight: 3 },
            ]},
            { id: 'hell_abyss', name: '地狱-深渊宝箱', group: '地狱系列', items: [
                { name: '地狱砖*8', weight: 32 },
                { name: '粒子水晶*1', weight: 40 },
                { name: '粒子水晶*2', weight: 20 },
                { name: '粒子圣晶*1', weight: 8 },
            ]},
        ];
        const CRATE_MAP = Object.fromEntries(CRATES.map(c => [c.id, c]));

        // 按权重随机抽取一项
        function rollItem(items) {
            const total = items.reduce((s, it) => s + it.weight, 0);
            let r = Math.random() * total;
            for (const it of items) {
                r -= it.weight;
                if (r < 0) return it;
            }
            return items[items.length - 1];
        }

        // ---------- 4. 绑定事件：填充箱子下拉 + 掉落表 + 开箱逻辑 ----------
        const select = container.querySelector('#crate-select');
        const openBtn = container.querySelector('#crate-open');
        const result = container.querySelector('#crate-result');
        const logEl = container.querySelector('#crate-log');
        const tableEl = container.querySelector('#crate-table');

        // 按分组填充下拉选项（optgroup）
        const groups = [...new Set(CRATES.map(c => c.group))];
        for (const g of groups) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = g;
            CRATES.filter(c => c.group === g).forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        }

        function addLog(text, color) {
            const entry = document.createElement('div');
            entry.style.color = color || '#94a3b8';
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
            logEl.appendChild(entry);
            logEl.scrollTop = logEl.scrollHeight;
        }

        // 渲染当前箱子的掉落概率表
        function renderTable(crate) {
            if (!crate || crate.items.length === 0) {
                tableEl.innerHTML = '<div style="color:#f87171">该箱子尚未配置掉落表</div>';
                return;
            }
            const total = crate.items.reduce((s, it) => s + it.weight, 0);
            tableEl.innerHTML = crate.items.map(it => {
                const percent = (it.weight / total * 100).toFixed(1);
                const color = itemColor(it.name);
                return `<div class="crate-table-item">
                    <span class="crate-table-dot" style="background:${color}"></span>
                    <span class="crate-table-name">${it.name}</span>
                    <span class="crate-table-percent" style="color:${color}">${percent}%</span>
                </div>`;
            }).join('');
        }

        select.addEventListener('change', () => {
            renderTable(CRATE_MAP[select.value]);
        });

        openBtn.addEventListener('click', () => {
            const crate = CRATE_MAP[select.value];
            if (!crate || crate.items.length === 0) {
                result.innerHTML = '⚠️ 该箱子尚未配置掉落表';
                addLog(`打开「${select.options[select.selectedIndex].text}」失败：掉落表未配置`, '#f87171');
                return;
            }
            const item = rollItem(crate.items);
            const total = crate.items.reduce((s, it) => s + it.weight, 0);
            const percent = (item.weight / total * 100).toFixed(1);
            const color = itemColor(item.name);
            result.innerHTML = `🎁 从「${crate.name}」开出了：<span style="color:${color};font-weight:700">${item.name}</span> <span style="color:var(--text-secondary,#b0b0c8);font-size:0.85rem">（概率 ${percent}%）</span>`;
            addLog(`打开「${crate.name}」→ ${item.name}（${percent}%）`, color);
        });

        // 初始化：默认选中第一个箱子并显示掉落表
        renderTable(CRATE_MAP[select.value]);
    }
};

