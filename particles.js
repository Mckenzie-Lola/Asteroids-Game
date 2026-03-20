// Particle System for Visual Effects

class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;

        // Fade out
        if (this.alpha < 0) this.alpha = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Create explosion particles
    createExplosion(x, y, count, color, speed = 1) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const velocity = (Math.random() * 2 + 1) * speed;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            const size = Math.random() * 3 + 1;
            const life = Math.random() * 30 + 20;

            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }

    // Create debris particles
    createDebris(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 3 + 1;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            const size = Math.random() * 2 + 1;
            const life = Math.random() * 40 + 30;

            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }

    // Create thrust trail particles
    createThrustParticle(x, y, angle) {
        const spread = 0.3;
        const particleAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
        const velocity = Math.random() * 2 + 1;
        const vx = Math.cos(particleAngle) * velocity;
        const vy = Math.sin(particleAngle) * velocity;
        const size = Math.random() * 2 + 1;
        const life = Math.random() * 15 + 10;

        const colors = ['#ff6600', '#ff9900', '#ffcc00'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push(new Particle(x, y, vx, vy, color, size, life));
    }

    // Create bullet trail
    createBulletTrail(x, y) {
        const vx = (Math.random() - 0.5) * 0.5;
        const vy = (Math.random() - 0.5) * 0.5;
        const size = Math.random() * 1.5 + 0.5;
        const life = Math.random() * 10 + 5;

        this.particles.push(new Particle(x, y, vx, vy, '#00ffff', size, life));
    }

    update(deltaTime) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);

            // Remove dead particles
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

// Star field background with parallax
class Starfield {
    constructor(width, height, count = 200) {
        this.width = width;
        this.height = height;
        this.stars = [];

        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2,
                layer: Math.floor(Math.random() * 3) // 3 parallax layers
            });
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    update(shipVX, shipVY) {
        this.stars.forEach(star => {
            // Parallax effect based on layer
            const parallaxFactor = (star.layer + 1) * 0.02;
            star.x -= shipVX * parallaxFactor;
            star.y -= shipVY * parallaxFactor;

            // Wrap around screen
            if (star.x < 0) star.x = this.width;
            if (star.x > this.width) star.x = 0;
            if (star.y < 0) star.y = this.height;
            if (star.y > this.height) star.y = 0;

            // Twinkle effect
            star.twinklePhase += star.twinkleSpeed;
        });
    }

    draw(ctx) {
        this.stars.forEach(star => {
            const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
            const alpha = star.brightness * twinkle;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = star.size * 2;
            ctx.shadowColor = '#ffffff';

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }
}

// Screen shake effect
class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
    }

    shake(intensity, duration) {
        this.intensity = Math.max(this.intensity, intensity);
        this.duration = Math.max(this.duration, duration);
    }

    update(deltaTime) {
        if (this.duration > 0) {
            this.duration -= deltaTime;
            if (this.duration <= 0) {
                this.intensity = 0;
            }
        }
    }

    getOffset() {
        if (this.intensity > 0) {
            return {
                x: (Math.random() - 0.5) * this.intensity,
                y: (Math.random() - 0.5) * this.intensity
            };
        }
        return { x: 0, y: 0 };
    }
}
