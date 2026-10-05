// ============================================================
// 文件名: fun.js
// 说明: 休闲娱乐区渲染器（多项目入口）
//       遍历 FUNS，为每个项目动态生成卡片 + 子导航锚点。
//       新增娱乐项目：新建 fun/xxx.js 导出 { id, title, render }，
//       并在此处 import 后加入 FUNS 数组即可。
// ============================================================
import { crateSimulator } from './crate_simulator.js';
import { gachaSimulator } from './gacha_simulator.js';

// 项目注册表（新增娱乐项目在此追加）
const FUNS = [crateSimulator, gachaSimulator];

// ---------- 1. 通用样式（作用于所有 .fun-app 卡片体 + 子导航） ----------
const style = document.createElement('style');
style.textContent = `
    .fun-app {
        color: #e0e0f0;
        width: 100%;
    }
    /* .sub-nav / .sub-nav-link / .sub-nav-separator 已由 style.css 全局提供 */
    #fun-apps .fun-card {
        margin-bottom: 24px;
    }
    #fun-apps .fun-card:last-child {
        margin-bottom: 0;
    }
`;
document.head.appendChild(style);

// ---------- 2. 渲染所有娱乐项目 ----------
const host = document.getElementById('fun-apps');
if (host) {
    // 子导航（锚点跳转到对应卡片）
    const subNav = document.createElement('nav');
    subNav.className = 'sub-nav';
    FUNS.forEach((item, i) => {
        if (i > 0) {
            const sep = document.createElement('span');
            sep.className = 'sub-nav-separator';
            sep.textContent = '|';
            subNav.appendChild(sep);
        }
        const link = document.createElement('a');
        link.className = 'sub-nav-link';
        link.href = `#fun-card-${item.id}`;
        link.textContent = item.title;
        subNav.appendChild(link);
    });
    host.appendChild(subNav);

    // 每项目一张卡片
    for (const item of FUNS) {
        const card = document.createElement('article');
        card.className = 'content-card fun-card';
        card.id = `fun-card-${item.id}`;

        const title = document.createElement('h2');
        title.className = 'content-title';
        title.textContent = item.title;
        card.appendChild(title);

        const body = document.createElement('div');
        body.className = 'fun-app';
        card.appendChild(body);

        host.appendChild(card);
        if (typeof item.render === 'function') {
            item.render(body);
        }
    }
}
