const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Preload images
const playerImage = new Image();
playerImage.src = 'images/player.png'; // player

const enemyImage = new Image();
enemyImage.src = 'images/enemy.png'; // enemy image

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
    shrinkRate: 0.02,
    damage: 1,
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
        speed: 1,
        health: 20,
        damage: 10,
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
    // Player movement with boundary checks
    if (keys["w"] && player.y > 0) player.y -= player.speed;
    if (keys["s"] && player.y + player.height < canvas.height) player.y += player.speed;
    if (keys["a"] && player.x > 0) player.x -= player.speed;
    if (keys["d"] && player.x + player.width < canvas.width) player.x += player.speed;

    // Shooting
    if (keys[" "]) shoot();

    // Bullets movement and collision with enemies
    bullets = bullets.filter((bullet) => {
        let hit = false;
        enemies = enemies.filter((enemy) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.health -= bullet.damage;
                hit = true;
                return enemy.health > 0; // Remove enemy if health <= 0
            }
            return true;
        });
        return !hit; // Remove bullet if it hits an enemy
    });

    // Enemy movement and collision with player
    enemies = enemies.filter((enemy) => {
        enemy.y += enemy.speed;

        // Collision with player
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            player.health -= enemy.damage;
            return false; // Remove enemy
        }

        return enemy.y < canvas.height; // Remove enemies offscreen
    });

    // Collect ammo boxes
    ammoBoxes = ammoBoxes.filter((box) => {
        if (
            player.x < box.x + box.width &&
            player.x + player.width > box.x &&
            player.y < box.y + box.height &&
            player.y + player.height > box.y
        ) {
            weapons.pistol.ammo = Math.min(weapons.pistol.ammo + 10, weapons.pistol.maxAmmo);
            return false; // Remove ammo box
        }
        return true;
    });

    // Storm shrinking
    storm.radius -= storm.shrinkRate;
    if (storm.radius < 0) storm.radius = 0;

    // Drawing
    draw();
    if (player.health > 0) {
        requestAnimationFrame(update);
    } else {
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("Game Over! Reload to play again.", canvas.width / 2 - 150, canvas.height / 2);
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
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "green"; // Fallback color
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Draw enemies
    enemies.forEach((enemy) => {
        if (enemyImage.complete) {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = "red"; // Fallback color
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    // Draw bullets
    bullets.forEach((bullet) => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw ammo boxes
    ammoBoxes.forEach((box) => {
        ctx.fillStyle = "blue";
        ctx.fillRect(box.x, box.y, box.width, box.height);
    });
}

// Start the game loop
update();
setInterval(spawnEnemy, 2000);
setInterval(spawnAmmoBox, 10000);
