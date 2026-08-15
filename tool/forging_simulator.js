// ============================================================
// 文件名: particle_forge_calculator.js
// 说明: 粒子锻造模拟器（自定义渲染工具）
//       通过 particleForgeTool 定义导出，提供 render(container) 构建完整 UI。
//       样式采用轻量局部注入，融入 Wiki 卡片主题，不依赖原 HTML 的深色主题。
// ============================================================

export const particleForgeTool = {
    id: 'particle-forge',
    title: '⚗️ 粒子锻造模拟器',
    // 自定义渲染：构建整个 UI 并绑定事件
    render(container) {
        // ---------- 1. 注入局部样式（作用域到 .forge-app） ----------
        const style = document.createElement('style');
        style.textContent = `
            .forge-app {
                font-family: var(--font-main, 'Segoe UI', Tahoma, sans-serif);
                color: #e0e0f0;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .forge-app .forge-section {
                background: rgba(20, 20, 40, 0.55);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 14px 16px;
            }
            .forge-app .forge-subtitle {
                font-size: 0.92rem;
                font-weight: 700;
                color: var(--accent-cyan, #5eeadb);
                margin-bottom: 10px;
                padding-left: 8px;
                border-left: 3px solid var(--accent-cyan, #5eeadb);
            }
            .forge-app .forge-templates {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            .forge-app .forge-tpl {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                padding: 10px;
                cursor: pointer;
                color: #e0e0f0;
                font-family: inherit;
                text-align: center;
                transition: all 0.2s;
            }
            .forge-app .forge-tpl:hover { background: rgba(255, 255, 255, 0.1); }
            .forge-app .forge-tpl.active {
                background: rgba(94, 234, 219, 0.15);
                border-color: var(--accent-cyan, #5eeadb);
            }
            .forge-app .forge-tpl span {
                display: block;
                font-size: 0.72rem;
                color: var(--text-secondary, #b0b0c8);
                margin-top: 4px;
            }
            .forge-app .forge-values {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
            }
            .forge-app .forge-value {
                background: rgba(10, 10, 20, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 12px;
                text-align: center;
            }
            .forge-app .forge-value-title {
                font-size: 0.78rem;
                color: var(--text-secondary, #b0b0c8);
                margin-bottom: 6px;
            }
            .forge-app .forge-value-num {
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--accent-gold, #fbbf24);
            }
            .forge-app .forge-status {
                padding: 9px 12px;
                border-radius: 8px;
                margin-top: 10px;
                text-align: center;
                font-size: 0.85rem;
                font-weight: 600;
            }
            .forge-app .forge-status.ok { background: rgba(34, 197, 94, 0.15); color: #86efac; }
            .forge-app .forge-status.warning { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
            .forge-app .forge-status.error { background: rgba(239, 68, 68, 0.18); color: #f87171; }
            .forge-app .forge-zones {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                font-size: 0.78rem;
                color: #fca5a5;
            }
            .forge-app .forge-zone-warn {
                margin-top: 8px;
                font-size: 0.78rem;
                color: #f87171;
            }
            .forge-app .forge-row {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;
                margin-bottom: 10px;
            }
            .forge-app select, .forge-app input[type="number"] {
                padding: 8px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(10, 10, 20, 0.6);
                color: #fff;
                font-size: 0.92rem;
                outline: none;
                font-family: inherit;
            }
            .forge-app .forge-btn {
                padding: 8px 16px;
                border-radius: 8px;
                border: 1px solid rgba(94, 234, 219, 0.35);
                background: rgba(94, 234, 219, 0.12);
                color: var(--accent-cyan, #5eeadb);
                font-size: 0.9rem;
                font-weight: 600;
                font-family: inherit;
                cursor: pointer;
                transition: all 0.2s;
            }
            .forge-app .forge-btn:hover { background: rgba(94, 234, 219, 0.22); }
            .forge-app .forge-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .forge-app .forge-btn-reset { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.12); color: #f87171; }
            .forge-app .forge-btn-reset:hover { background: rgba(239, 68, 68, 0.22); }
            .forge-app .forge-funnels {
                display: flex;
                gap: 6px;
                align-items: center;
                color: var(--text-secondary, #b0b0c8);
                font-size: 0.85rem;
            }
            .forge-app .forge-funnel {
                padding: 5px 12px;
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(255, 255, 255, 0.05);
                color: #e0e0f0;
                cursor: pointer;
                font-family: inherit;
            }
            .forge-app .forge-funnel.selected {
                background: rgba(94, 234, 219, 0.18);
                border-color: var(--accent-cyan, #5eeadb);
            }
            .forge-app .forge-hint {
                font-size: 0.82rem;
                color: var(--text-secondary, #b0b0c8);
                margin-top: 6px;
            }
            .forge-app .forge-reduce-info {
                display: flex;
                flex-direction: column;
                font-size: 0.8rem;
                color: var(--text-secondary, #b0b0c8);
                padding: 6px 12px;
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.4);
                border-radius: 8px;
            }
            .forge-app .forge-reduce-count {
                font-size: 1.4rem;
                font-weight: 700;
                color: #86efac;
            }
            .forge-app .forge-targets {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 10px;
            }
            .forge-app .forge-targets label {
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-size: 0.8rem;
                color: var(--text-secondary, #b0b0c8);
            }
            .forge-app .forge-check {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.85rem;
                color: #e0e0f0;
                cursor: pointer;
            }
            .forge-app .forge-search-stats {
                font-size: 0.8rem;
                color: var(--text-secondary, #b0b0c8);
                min-height: 1.2em;
                margin-top: 6px;
            }
            .forge-app .forge-result {
                background: rgba(34, 197, 94, 0.08);
                border: 1px solid rgba(34, 197, 94, 0.4);
                border-radius: 10px;
                padding: 14px;
                margin-top: 10px;
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 0.82rem;
                max-height: 320px;
                overflow-y: auto;
                line-height: 1.6;
            }
            .forge-app .forge-log {
                background: rgba(10, 10, 20, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 12px;
                max-height: 180px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 0.8rem;
                line-height: 1.6;
            }
            .forge-app .forge-log .add { color: var(--accent-blue, #60a5fa); }
            .forge-app .forge-log .reduce { color: #22c55e; }
            .forge-app .forge-log .warning { color: #fbbf24; }
            .forge-app .forge-log .error { color: #f87171; }
            .forge-app .forge-log .info { color: #94a3b8; }
            /* 右侧使用说明区（与左侧等高对齐） */
            .forge-side {
                display: flex;
                flex-direction: column;
                gap: 14px;
                align-self: stretch;
            }
            .forge-side .forge-section {
                background: rgba(20, 20, 40, 0.55);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 14px 16px;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            .forge-side .forge-subtitle {
                font-size: 0.92rem;
                font-weight: 700;
                color: var(--accent-cyan, #5eeadb);
                margin-bottom: 10px;
                padding-left: 8px;
                border-left: 3px solid var(--accent-cyan, #5eeadb);
            }
            .forge-side .forge-doc-btns {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .forge-side .forge-doc-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                padding: 12px;
                cursor: pointer;
                color: #e0e0f0;
                font-family: inherit;
                font-size: 1rem;
                text-align: center;
                transition: all 0.2s;
            }
            .forge-side .forge-doc-btn:hover { background: rgba(255, 255, 255, 0.1); }
            .forge-side .forge-doc-btn.active {
                background: rgba(94, 234, 219, 0.15);
                border-color: var(--accent-cyan, #5eeadb);
            }
            .forge-side .forge-doc-text {
                background: rgba(10, 10, 20, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 14px;
                height: 700px;
                overflow-y: auto;
                font-size: 1rem;
                color: var(--text-secondary, #b0b0c8);
                line-height: 1.8;
                white-space: pre-wrap;
                scrollbar-width: thin;
                scrollbar-color: rgba(94, 234, 219, 0.4) rgba(255, 255, 255, 0.05);
            }
            .forge-side .forge-doc-text::-webkit-scrollbar { width: 8px; }
            .forge-side .forge-doc-text::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }
            .forge-side .forge-doc-text::-webkit-scrollbar-thumb { background: rgba(94, 234, 219, 0.3); border-radius: 4px; }
            /* 底部操作日志行（跨整行，不参与右侧对齐） */
            .forge-log-row {
                grid-column: 1 / -1;
                display: flex;
                flex-direction: column;
            }
            .forge-log-row .forge-section {
                background: rgba(20, 20, 40, 0.55);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 14px 16px;
            }
            .forge-log-row .forge-subtitle {
                font-size: 0.92rem;
                font-weight: 700;
                color: var(--accent-cyan, #5eeadb);
                margin-bottom: 10px;
                padding-left: 8px;
                border-left: 3px solid var(--accent-cyan, #5eeadb);
            }
            .forge-log-row .forge-log {
                background: rgba(10, 10, 20, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 12px;
                max-height: 180px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 0.8rem;
                line-height: 1.6;
            }
            /* 版权声明（跨整行，置底居中） */
            .forge-copyright {
                grid-column: 1 / -1;
                text-align: center;
                padding: 14px 16px;
                color: #94a3b8;
                font-size: 0.85rem;
                line-height: 1.8;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
            }
            .forge-copyright .line1 {
                font-size: 1rem;
                color: var(--accent-blue, #60a5fa);
            }
            /* 窄屏回退为单列（已禁用：强制 PC 布局）
            @media (max-width: 640px) {
                .forge-app .forge-templates,
                .forge-app .forge-values,
                .forge-app .forge-zones,
                .forge-app .forge-targets { grid-template-columns: 1fr; }
            }
            */
        `;
        document.head.appendChild(style);

        // ---------- 2. 构建 DOM ----------
        container.innerHTML = `
            <div class="forge-app">
                <div class="forge-section">
                    <div class="forge-subtitle">📋 模板选择</div>
                    <div class="forge-templates">
                        <button class="forge-tpl active" data-template="void">虚空模板<span>含量:200 混乱度:120 稳定度:100</span></button>
                        <button class="forge-tpl" data-template="relic">远古遗骸<span>含量:30 混乱度:80 稳定度:200</span></button>
                        <button class="forge-tpl" data-template="furnace">熔炉核心<span>含量:50 混乱度:160 稳定度:40</span></button>
                    </div>
                </div>

                <div class="forge-section">
                    <div class="forge-subtitle">📊 当前数值状态</div>
                    <div class="forge-values">
                        <div class="forge-value"><div class="forge-value-title">粒子含量</div><div class="forge-value-num" id="forge-content">200</div></div>
                        <div class="forge-value"><div class="forge-value-title">粒子混乱度</div><div class="forge-value-num" id="forge-chaos">120</div></div>
                        <div class="forge-value"><div class="forge-value-title">结构稳定度</div><div class="forge-value-num" id="forge-stability">100</div></div>
                    </div>
                    <div class="forge-status ok" id="forge-status">状态正常，可进行操作</div>
                </div>

                <div class="forge-section">
                    <div class="forge-subtitle">⚠️ 数值禁区</div>
                    <div class="forge-zones">
                        <div>含量禁区: 70-75, 140-145, 270-275</div>
                        <div>混乱度禁区: 105-115, 170-175, 210-215</div>
                        <div>稳定度禁区: 50-60, 125-130, 280-289</div>
                    </div>
                    <div class="forge-zone-warn">所有数值不可到达 0 或 300！</div>
                </div>

                <div class="forge-section">
                    <div class="forge-subtitle">🔨 模拟锻造</div>
                    <div class="forge-row">
                        <select id="forge-material">
                            <option value="">选择材料</option>
                            <option value="iron">铁</option>
                            <option value="gold">金</option>
                            <option value="quartz">石英</option>
                            <option value="blaze">烈焰棒</option>
                            <option value="dragon">龙息</option>
                            <option value="chorus">爆裂紫颂果</option>
                            <option value="diamond">钻石</option>
                            <option value="obsidian">黑曜石</option>
                            <option value="crystal">粒子水晶</option>
                            <option value="crying_obsidian">哭泣黑曜石</option>
                            <option value="sand">幻尘之沙</option>
                            <option value="alloy">下界合金锭</option>
                            <option value="ender">末影水晶</option>
                            <option value="shadow">纯净影晶</option>
                            <option value="holy">粒子圣晶</option>
                        </select>
                        <div class="forge-funnels">
                            <span>漏斗:</span>
                            <button class="forge-funnel" data-funnel="1">1</button>
                            <button class="forge-funnel" data-funnel="2">2</button>
                            <button class="forge-funnel" data-funnel="3">3</button>
                        </div>
                        <button class="forge-btn" id="forge-add">添加材料</button>
                    </div>
                    <div class="forge-hint" id="forge-material-desc">选择材料和漏斗查看效果描述</div>

                    <div class="forge-row">
                        <div class="forge-reduce-info">
                            <div>剩余降低机会</div>
                            <div class="forge-reduce-count" id="forge-reduce-count">7</div>
                        </div>
                        <button class="forge-btn" id="forge-reduce-content">降低含量</button>
                        <button class="forge-btn" id="forge-reduce-chaos">降低混乱度</button>
                        <button class="forge-btn" id="forge-reduce-stability">降低稳定度</button>
                    </div>

                    <button class="forge-btn forge-btn-reset" id="forge-reset">重置模拟</button>
                </div>

                <div class="forge-section">
                    <div class="forge-subtitle">🎯 目标搜索</div>
                    <div class="forge-targets">
                        <label>粒子含量目标<input type="number" id="forge-target-content" min="1" max="299" value="250"></label>
                        <label>粒子混乱度目标<input type="number" id="forge-target-chaos" min="1" max="299" value="150"></label>
                        <label>结构稳定度目标<input type="number" id="forge-target-stability" min="1" max="299" value="290"></label>
                    </div>
                    <div class="forge-row">
                        <label class="forge-check"><input type="checkbox" id="forge-use-rare" checked> 使用珍贵材料</label>
                        <select id="forge-depth">
                            <option value="6">6步(快速)</option>
                            <option value="8" selected>8步(推荐)</option>
                            <option value="10">10步(较慢)</option>
                            <option value="12">12步(慢)</option>
                        </select>
                        <button class="forge-btn" id="forge-search">开始搜索</button>
                    </div>
                    <div class="forge-search-stats" id="forge-search-stats"></div>
                    <div class="forge-result" id="forge-result" style="display:none"></div>
                    <div id="forge-search-status"></div>
                </div>

                </div>
            </div>
            <div class="forge-side">
                <div class="forge-section">
                    <div class="forge-subtitle">📖 使用说明</div>
                    <div class="forge-doc-btns">
                        <button class="forge-doc-btn active" data-doc="must">锻造须看</button>
                        <button class="forge-doc-btn" data-doc="materials">材料列表</button>
                        <button class="forge-doc-btn" data-doc="products">产物列表</button>
                    </div>
                    <div class="forge-doc-text" id="forge-doc-text"></div>
                </div>
            </div>
            <div class="forge-log-row">
                <div class="forge-section">
                    <div class="forge-subtitle">📜 操作日志</div>
                    <div class="forge-log" id="forge-log">
                        <div class="info">系统初始化: 粒子含量=200, 粒子混乱度=120, 结构稳定度=100</div>
                    </div>
                </div>
            </div>
            <div class="forge-copyright">
                <div class="line1">love乄辰编写  结果仅供参考</div>
                <div>星夜StarN  获授权后修改</div>
                <div>love乄辰  版权所有  仿冒必究</div>
            </div>
        `;

        // ---------- 3. 状态与数据 ----------
        let state = {
            content: 200,
            chaos: 120,
            stability: 100,
            reduceChances: 7
        };

        const templates = {
            void: { name: "虚空模板", content: 200, chaos: 120, stability: 100 },
            relic: { name: "远古遗骸", content: 30, chaos: 80, stability: 200 },
            furnace: { name: "熔炉核心", content: 50, chaos: 160, stability: 40 }
        };

        const forbiddenZones = {
            content: [[70, 75], [140, 145], [270, 275]],
            chaos: [[105, 115], [170, 175], [210, 215]],
            stability: [[50, 60], [125, 130], [280, 289]]
        };

        const materials = {
            iron: { name: "铁锭", effects: [{ funnel: 2, type: "stability", min: 15, max: 25 }] },
            gold: { name: "金锭", effects: [
                { funnel: 1, type: "content", min: 20, max: 30 },
                { funnel: 2, type: "chaos", min: 10, max: 20 },
                { funnel: 3, type: "content", min: 8, max: 17 }
            ] },
            quartz: { name: "石英", effects: [
                { funnel: 1, type: "chaos", min: -35, max: -25 },
                { funnel: 2, type: "content", min: -25, max: -15 },
                { funnel: 3, type: "chaos", min: -15, max: -10 }
            ] },
            blaze: { name: "烈焰棒", effects: [
                { funnel: 1, type: "content", min: 40, max: 50 },
                { funnel: 2, type: "chaos", min: 30, max: 40 },
                { funnel: 3, type: "content", min: 25, max: 27 }
            ] },
            dragon: { name: "龙息", effects: [
                { funnel: 1, type: "content", min: 8, max: 12 },
                { funnel: 2, type: "content", min: 20, max: 30 }
            ] },
            chorus: { name: "爆裂紫颂果", effects: [
                { funnel: 2, type: "chaos", min: 20, max: 30 },
                { funnel: 3, type: "chaos", min: 15, max: 20 }
            ] },
            diamond: { name: "钻石", effects: [
                { funnel: 2, type: "chaos", min: -50, max: -40 },
                { funnel: 3, type: "stability", min: 40, max: 50 }
            ] },
            obsidian: { name: "黑曜石", effects: [
                { funnel: 2, type: "chaos", min: -25, max: -25 },
                { funnel: 3, type: "stability", min: 45, max: 60 }
            ] },
            crystal: { name: "粒子水晶", effects: [
                { funnel: 1, type: "stability", min: 10, max: 15 },
                { funnel: 2, type: "chaos", min: -12, max: -8 },
                { funnel: 3, type: "content", min: 5, max: 10 }
            ] },
            crying_obsidian: { name: "哭泣黑曜石", rare: true, effects: [
                { funnel: 1, type: "content", min: 60, max: 75 },
                { funnel: 2, type: "chaos", min: 40, max: 50 },
                { funnel: 3, type: "chaos", min: 30, max: 40 }
            ] },
            sand: { name: "幻尘之沙", rare: true, effects: [
                { funnel: 1, type: "content", min: 4, max: 6 },
                { funnel: 3, type: "chaos", min: 22, max: 25 }
            ] },
            alloy: { name: "下界合金锭", rare: true, effects: [
                { funnel: 2, type: "chaos", min: -52, max: -50 },
                { funnel: 3, type: "stability", min: 80, max: 82 }
            ] },
            ender: { name: "末影水晶", rare: true, effects: [
                { funnel: 1, type: "content", min: 28, max: 30 },
                { funnel: 2, type: "chaos", min: 28, max: 30 }
            ] },
            shadow: { name: "纯净影晶", rare: true, effects: [
                { funnel: 1, type: "content", min: 6, max: 6 },
                { funnel: 2, type: "chaos", min: 6, max: 6 }
            ] },
            holy: { name: "粒子圣晶", rare: true, effects: [
                { funnel: 1, type: "content", min: 80, max: 81 },
                { funnel: 2, type: "content", min: -6, max: -6 },
                { funnel: 3, type: "stability", min: -6, max: -6 }
            ] }
        };

        let selectedFunnel = 1;
        let isSearching = false;
        let searchTimeout = null;

        // ---------- 4. DOM 引用 ----------
        const contentEl = container.querySelector('#forge-content');
        const chaosEl = container.querySelector('#forge-chaos');
        const stabilityEl = container.querySelector('#forge-stability');
        const reduceCountEl = container.querySelector('#forge-reduce-count');
        const statusEl = container.querySelector('#forge-status');
        const logEl = container.querySelector('#forge-log');
        const materialSelect = container.querySelector('#forge-material');
        const materialDesc = container.querySelector('#forge-material-desc');
        const funnelOptions = container.querySelectorAll('.forge-funnel');
        const addBtn = container.querySelector('#forge-add');
        const reduceBtns = container.querySelectorAll('#forge-reduce-content, #forge-reduce-chaos, #forge-reduce-stability');
        const resetBtn = container.querySelector('#forge-reset');
        const targetContent = container.querySelector('#forge-target-content');
        const targetChaos = container.querySelector('#forge-target-chaos');
        const targetStability = container.querySelector('#forge-target-stability');
        const searchBtn = container.querySelector('#forge-search');
        const searchResult = container.querySelector('#forge-result');
        const searchStatus = container.querySelector('#forge-search-status');
        const searchDepth = container.querySelector('#forge-depth');
        const searchStats = container.querySelector('#forge-search-stats');
        const templateBtns = container.querySelectorAll('.forge-tpl');
        const useRareMaterialsCheckbox = container.querySelector('#forge-use-rare');

        // ---------- 5. 通用函数 ----------
        function updateDisplay() {
            contentEl.textContent = state.content;
            chaosEl.textContent = state.chaos;
            stabilityEl.textContent = state.stability;
            reduceCountEl.textContent = state.reduceChances;
            updateStatus();
        }

        function isValidState() {
            const { content, chaos, stability } = state;
            if (content <= 0 || content >= 300) return false;
            if (chaos <= 0 || chaos >= 300) return false;
            if (stability <= 0 || stability >= 300) return false;
            for (const [min, max] of forbiddenZones.content) {
                if (content >= min && content <= max) return false;
            }
            for (const [min, max] of forbiddenZones.chaos) {
                if (chaos >= min && chaos <= max) return false;
            }
            for (const [min, max] of forbiddenZones.stability) {
                if (stability >= min && stability <= max) return false;
            }
            return true;
        }

        function updateStatus() {
            if (!isValidState()) {
                statusEl.textContent = "⚠️ 数值进入禁区或达到边界！请调整。";
                statusEl.className = "forge-status error";
                return;
            }
            let warning = false;
            for (const [min, max] of forbiddenZones.content) {
                if (state.content >= min - 5 && state.content <= max + 5) warning = true;
            }
            for (const [min, max] of forbiddenZones.chaos) {
                if (state.chaos >= min - 5 && state.chaos <= max + 5) warning = true;
            }
            for (const [min, max] of forbiddenZones.stability) {
                if (state.stability >= min - 5 && state.stability <= max + 5) warning = true;
            }
            if (warning) {
                statusEl.textContent = "⚠️ 数值接近禁区，请谨慎操作。";
                statusEl.className = "forge-status warning";
            } else {
                statusEl.textContent = "状态正常，可进行操作";
                statusEl.className = "forge-status ok";
            }
        }

        function addLog(message, type = "info") {
            const entry = document.createElement('div');
            entry.className = type;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logEl.appendChild(entry);
            logEl.scrollTop = logEl.scrollHeight;
        }

        // ---------- 6. 事件绑定 ----------
        templateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const template = btn.dataset.template;
                if (template in templates) {
                    templateBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    state.content = templates[template].content;
                    state.chaos = templates[template].chaos;
                    state.stability = templates[template].stability;
                    state.reduceChances = 7;
                    updateDisplay();
                    addLog(`切换到${templates[template].name}: 含量=${state.content}, 混乱度=${state.chaos}, 稳定度=${state.stability}`, "info");
                }
            });
        });

        funnelOptions.forEach(option => {
            option.addEventListener('click', () => {
                funnelOptions.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                selectedFunnel = parseInt(option.dataset.funnel);
                updateMaterialDesc();
            });
        });

        function updateMaterialDesc() {
            const materialKey = materialSelect.value;
            if (!materialKey) {
                materialDesc.textContent = "选择材料和漏斗查看效果描述";
                return;
            }
            const material = materials[materialKey];
            const effect = material.effects.find(e => e.funnel === selectedFunnel);
            if (effect) {
                const typeMap = { content: "粒子含量", chaos: "粒子混乱度", stability: "结构稳定度" };
                const change = effect.min === effect.max ? `${effect.min}` : `${effect.min} 到 ${effect.max}`;
                const op = effect.min > 0 ? "增加" : "减少";
                materialDesc.textContent = `${material.name}加入漏斗${selectedFunnel}: ${typeMap[effect.type]} ${op} ${Math.abs(effect.min)} 到 ${Math.abs(effect.max)}`;
            } else {
                materialDesc.textContent = `该材料在漏斗${selectedFunnel}上无效果`;
            }
        }

        materialSelect.addEventListener('change', updateMaterialDesc);

        addBtn.addEventListener('click', () => {
            const materialKey = materialSelect.value;
            if (!materialKey) {
                alert("请先选择材料");
                return;
            }
            const material = materials[materialKey];
            const effect = material.effects.find(e => e.funnel === selectedFunnel);
            if (!effect) {
                alert(`该材料不能在漏斗${selectedFunnel}上使用`);
                return;
            }
            const change = effect.min + Math.floor(Math.random() * (effect.max - effect.min + 1));
            const oldState = { ...state };
            if (effect.type === 'content') state.content += change;
            else if (effect.type === 'chaos') state.chaos += change;
            else if (effect.type === 'stability') state.stability += change;
            if (!isValidState()) {
                state = oldState;
                addLog(`添加${material.name}到漏斗${selectedFunnel}失败: 将导致无效状态`, "error");
                alert("添加失败: 操作后数值将进入禁区或超出边界！");
                return;
            }
            updateDisplay();
            const typeMap = { content: "粒子含量", chaos: "粒子混乱度", stability: "结构稳定度" };
            const op = change > 0 ? "增加" : "减少";
            addLog(`添加${material.name}到漏斗${selectedFunnel}: ${typeMap[effect.type]} ${op} ${Math.abs(change)}`, "add");
        });

        reduceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (state.reduceChances <= 0) {
                    alert("降低机会已用尽");
                    return;
                }
                const type = btn.id.replace('forge-reduce-', '');
                const oldState = { ...state };
                if (type === 'content') state.content -= 1;
                else if (type === 'chaos') state.chaos -= 1;
                else if (type === 'stability') state.stability -= 1;
                state.reduceChances -= 1;
                if (!isValidState()) {
                    state = oldState;
                    addLog(`降低${type}失败: 将导致无效状态`, "error");
                    alert("降低失败: 操作后数值将进入禁区或超出边界！");
                    return;
                }
                updateDisplay();
                const typeMap = { content: "粒子含量", chaos: "粒子混乱度", stability: "结构稳定度" };
                addLog(`降低${typeMap[type]} 1点，剩余机会: ${state.reduceChances}`, "reduce");
            });
        });

        resetBtn.addEventListener('click', () => {
            const activeTemplate = container.querySelector('.forge-tpl.active').dataset.template;
            const tpl = templates[activeTemplate];
            state.content = tpl.content;
            state.chaos = tpl.chaos;
            state.stability = tpl.stability;
            state.reduceChances = 7;
            updateDisplay();
            addLog(`模拟已重置 | 当前模板: ${tpl.name} (含量=${tpl.content}, 混乱度=${tpl.chaos}, 稳定度=${tpl.stability})`, "info");
        });

        searchBtn.addEventListener('click', () => {
            if (isSearching) {
                alert("搜索正在进行中，请等待...");
                return;
            }
            const targetContentVal = parseInt(targetContent.value);
            const targetChaosVal = parseInt(targetChaos.value);
            const targetStabilityVal = parseInt(targetStability.value);
            if (isNaN(targetContentVal) || targetContentVal <= 0 || targetContentVal >= 300 ||
                isNaN(targetChaosVal) || targetChaosVal <= 0 || targetChaosVal >= 300 ||
                isNaN(targetStabilityVal) || targetStabilityVal <= 0 || targetStabilityVal >= 300) {
                alert("请输入 1 到 299 之间的有效目标值");
                return;
            }
            isSearching = true;
            searchBtn.disabled = true;
            searchBtn.textContent = "搜索中...";
            searchStatus.innerHTML = '正在搜索最优解，请稍候...';
            searchResult.style.display = 'none';
            searchStats.textContent = "";
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                try {
                    const useRareMaterials = useRareMaterialsCheckbox.checked;
                    const result = heuristicSearch(
                        targetContentVal, targetChaosVal, targetStabilityVal,
                        parseInt(searchDepth.value), useRareMaterials
                    );
                    displayResult(result, targetContentVal, targetChaosVal, targetStabilityVal, useRareMaterials);
                } catch (error) {
                    searchStatus.innerHTML = `搜索错误: ${error.message}`;
                } finally {
                    isSearching = false;
                    searchBtn.disabled = false;
                    searchBtn.textContent = "开始搜索";
                }
            }, 100);
        });

        // ---------- 7. 启发式搜索 ----------
        function heuristicSearch(targetContent, targetChaos, targetStability, maxDepth, useRareMaterials) {
            const startTime = Date.now();
            let visitedStates = 0;

            const availableMaterials = {};
            Object.keys(materials).forEach(key => {
                if (!useRareMaterials && materials[key].rare) {
                    return;
                }
                const mat = materials[key];
                availableMaterials[key] = mat.effects.map(eff => ({
                    funnel: eff.funnel,
                    type: eff.type,
                    min: eff.min,
                    max: eff.max,
                    avg: Math.round((eff.min + eff.max) / 2)
                }));
            });

            const startState = {
                content: state.content,
                chaos: state.chaos,
                stability: state.stability,
                reduceChances: state.reduceChances,
                steps: [],
                cost: 0,
                heuristic: 0
            };

            function calculateHeuristic(s) {
                return Math.abs(s.content - targetContent) +
                       Math.abs(s.chaos - targetChaos) +
                       Math.abs(s.stability - targetStability);
            }

            startState.heuristic = calculateHeuristic(startState);

            const queue = [startState];
            const visited = new Set();
            const stateKey = (s) => `${s.content},${s.chaos},${s.stability},${s.reduceChances}`;
            visited.add(stateKey(startState));

            function isGoalState(s) {
                return s.content === targetContent &&
                       s.chaos === targetChaos &&
                       s.stability === targetStability;
            }

            function isValidStateForSearch(s) {
                if (s.content <= 0 || s.content >= 300) return false;
                if (s.chaos <= 0 || s.chaos >= 300) return false;
                if (s.stability <= 0 || s.stability >= 300) return false;
                for (const [min, max] of forbiddenZones.content) {
                    if (s.content >= min && s.content <= max) return false;
                }
                for (const [min, max] of forbiddenZones.chaos) {
                    if (s.chaos >= min && s.chaos <= max) return false;
                }
                for (const [min, max] of forbiddenZones.stability) {
                    if (s.stability >= min && s.stability <= max) return false;
                }
                return true;
            }

            const maxStates = 50000;
            let bestState = null;
            let bestHeuristic = Infinity;

            while (queue.length > 0 && visitedStates < maxStates) {
                visitedStates++;
                queue.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
                const current = queue.shift();

                if (isGoalState(current)) {
                    searchStats.textContent = `搜索完成: 检查了 ${visitedStates} 个状态，耗时 ${Date.now() - startTime}ms`;
                    return {
                        success: true,
                        steps: current.steps,
                        stats: { visitedStates, time: Date.now() - startTime, cost: current.cost }
                    };
                }

                if (current.heuristic < bestHeuristic) {
                    bestHeuristic = current.heuristic;
                    bestState = current;
                }

                if (current.steps.length >= maxDepth) continue;

                for (const [matKey, effects] of Object.entries(availableMaterials)) {
                    for (const eff of effects) {
                        const newState = {
                            content: current.content,
                            chaos: current.chaos,
                            stability: current.stability,
                            reduceChances: current.reduceChances,
                            steps: [...current.steps],
                            cost: current.cost + 1,
                            heuristic: 0
                        };
                        const change = eff.avg;
                        if (eff.type === 'content') newState.content += change;
                        else if (eff.type === 'chaos') newState.chaos += change;
                        else if (eff.type === 'stability') newState.stability += change;

                        newState.heuristic = calculateHeuristic(newState);

                        if (isValidStateForSearch(newState)) {
                            const key = stateKey(newState);
                            if (!visited.has(key)) {
                                visited.add(key);
                                newState.steps.push({ type: 'material', matKey, funnel: eff.funnel, effect: { type: eff.type, value: change } });
                                queue.push(newState);
                            }
                        }
                    }
                }

                if (current.reduceChances > 0) {
                    const types = ['content', 'chaos', 'stability'];
                    for (const type of types) {
                        const newState = {
                            content: current.content,
                            chaos: current.chaos,
                            stability: current.stability,
                            reduceChances: current.reduceChances - 1,
                            steps: [...current.steps],
                            cost: current.cost + 1,
                            heuristic: 0
                        };
                        if (type === 'content') newState.content -= 1;
                        else if (type === 'chaos') newState.chaos -= 1;
                        else if (type === 'stability') newState.stability -= 1;

                        newState.heuristic = calculateHeuristic(newState);

                        if (isValidStateForSearch(newState)) {
                            const key = stateKey(newState);
                            if (!visited.has(key)) {
                                visited.add(key);
                                newState.steps.push({ type: 'reduce', targetType: type });
                                queue.push(newState);
                            }
                        }
                    }
                }
            }

            searchStats.textContent = `搜索完成: 检查了 ${visitedStates} 个状态，耗时 ${Date.now() - startTime}ms`;

            if (bestState && bestState.heuristic < 10) {
                return {
                    success: true,
                    steps: bestState.steps,
                    stats: { visitedStates, time: Date.now() - startTime, cost: bestState.cost },
                    approximate: true,
                    finalState: { content: bestState.content, chaos: bestState.chaos, stability: bestState.stability }
                };
            }

            return {
                success: false,
                stats: { visitedStates, time: Date.now() - startTime },
                bestState: bestState ? {
                    content: bestState.content,
                    chaos: bestState.chaos,
                    stability: bestState.stability,
                    steps: bestState.steps
                } : null
            };
        }

        // ---------- 8. 显示搜索结果 ----------
        function displayResult(result, targetContentVal, targetChaosVal, targetStabilityVal, useRareMaterials) {
            searchResult.style.display = 'block';

            if (result.success) {
                let output = `🎯 目标值: 含量=${targetContentVal}, 混乱度=${targetChaosVal}, 稳定度=${targetStabilityVal}\n`;
                output += `📊 搜索统计: ${result.stats.visitedStates}个状态, ${result.stats.time}ms\n`;
                output += `💎 珍贵材料: ${useRareMaterials ? '使用' : '未使用'}\n`;

                if (result.approximate) {
                    output += `⚠️ 注意: 未找到精确解，以下是接近的解决方案\n`;
                    output += `最终数值: 含量=${result.finalState.content}, 混乱度=${result.finalState.chaos}, 稳定度=${result.finalState.stability}\n`;
                } else {
                    output += `✅ 找到精确解！\n`;
                }

                output += `📦 材料使用次数: ${result.steps.filter(p => p.type === 'material').length}\n`;
                output += `🔁 降低操作次数: ${result.steps.filter(p => p.type === 'reduce').length}\n`;
                output += `\n操作步骤:\n`;

                let tempState = { ...state };
                result.steps.forEach((step, i) => {
                    if (step.type === 'material') {
                        const mat = materials[step.matKey];
                        const typeMap = { content: "粒子含量", chaos: "粒子混乱度", stability: "结构稳定度" };
                        output += `${i+1}. 添加 ${mat.name} 到漏斗${step.funnel}: ${typeMap[step.effect.type]} ${step.effect.value > 0 ? '+' : ''}${step.effect.value}\n`;
                        if (step.effect.type === 'content') tempState.content += step.effect.value;
                        else if (step.effect.type === 'chaos') tempState.chaos += step.effect.value;
                        else if (step.effect.type === 'stability') tempState.stability += step.effect.value;
                    } else {
                        const typeMap = { content: "粒子含量", chaos: "粒子混乱度", stability: "结构稳定度" };
                        output += `${i+1}. 降低 ${typeMap[step.targetType]} 1点\n`;
                        if (step.targetType === 'content') tempState.content -= 1;
                        else if (step.targetType === 'chaos') tempState.chaos -= 1;
                        else if (step.targetType === 'stability') tempState.stability -= 1;
                    }
                });

                if (!result.approximate) {
                    output += `\n✅ 最终数值完全匹配目标！`;
                } else {
                    output += `\n📈 最终差值: 含量差=${Math.abs(tempState.content - targetContentVal)}, 混乱度差=${Math.abs(tempState.chaos - targetChaosVal)}, 稳定度差=${Math.abs(tempState.stability - targetStabilityVal)}`;
                }

                searchResult.innerHTML = output;
                searchStatus.innerHTML = `搜索完成: 找到${result.approximate ? '近似' : '精确'}解`;
            } else {
                let output = `❌ 未找到解决方案\n`;
                output += `📊 搜索统计: ${result.stats.visitedStates}个状态, ${result.stats.time}ms\n`;
                output += `💎 珍贵材料: ${useRareMaterials ? '使用' : '未使用'}\n`;

                if (result.bestState) {
                    output += `\n最接近的解决方案:\n`;
                    output += `最终数值: 含量=${result.bestState.content}, 混乱度=${result.bestState.chaos}, 稳定度=${result.bestState.stability}\n`;
                    output += `与目标差值: 含量差=${Math.abs(result.bestState.content - targetContentVal)}, 混乱度差=${Math.abs(result.bestState.chaos - targetChaosVal)}, 稳定度差=${Math.abs(result.bestState.stability - targetStabilityVal)}\n`;
                    output += `\n操作步骤(${result.bestState.steps.length}步):\n`;

                    result.bestState.steps.forEach((step, i) => {
                        if (step.type === 'material') {
                            const mat = materials[step.matKey];
                            const typeMap = { content: "粒子含量", chaos: "粒子混乱度", stability: "结构稳定度" };
                            output += `${i+1}. 添加 ${mat.name} 到漏斗${step.funnel}: ${typeMap[step.effect.type]} ${step.effect.value > 0 ? '+' : ''}${step.effect.value}\n`;
                        } else {
                            const typeMap = { content: "粒子含量", chaos: "粒子混乱度", stability: "结构稳定度" };
                            output += `${i+1}. 降低 ${typeMap[step.targetType]} 1点\n`;
                        }
                    });
                }

                searchResult.innerHTML = output;
                searchStatus.innerHTML = `搜索完成: 未找到解决方案`;
            }
        }

        // ---------- 9. 初始化 ----------
        funnelOptions[0].classList.add('selected');
        updateDisplay();
        updateMaterialDesc();

        // ---------- 10. 右侧使用说明（内容来自 forging.txt） ----------
        const docBtns = container.querySelectorAll('.forge-doc-btn');
        const docText = container.querySelector('#forge-doc-text');
        const DOCS = {
            must: [
                '圣书锻造教程',
                '在你的前方有3个漏斗,请根据条件在3个漏斗里放置物品,完成后请点击按钮进行一次结算。锻造被分为3个进度条。不同物品带来的结算会对这些进度条造成一定的影响,当3个进度条的值被调整到你所需要的物品的值时,点击漏斗下方的按钮进行最终结算,进行物品产出。',
                '',
                '三个进度条分别是:',
                '粒子含量,粒子混乱度,结构稳定度',
                '面朝讲台,讲台左侧的漏斗被称为粒子漏斗,中间漏斗被称为调序漏斗,右侧漏斗被称为注魔漏斗。同一种材料在不同漏斗中结算的效果不同。',
                '锻造前需要选择模板,不同的模板有不同的初始进度值。选择模板后如果满足条件将立刻开始锻造。',
                '',
                '特别提醒:任意进度条超过300或低于0将直接作废,同时锻造区间中存在一些禁数,触碰禁数也将直接锻造作废,请在锻造中合理规避禁数。',
                '每次锻造只能使用一种漏斗,如果出现多个漏斗中同时存在物品,那么锻造将无效。',
                '点击锻造按钮时请确保至少一个漏斗中存在物品。',
                '每次点击锻造按钮要消耗150银币',
                '',
                '星晶机制',
                '玩家可以通过星晶来微调锻造进度,在锻造台左侧使用星晶,每次使用可以降低任意一点锻造进度。在一次锻造中星晶最多可以使用7次',
                '模板机制',
                '模板是决定锻造初始值的,通过激活不同模板来使锻造有不同的初始值,更便于锻造自己需要的物品,使用模板后将立刻开始锻造。',
                '',
                '锻造和最终结算机制详解',
                '每次只能从粒子漏斗,调序漏斗,注魔漏斗中选择一个,将自己的锻造材料放在该漏斗的第一个格子里,点击前方红石灯进行一次结算,对3种进度造成对应的影响,将进度调到与产物相同时,点击前方的最终结算按钮,进行产出,每次点击红石灯要消耗150银币,当当前的进度没有合适的产物时,点击最终结算按钮将结束本次锻造,记录锻造数据并重置锻造台。',
            ].join('\n'),
            materials: [
                '材料效果表:',
                '注:每个材料会按照x/x/x的形式来记录,分别代表把材料放入粒子漏斗,调序漏斗和注魔漏斗对进度条的影响',
                '例如:铁',
                '-/稳定增加15到25/-',
                '"-"表示添加到此处无效果',
                '以下会把粒子含量/粒子混乱度/结构稳定度简称为含量,混乱,稳定',
                '当材料写增加某到某时,说明这次结算会从这个数值区间中随机选一个数结算材料效果',
                '',
                '1.铁锭*9',
                '-/稳定+15到+25/-',
                '2.金锭*8',
                '含量+20到+30/混乱+10到+20/含量+8到+17',
                '3.石英*3',
                '混乱-25到-35/含量-15到-25/混乱-10到-15',
                '4.烈焰棒*1',
                '含量+40到+50/混乱+30到+40/含量+25到+27',
                '5.龙息*16',
                '含量+8到+12/含量+20到+30/-',
                '6.爆裂紫颂果*16',
                '-/混乱+20到+30/混乱+15到+20',
                '7.钻石*3',
                '-/混乱-40到-50/稳定+40到+50',
                '8.黑曜石',
                '-/混乱-25/稳定+45到+60',
                '9.哭泣的黑曜石',
                '含量+60到+75/混乱+40到+50/混乱+30到+40',
                '10.粒子水晶*2',
                '稳定+10到+15/混乱-8到-12/含量+5到+10',
                '十一.幻尘之沙*1',
                '含量+4到+6/-/混乱+22到+25',
                '十二.下界合金锭*1',
                '-/混乱-50到-52/稳定+80到+82',
                '十三.末影结晶',
                '含量+28到+30/混乱+28到+30/-',
                '十四.纯净影晶*1',
                '含量+6/混乱+6/-',
                '十五.粒子圣晶',
                '含量+80到+81/含量-6/稳定-6',
            ].join('\n'),
            products: [
                '需要将3种进度条精确调控到对应产物的锻造值上,点击最终结算按钮后产出。',
                '产物介绍格式:',
                '物品/所需粒子含量/所需粒子混乱度/所需结构稳定度',
                '',
                '<span style="color:#55FFFF">粒子圣书&lt;粒子构筑·屏障&gt;</span>',
                '含量80/混乱120/结构260',
                '原地吟唱一段时间后展开防御屏障,展开屏障期间对半径2格的怪持续造成2点击退伤害,同时给予半径4格的全部玩家抗性提升3,3半径6格的怪造成缓慢II',
                '吟唱时间:3s',
                '持续时间:7s',
                '使用期间每秒消耗2级经验,增加2s排斥粒子和特殊粒子冷却,切换手中物品和移动会中断技能',
                '',
                '<span style="color:#55FF55">粒子圣书&lt;粒子连携·守护&gt;</span>',
                '含量100/混乱220/结构100',
                '粒子量20级且冷却全部为0后手持圣书低头可以触发,触发后无需一直低头。',
                '触发后每0.5s吟唱增加2s排斥粒子冷却,3s支援粒子冷却,1s末影粒子冷却,消耗1级粒子量并增加1点吟唱值,切换其他物品或者进行较大移动会中断吟唱,吟唱期间自身持续获得3s缓慢III',
                '吟唱值到达17点后对半径6格内玩家持续给予3s生命恢复III,同时每10延迟刻对半径5格以内的敌人造成1点击退的打击伤害。',
                '吟唱值到达25点后触发技能并结束吟唱,给予半径7格内玩家30s伤害吸收IV,30s抗性提升II,30s速度II',
                '注:吟唱期间粒子量低于1会不增加吟唱值和技能冷却,等粒子量回复到1后继续增加吟唱,所以如果粒子量不足会导致吟唱后期速度变慢。',
                '',
                '<span style="color:#FFAA00">粒子圣书&lt;粒子连携·岩域&gt;</span>',
                '含量280/混乱90/结构150',
                '触发与维持条件同连携守护',
                '触发后每0.5s增加2s排斥粒子冷却,1s末影粒子冷却,3s特殊粒子冷却,消耗1级粒子量并增加1级吟唱值。',
                '吟唱值达到10后对半径8格敌人造成1s缓慢x',
                '吟唱值在13到20间给予半径8格玩家2s力量III',
                '吟唱值达到17后持续给予半径8格玩家8s速度II',
                '吟唱值在20到25时每0.5s对半径10格敌人造成5点伤害',
                '吟唱值在23到25时每0.5s给予半径10格敌人10层燃烧',
                '吟唱值达到25级时释放技能,结束吟唱并给予半径8格玩家20s力量II',
                '',
                '<span style="color:#FF5555">粒子圣书&lt;粒子超载·连接&gt;</span>',
                '含量295/混乱30/结构295',
                '手持低头触发吟唱,原地吟唱5s后进入连接状态,获得超强增幅:',
                '粒子量锁定为15级,无法增加和减少',
                '排斥粒子冷却时间变为原来的五分之一',
                '获得力量I和速度II效果',
                '特殊粒子被禁用,特殊粒子冷却时间被锁定为5s',
                '连接状态持续25s',
                '连接结束后如果命数大于等于2则会损失一条命数。同时粒子量归零,排斥粒子cd被设定为200s',
                '',
                '<span style="color:#FF5555">粒子圣核</span>',
                '含量250/混乱150/结构290',
            ].join('\n'),
        };
        docBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                docBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                docText.innerHTML = DOCS[btn.dataset.doc] || '';
            });
        });
        // 默认展示「锻造须看」内容
        docText.innerHTML = DOCS[docBtns[0].dataset.doc] || '';
    }
};
