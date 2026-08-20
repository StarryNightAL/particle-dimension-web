// ============================================================
// 文件名: crate_simulator.js
// 说明: 开箱模拟器（左侧开箱，右侧操作日志）
// ============================================================

export const crateSimulator = {
    id: 'crate',
    title: '开箱模拟器',
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
                            <select class="crate-select" id="crate-select">
                                <option value="tianzai_zombie">天灾僵尸</option>
                            </select>
                            <button class="crate-btn" id="crate-open">🎲 开箱</button>
                        </div>
                        <div class="crate-result" id="crate-result">选择一个箱子后点击开箱</div>
                    </div>
                    <div class="crate-side">
                        <div class="crate-side-title">📜 开箱记录</div>
                        <div class="crate-log" id="crate-log"></div>
                    </div>
                </div>
            </div>
        `;

        // ---------- 3. 掉落表（weight 为权重，按权重随机抽取；TODO: 替换为真实数据） ----------
        const CRATES = {
            tianzai_zombie: {
                name: '天灾僵尸',
                items: [
                    { name: '占位符1', weight: 60, color: '#55FF55' },
                    { name: '占位符2', weight: 30, color: '#55FFFF' },
                    { name: '占位符3', weight: 10, color: '#FFAA00' },
                ],
            },
        };

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

        // ---------- 4. 绑定事件：查表算概率开箱 + 记录日志 ----------
        const select = container.querySelector('#crate-select');
        const openBtn = container.querySelector('#crate-open');
        const result = container.querySelector('#crate-result');
        const logEl = container.querySelector('#crate-log');

        function addLog(text, color) {
            const entry = document.createElement('div');
            entry.style.color = color || '#94a3b8';
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
            logEl.appendChild(entry);
            logEl.scrollTop = logEl.scrollHeight;
        }

        openBtn.addEventListener('click', () => {
            const crate = CRATES[select.value];
            if (!crate || crate.items.length === 0) {
                result.innerHTML = '⚠️ 该箱子尚未配置掉落表';
                addLog(`打开「${select.options[select.selectedIndex].text}」失败：掉落表未配置`, '#f87171');
                return;
            }
            const item = rollItem(crate.items);
            const total = crate.items.reduce((s, it) => s + it.weight, 0);
            const percent = (item.weight / total * 100).toFixed(1);
            result.innerHTML = `🎁 从「${crate.name}」开出了：<span style="color:${item.color || '#e0e0f0'};font-weight:700">${item.name}</span> <span style="color:var(--text-secondary,#b0b0c8);font-size:0.85rem">（概率 ${percent}%）</span>`;
            addLog(`打开「${crate.name}」→ ${item.name}（${percent}%）`, item.color || '#94a3b8');
        });
    }
};

