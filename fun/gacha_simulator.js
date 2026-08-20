// ============================================================
// 文件名: gacha_simulator.js
// 说明: 一周年新春祈愿抽奖模拟器
// ============================================================

export const gachaSimulator = {
    id: 'gacha',
    title: '🧧 一周年新春祈愿',
    render(container) {
        container.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--text-secondary, #b0b0c8); font-size: 1rem; line-height: 1.8;">
                🧧 一周年新春祈愿<br>
                <span style="font-size: 0.85rem;">由于无法获取概率表，该功能暂停开发</span>
            </div>
        `;
    }
};
