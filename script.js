document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // 计算相对当前页面的站点根前缀（page/、tool/、fun/ 子目录需要 ../，兼容 GitHub Pages 子路径部署）
        const path = window.location.pathname;
        const prefix = (path.includes('/page/') || path.includes('/tool/') || path.includes('/fun/')) ? '../' : '';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <img src="${prefix}picture/粒子维度俯瞰全景图.webp" alt="粒子维度俯瞰全景图" class="sidebar-thumbnail">
                <h1 class="sidebar-title">粒子维度 附属Wiki</h1>
            </div>
            <nav class="sidebar-nav">
                <a href="${prefix}index.html" class="nav-btn">序言</a>
                <a href="${prefix}page/point.html" class="nav-btn">点位汇总</a>
                <a href="${prefix}page/mob.html" class="nav-btn">小怪详情</a>
                <a href="${prefix}page/boss.html" class="nav-btn">BOSS详情</a>
                <a href="${prefix}page/item.html" class="nav-btn">物品图鉴</a>
                <a href="${prefix}page/forging.html" class="nav-btn">锻造、饰品与道具</a>
                <a href="${prefix}page/player.html" class="nav-btn">玩家图鉴</a>
                <a href="${prefix}tool/index.html" class="nav-btn">工具调用</a>
                <a href="${prefix}fun/index.html" class="nav-btn">休闲娱乐</a>
            </nav>
        `;
    }
});

// 粒子背景动画
(function() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const connectionDistance = 130;
    const mouseInfluenceDistance = 160;
    let mouseX = -9999, mouseY = -9999;

    class Particle {
        constructor() {
            this.reset();
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        }
        reset() {
            this.x = Math.random() * (width || window.innerWidth);
            this.y = Math.random() * (height || window.innerHeight);
            this.vx = (Math.random() - 0.5) * 0.45;
            this.vy = (Math.random() - 0.5) * 0.45;
            this.radius = Math.random() * 1.8 + 0.6;
            this.baseAlpha = Math.random() * 0.4 + 0.18;
            this.alpha = this.baseAlpha;
            this.hue = Math.random() < 0.5 ? (Math.random() * 40 + 170) : (Math.random() * 30 + 250);
            this.saturation = Math.random() * 30 + 55;
            this.lightness = Math.random() * 25 + 60;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < -20) this.x = width + 20;
            if (this.x > width + 20) this.x = -20;
            if (this.y < -20) this.y = height + 20;
            if (this.y > height + 20) this.y = -20;
            const dxM = mouseX - this.x;
            const dyM = mouseY - this.y;
            const distM = Math.sqrt(dxM*dxM + dyM*dyM);
            if (distM < mouseInfluenceDistance && distM > 0.1) {
                const force = (1 - distM / mouseInfluenceDistance) * 0.5;
                this.vx -= (dxM / distM) * force * 0.12;
                this.vy -= (dyM / distM) * force * 0.12;
                this.alpha = Math.min(1, this.baseAlpha + force * 0.5);
            } else {
                this.alpha += (this.baseAlpha - this.alpha) * 0.04;
            }
            const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
            if (speed > 1.0) { this.vx = (this.vx / speed) * 1.0; this.vy = (this.vy / speed) * 1.0; }
            if (speed < 0.2 && speed > 0) { this.vx = (this.vx / speed) * 0.2; this.vy = (this.vy / speed) * 0.2; }
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
            ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`;
            ctx.fill();
            if (this.alpha > 0.5) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI*2);
                ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha * 0.15})`;
                ctx.fill();
            }
        }
    }

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        const targetCount = 110; // 强制 PC 端：固定粒子数量，不随窗口缩放
        while (particles.length < targetCount) particles.push(new Particle());
        while (particles.length > targetCount) particles.pop();
    }

    function initParticles() {
        particles = [];
        const targetCount = 110; // 强制 PC 端：固定粒子数量
        for (let i = 0; i < targetCount; i++) {
            const p = new Particle();
            p.x = Math.random() * window.innerWidth;
            p.y = Math.random() * window.innerHeight;
            particles.push(p);
        }
    }

    function drawConnections(ctx) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < connectionDistance) {
                    const opacity = (1 - dist / connectionDistance) * 0.18;
                    const midHue = (particles[i].hue + particles[j].hue) / 2;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `hsla(${midHue}, 50%, 70%, ${opacity})`;
                    ctx.lineWidth = 0.4;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
            p.update();
            p.draw(ctx);
        }
        drawConnections(ctx);
        requestAnimationFrame(animate);
    }

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
    document.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });
    document.addEventListener('touchmove', e => { if (e.touches[0]) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; } });
    document.addEventListener('touchend', () => { mouseX = -9999; mouseY = -9999; });
})();