// 动态生成导航栏
document.addEventListener('DOMContentLoaded', function() {
    const navSection = document.getElementById('main-nav');
    if (navSection) {
        navSection.innerHTML = `
            <span class="nav-label">导航/目录</span>
            <nav class="main-nav">
                <a href="preface.html" class="nav-link">序言</a>
                <span class="nav-separator">·</span>
                <a href="point.html" class="nav-link">点位汇总</a>
                <span class="nav-separator">·</span>
                <a href="mob.html" class="nav-link">小怪详情</a>
                <span class="nav-separator">·</span>
                <a href="boss.html" class="nav-link">BOSS详情</a>
                <span class="nav-separator">·</span>
                <a href="item.html" class="nav-link">物品图鉴</a>
                <span class="nav-separator">·</span>
                <a href="player.html" class="nav-link">玩家图鉴</a>
                <a href="interesting_thing.html" class="nav-link nav-hidden" style="margin-left: auto;">粒子趣事</a>
            </nav>
        `;
    }
});

// 粒子背景动画（原有代码保持不变）
(function() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const connectionDistance = 130;
    const mouseInfluenceDistance = 160;
    let mouseX = -9999;
    let mouseY = -9999;

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
            this.hue = Math.random() < 0.5 ?
                (Math.random() * 40 + 170) :
                (Math.random() * 30 + 250);
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
            const distM = Math.sqrt(dxM * dxM + dyM * dyM);
            if (distM < mouseInfluenceDistance && distM > 0.1) {
                const force = (1 - distM / mouseInfluenceDistance) * 0.5;
                this.vx -= (dxM / distM) * force * 0.12;
                this.vy -= (dyM / distM) * force * 0.12;
                this.alpha = Math.min(1, this.baseAlpha + force * 0.5);
            } else {
                this.alpha += (this.baseAlpha - this.alpha) * 0.04;
            }
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const maxSpeed = 1.0;
            if (speed > maxSpeed) {
                this.vx = (this.vx / speed) * maxSpeed;
                this.vy = (this.vy / speed) * maxSpeed;
            }
            const minSpeed = 0.2;
            if (speed < minSpeed && speed > 0) {
                this.vx = (this.vx / speed) * minSpeed;
                this.vy = (this.vy / speed) * minSpeed;
            }
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`;
            ctx.fill();
            if (this.alpha > 0.5) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
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
        const area = width * height;
        const targetCount = Math.min(140, Math.max(50, Math.floor(area / 14000)));
        while (particles.length < targetCount) {
            particles.push(new Particle());
        }
        while (particles.length > targetCount) {
            particles.pop();
        }
    }

    function initParticles() {
        particles = [];
        const area = (width || window.innerWidth) * (height || window.innerHeight);
        const targetCount = Math.min(140, Math.max(50, Math.floor(area / 14000)));
        for (let i = 0; i < targetCount; i++) {
            const p = new Particle();
            p.x = Math.random() * (width || window.innerWidth);
            p.y = Math.random() * (height || window.innerHeight);
            particles.push(p);
        }
    }

    function drawConnections(ctx) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
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

    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function onMouseLeave() {
        mouseX = -9999;
        mouseY = -9999;
    }

    function onTouchMove(e) {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    }

    function onTouchEnd() {
        mouseX = -9999;
        mouseY = -9999;
    }

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
})();