// ============================================================
// 文件名: melee_damage_calculator.js
// 说明: 基岩版近战伤害核心计算模块（无 UI 依赖）
// ============================================================

export function calculateMeleeDamage(B, M, p, w, version, critical) {
    const strMult = Math.pow(1.3, p);
    const weakMult = Math.pow(0.8, w);
    const combined = weakMult * strMult;

    let d0 = (version === 'new') ? (B + M) : B;

    let damage = combined * d0;
    damage += (10 / 3) * weakMult * (strMult - 1);
    damage += (5 / 2) * (weakMult - 1);

    if (version === 'old') {
        damage += M;
    }

    const rawPreCritical = damage;
    if (critical) {
        damage *= 1.5;
    }

    const preCritical = Math.max(0, rawPreCritical);
    const finalDamage = Math.max(0, damage);

    return { preCritical, final: finalDamage };
}