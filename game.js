const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Game variables
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    speed: 5,
    health: 100,
    shield: 50,
};

const weapons = {
    pistol: { damage: 10, fireRate: 300, bulletSpeed: 8, ammo: 30, maxAmmo: 30 },
};

const storm = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: canvas.width / 2,
    shrinkRate: 0.02, // Shrink rate to make it take 2 minutes to fully shrink
    damage: 1, // Damage the storm does per frame
};

let bullets = [];
let enemies = [];
let ammoBoxes = [];
let lastShot = 0;
let killStreak = 0;

// Input
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

// Shooting
function shoot() {
    const weapon = weapons.pistol;
    if (weapon.ammo > 0 && Date.now() - lastShot > weapon.fireRate) {
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 5,
            speed: weapon.bulletSpeed,
            damage: weapon.damage,
        });
        weapon.ammo--;
        lastShot = Date.now();
    }
}

// Spawn enemies
function spawnEnemy() {
    const size = 30;
    enemies.push({
        x: Math.random() * canvas.width,
        y: 0,
        width: size,
        height: size,
        speed: 1, // Slower speed to follow the player
        health: 50,
        damage: 10, // The damage the enemy does to the player
    });
}

// Spawn ammo boxes
function spawnAmmoBox() {
    ammoBoxes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        width: 30,
        height: 30,
    });
}

// Update the game state
function update() {
    // Player movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // Shooting
    if (keys[" "]) shoot();

    // Storm shrinking logic
    storm.radius -= storm.shrinkRate;
    if (storm.radius < 0) storm.radius = 0;

    // Bullets movement
    bullets = bullets.filter((bullet) => {
        bullet.y -= bullet.speed;
        return bullet.y > 0;
    });

    // Enemies movement and checking collisions
    enemies.forEach((enemy, enemyIndex) => {
        // Make enemies follow the player slowly
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Check collision with bullets
        bullets.forEach((bullet, bulletIndex) => {
            if (isColliding(enemy, bullet)) {
                enemy.health -= bullet.damage;
                bullets.splice(bulletIndex, 1); // Remove bullet
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1); // Remove enemy
                    killStreak++; // Increment kill streak
                    document.getElementById("kill-streak").innerText = `Kill Streak: ${killStreak}`;
                }
            }
        });

        // Check collision with player
        if (isColliding(enemy, player)) {
            if (player.shield > 0) {
                player.shield -= enemy.damage;
            } else {
                player.health -= enemy.damage;
            }
            enemies.splice(enemyIndex, 1); // Remove enemy after collision
        }
    });

    // Storm damage to the player
    const distToStorm = Math.hypot(player.x - storm.x, player.y - storm.y);
    if (distToStorm > storm.radius) {
        player.health -= storm.damage;
    }

    // Ammo boxes pickup
    ammoBoxes.forEach((box, index) => {
        if (isColliding(player, box)) {
            weapons.pistol.ammo = weapons.pistol.maxAmmo; // Refill ammo
            ammoBoxes.splice(index, 1); // Remove the ammo box after pickup
        }
    });

    // Drawing
    draw();
    if (player.health > 0) {
        requestAnimationFrame(update);
    } else {
        alert("Game Over!");
        window.location.reload();
    }
}

// Drawing everything on the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw storm
    ctx.beginPath();
    ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fill();

    // Draw player
    ctx.fillStyle = "green";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    bullets.forEach((bullet) => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemies
    enemies.forEach((enemy) => {
        ctx.fillStyle = "red";
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw ammo boxes
    ammoBoxes.forEach((box) => {
        ctx.fillStyle = "blue";
        ctx.fillRect(box.x, box.y, box.width, box.height);
    });

    // Update health, shield, and ammo bars
    document.getElementById("health-fill").style.width = `${player.health}%`;
    document.getElementById("shield-fill").style.width = `${player.shield}%`;
    document.getElementById("ammo-fill").style.width = `${(weapons.pistol.ammo / weapons.pistol.maxAmmo) * 100}%`;
}

// Collision detection
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Spawn enemies and ammo boxes periodically
setInterval(spawnEnemy, 2000);
setInterval(spawnAmmoBox, 10000);

// Start the game loop
update();
