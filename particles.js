// Particle class for explosion effects
class Particle {
    constructor(x, y, color = '#0ff', size = 2, velocity = null) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.alpha = 1;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;

        if (velocity) {
            this.vx = velocity.x;
            this.vy = velocity.y;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life);

        // Slow down particles
        this.vx *= 0.98;
        this.vy *= 0.98;

        return this.life > 0;
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
}

// Particle system for managing multiple particles
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, count = 20, color = '#0ff', size = 2) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, size));
        }
    }

    createThrustParticle(x, y, angle, shipVelocity) {
        // Create particle behind the ship with opposite direction to thrust
        const spreadAngle = (Math.random() - 0.5) * 0.3;
        const particleAngle = angle + Math.PI + spreadAngle;
        const speed = Math.random() * 2 + 1;

        const velocity = {
            x: Math.cos(particleAngle) * speed + shipVelocity.x * 0.5,
            y: Math.sin(particleAngle) * speed + shipVelocity.y * 0.5
        };

        const colors = ['#0ff', '#0aa', '#0cc', '#fff'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push(new Particle(x, y, color, Math.random() * 2 + 1, velocity));
    }

    createBulletTrail(x, y, vx, vy) {
        const velocity = {
            x: vx * 0.1,
            y: vy * 0.1
        };
        this.particles.push(new Particle(x, y, '#0ff', 1.5, velocity));
    }

    createPowerUpEffect(x, y, color) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = Math.random() * 4 + 2;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            this.particles.push(new Particle(x, y, color, Math.random() * 3 + 1, velocity));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(particle => particle.update(dt));
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

// Starfield background with parallax effect
class Starfield {
    constructor(canvas) {
        this.canvas = canvas;
        this.stars = [];
        this.layers = 3;
        this.initStars();
    }

    initStars() {
        this.stars = [];
        const starCount = 150;

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.5,
                layer: Math.floor(Math.random() * this.layers),
                twinkleSpeed: Math.random() * 0.05 + 0.02,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }

    update(dt, shipVx = 0, shipVy = 0) {
        // Parallax scrolling based on ship velocity
        this.stars.forEach(star => {
            const parallaxFactor = (star.layer + 1) * 0.02;
            star.x -= shipVx * parallaxFactor;
            star.y -= shipVy * parallaxFactor;

            // Wrap stars around screen
            if (star.x < 0) star.x = this.canvas.width;
            if (star.x > this.canvas.width) star.x = 0;
            if (star.y < 0) star.y = this.canvas.height;
            if (star.y > this.canvas.height) star.y = 0;

            // Twinkling effect
            star.twinklePhase += star.twinkleSpeed;
        });
    }

    draw(ctx) {
        this.stars.forEach(star => {
            const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
            const alpha = star.brightness * twinkle;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = star.size * 2;
            ctx.shadowColor = '#fff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.initStars();
    }
}

// Screen shake effect
class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    shake(intensity = 10, duration = 0.3) {
        this.intensity = Math.max(this.intensity, intensity);
        this.duration = Math.max(this.duration, duration);
    }

    update(dt) {
        if (this.duration > 0) {
            this.duration -= dt;
            const currentIntensity = this.intensity * (this.duration / 0.3);
            this.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
            this.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
            this.intensity = 0;
        }
    }

    apply(ctx) {
        ctx.translate(this.offsetX, this.offsetY);
    }

    reset() {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}

// Sound effects using Web Audio API
class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.thrustOscillator = null;
        this.thrustGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playShoot() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playExplosion(size = 1) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200 * size, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.4 * size, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playPowerUp() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    playHyperspace() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    startThrust() {
        if (!this.audioContext || this.thrustOscillator) return;

        this.thrustOscillator = this.audioContext.createOscillator();
        this.thrustGain = this.audioContext.createGain();

        this.thrustOscillator.connect(this.thrustGain);
        this.thrustGain.connect(this.audioContext.destination);

        this.thrustOscillator.type = 'sawtooth';
        this.thrustOscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);

        this.thrustGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.thrustGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);

        this.thrustOscillator.start(this.audioContext.currentTime);
    }

    stopThrust() {
        if (!this.thrustOscillator || !this.thrustGain) return;

        this.thrustGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        this.thrustOscillator.stop(this.audioContext.currentTime + 0.1);
        this.thrustOscillator = null;
        this.thrustGain = null;
    }

    playButtonClick() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    playUFO() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
}
