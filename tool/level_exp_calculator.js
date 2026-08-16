// ============================================================
// 文件名: level_exp_calculator.js
// 说明: 等级和经验值计算器（内容暂时置空，后续补充）
//       通过 levelExpTool 定义导出，供 tool.js 泛化渲染。
// ============================================================

export const levelExpTool = {
    id: 'level-exp',
    title: '📈 等级和经验值计算器',
    // 自定义渲染：内容暂时置空，后续补充
    render(container) {
        container.innerHTML = `
            <div style="padding: 18px; text-align: center; color: var(--text-secondary, #b0b0c8); font-size: 1rem; line-height: 1.8;">
                📈 等级和经验值计算器<br>
                <span style="font-size: 0.85rem;">内容建设中，敬请期待…</span>
            </div>
        `;
    }
};
