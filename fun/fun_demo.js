// ============================================================
// 文件名: fun_demo.js
// 说明: 示例娱乐项目（占位，供 fun.js 渲染示范）
//       新增娱乐项目可仿照本文件导出 { id, title, render }
// ============================================================

export const funDemo = {
    id: 'demo',
    title: '🎲 示例娱乐',
    render(container) {
        container.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--text-secondary, #b0b0c8); font-size: 1rem; line-height: 1.8;">
                这里放示例娱乐内容<br>
                <span style="font-size: 0.85rem;">新建 fun/xxx.js 导出 { id, title, render }，并在 fun.js 的 FUNS 注册即可。</span>
            </div>
        `;
    }
};
