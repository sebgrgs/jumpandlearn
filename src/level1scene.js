import { saveUserProgress, ControlsManager } from './main.js';

export default class Level1Scene extends Phaser.Scene {
	constructor() {
		super('Level1Scene');
		this.score = 0;
		this.scoreText = null;
		this.startX= 0;
		this.isDead = false;
	}

	init(data) {
		this.level = data.level || 1;
	}

	preload() {
		// Load tileset as a spritesheet instead of image
		this.load.spritesheet('tileset_spring', 'assets/tilesets/spring_tileset.png', { 
			frameWidth: 16, 
			frameHeight: 16 
		});
		this.load.image('staticObjects_', 'assets/tilesets/staticObjects_.png');
		this.load.image('tileset_world', 'assets/tilesets/world_tileset.png');
		this.load.tilemapTiledJSON('level1', 'assets/maps/level1.json');
		this.load.spritesheet('player', 'assets/personnage/personnage.png', { frameWidth: 32, frameHeight: 32 });
	}

	getTileGlobalId(tilesetName, localTileId) {
		const tileset = this.map.getTileset(tilesetName);
		if (!tileset) {
			console.error(`Tileset ${tilesetName} not found`);
			return null;
		}
		return tileset.firstgid + localTileId - 1;
	}

	create() {
		const controls = ControlsManager.createKeys(this);
		this.jumpKey = controls.jumpKey;
		this.leftKey = controls.leftKey;
		this.rightKey = controls.rightKey;
		
		this.isDead = false;
		
		// ✅ Stocke la map comme propriété de l'instance
		this.map = this.make.tilemap({ key: 'level1' });

		const dangerLayer = this.map.getObjectLayer('danger');
		this.dangerZones = this.physics.add.staticGroup();
	  
		dangerLayer.objects.forEach(obj => {
		  const zone = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
		  this.physics.add.existing(zone, true);
		  this.dangerZones.add(zone);
		});
	  
		const tilesetWorld = this.map.addTilesetImage('tileset_world', 'tileset_world');
		const tilesetspring = this.map.addTilesetImage('tileset_spring', 'tileset_spring');
		const tilesetStaticObjects = this.map.addTilesetImage('staticObjects_', 'staticObjects_');
	  
		const background = this.map.createLayer('ciel', tilesetWorld);
		const collision = this.map.createLayer('colision', [tilesetWorld, tilesetspring, tilesetStaticObjects]);
		collision.setCollisionByProperty({ collision: true });
	  
		this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
		this.player = this.physics.add.sprite(100, 100, 'player');
		this.player.setCollideWorldBounds(true);
		this.player.setSize(15, 15);
		this.player.setOffset(10, 10);

		// ✅ Create moving platform
		this.createMovingPlatform(collision);
	  
		this.endZone = this.add.rectangle(1630 - 50, 110, 50, 50);
		this.physics.add.existing(this.endZone, true);

		this.physics.add.collider(this.player, collision);
	  
		this.physics.add.overlap(this.player, this.endZone, async () => {
			this.showVictoryUI();
		});

		this.physics.add.overlap(this.player, this.dangerZones, () => {
		  this.score = 0;
		  this.showGameOverUI();
		});

		// Modifiez la configuration des zones de questions
		this.questionZonesData = [
			{ 
				x: 400, y: 150, width: 50, height: 300, 
				questionId: "53f42b04-48f2-4892-8029-0556d535d6fd",
				bridge: { 
					startX: 37, 
					endX: 42, 
					y: 11, 
					tileId: 10,
					tileset: 'tileset_world'
				}
			},
			{ 
				x: 900, y: 150, width: 50, height: 300, 
				questionId: "b2475722-4796-40ef-a548-8968fbb1dfd2",
				bridge: { 
					startX: 50, 
					endX: 55, 
					y: 16, 
					tileId: 10,
					tileset: 'tileset_world'
				}
			}
		];
		
		this.answeredQuestions = new Set(); // ✅ Tracker les questions répondues

		this.questionZones = this.physics.add.staticGroup();
		this.questionZonesData.forEach(data => {
			const zone = this.add.rectangle(data.x, data.y, data.width, data.height, 0x00ff00, 0);
			zone.questionId = data.questionId;
			zone.bridgeConfig = data.bridge; // ✅ Stocke la config du pont
			this.physics.add.existing(zone, true);
			this.questionZones.add(zone);
		});

		this.physics.add.overlap(this.player, this.questionZones, (player, zone) => {
			// ✅ Empêche les déclenchements multiples
			if (!this.answeredQuestions.has(zone.questionId)) {
				this.showQuestionUI(zone.questionId, () => {
					const collisionLayer = this.map.getLayer('colision').tilemapLayer;
					const bridge = zone.bridgeConfig; // ✅ Récupère la config spécifique

					for (let x = bridge.startX; x <= bridge.endX; x++) {
						this.time.addEvent({
							delay: (x - bridge.startX) * 100,
							callback: () => {
								// ✅ Utilise la helper function
								const globalTileId = this.getTileGlobalId(bridge.tileset, bridge.tileId);
								if (globalTileId !== null) {
									const tile = collisionLayer.putTileAt(globalTileId, x, bridge.y);
									if (tile) {
										tile.setCollision(true);
									}
								}
							}
						});
					}
					
					// ✅ Marque comme répondue et détruit
					this.answeredQuestions.add(zone.questionId);
					zone.destroy();
				});
			}
		});

		this.anims.create({
		  key: 'idle',
		  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 8 }),
		  frameRate: 5,
		  repeat: -1
		})
	  
		this.anims.create({
		  key: 'run',
		  frames: this.anims.generateFrameNumbers('player', { start: 9, end: 14 }),
		  frameRate: 10,
		  repeat: -1
		})
	  
		this.anims.create({
		  key: 'jump',
		  frames: this.anims.generateFrameNumbers('player', { start: 15, end: 15 }),
		  frameRate: 1,
		  repeat: 0
		})

		this.anims.create({
			key: 'death',
			frames: this.anims.generateFrameNumbers('player', { start: 16, end: 20 }),
			frameRate: 10,
			repeat: 0
		})

		this.score = 0;
		this.startX = this.player.x;
		this.maxDistance = 0;

        this.scoreText = this.add.text(
            16, 16, 
            'Score: 0', 
            { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#ffd700' }
        ).setScrollFactor(0).setDepth(100);
	  
		this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
		this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

		this.input.on('pointerdown', (pointer) => {
		const worldX = pointer.worldX;
		const worldY = pointer.worldY;
		const tileX = Math.floor(worldX / 16); // 16 = taille d'une tuile
		const tileY = Math.floor(worldY / 16);
		console.log(`Tile position: x=${tileX}, y=${tileY}`);
});
	}

	createMovingPlatform(collisionLayer) {
    // Platform configuration - now fully configurable
    const platformConfig = {
        // Starting tile position
        startTileX: 9,
        startTileY: 6,
        // Platform size in tiles
        widthInTiles: 2,
        heightInTiles: 1,
        // Movement properties
        speed: 50,           // Movement speed in pixels per second
        direction: 'horizontal', // 'horizontal' or 'vertical'
        // Movement boundaries (in tile coordinates)
        minTileX: 7,         // Leftmost position (for horizontal movement)
        maxTileX: 18,        // Rightmost position (for horizontal movement)
        minTileY: 4,         // Topmost position (for vertical movement)
        maxTileY: 10,        // Bottommost position (for vertical movement)
        // Visual tiles to use
        tiles: [
            { tilesetName: 'tileset_spring', localId: 23 }, // Left tile
            { tilesetName: 'tileset_spring', localId: 24 }  // Right tile
        ]
    };

    // Convert tile position to pixel position
    const startX = platformConfig.startTileX * 16 + (platformConfig.widthInTiles * 16) / 2;
    const startY = platformConfig.startTileY * 16 + (platformConfig.heightInTiles * 16) / 2;

    // Calculate movement boundaries in pixels
    const minX = platformConfig.minTileX * 16 + (platformConfig.widthInTiles * 16) / 2;
    const maxX = platformConfig.maxTileX * 16 + (platformConfig.widthInTiles * 16) / 2;
    const minY = platformConfig.minTileY * 16 + (platformConfig.heightInTiles * 16) / 2;
    const maxY = platformConfig.maxTileY * 16 + (platformConfig.heightInTiles * 16) / 2;

    // Get global tile IDs
    const tileIds = platformConfig.tiles.map(tile => 
        this.getTileGlobalId(tile.tilesetName, tile.localId)
    );

    // Check if all tile IDs are valid
    if (tileIds.some(id => id === null)) {
        console.error('Could not get tile IDs for platform');
        return;
    }

    // Create platform physics body with visual sprites
    this.movingPlatform = this.physics.add.sprite(startX, startY, null);
    this.movingPlatform.setSize(
        platformConfig.widthInTiles * 16, 
        platformConfig.heightInTiles * 16
    );
    this.movingPlatform.body.setImmovable(true);
    this.movingPlatform.body.setGravityY(-800); // Cancel out gravity
    this.movingPlatform.setVisible(false); // Hide the sprite, we'll use visual sprites

    // Platform movement properties
    this.movingPlatform.minX = minX;
    this.movingPlatform.maxX = maxX;
    this.movingPlatform.minY = minY;
    this.movingPlatform.maxY = maxY;
    this.movingPlatform.movementDirection = platformConfig.direction;
    this.movingPlatform.speed = platformConfig.speed;
    this.movingPlatform.config = platformConfig;
    
    // Set initial movement direction (1 = positive direction, -1 = negative direction)
    if (platformConfig.direction === 'horizontal') {
        this.movingPlatform.direction = 1; // Start moving right
    } else {
        this.movingPlatform.direction = 1; // Start moving down
    }

    // Create visual sprites for the platform (instead of tiles)
    this.platformSprites = [];
    for (let i = 0; i < platformConfig.widthInTiles; i++) {
        const spriteX = startX - (platformConfig.widthInTiles * 16) / 2 + (i * 16) + 8;
        const spriteY = startY;
        
        // Create a sprite that uses the tileset texture
        const sprite = this.add.sprite(spriteX, spriteY, 'tileset_spring');
        // Use the local tile ID directly (subtract 1 because frames are 0-indexed)
        const localFrameId = platformConfig.tiles[i % platformConfig.tiles.length].localId - 1;
        sprite.setFrame(localFrameId);
        this.platformSprites.push(sprite);
    }

    // Track if player is on platform
    this.playerOnPlatform = false;

    // Add collision between player and platform
    this.physics.add.collider(this.player, this.movingPlatform, () => {
        // Check if player is on top of platform
        if (this.player.body.bottom <= this.movingPlatform.body.top + 5 && 
            this.player.body.velocity.y >= 0) {
            this.playerOnPlatform = true;
        }
    });
}

updateMovingPlatform() {
    if (!this.movingPlatform) return;

    const config = this.movingPlatform.config;
    let deltaX = 0;
    let deltaY = 0;

    if (this.movingPlatform.movementDirection === 'horizontal') {
        // Horizontal movement
        const deltaMovement = this.movingPlatform.direction * this.movingPlatform.speed * (1/60);
        const newX = this.movingPlatform.x + deltaMovement;
        
        // Check boundaries and reverse direction
        if (newX >= this.movingPlatform.maxX) {
            this.movingPlatform.x = this.movingPlatform.maxX;
            this.movingPlatform.direction = -1;
        } else if (newX <= this.movingPlatform.minX) {
            this.movingPlatform.x = this.movingPlatform.minX;
            this.movingPlatform.direction = 1;
        } else {
            deltaX = deltaMovement;
            this.movingPlatform.x = newX;
        }

    } else if (this.movingPlatform.movementDirection === 'vertical') {
        // Vertical movement
        const deltaMovement = this.movingPlatform.direction * this.movingPlatform.speed * (1/60);
        const newY = this.movingPlatform.y + deltaMovement;
        
        // Check boundaries and reverse direction
        if (newY >= this.movingPlatform.maxY) {
            this.movingPlatform.y = this.movingPlatform.maxY;
            this.movingPlatform.direction = -1;
        } else if (newY <= this.movingPlatform.minY) {
            this.movingPlatform.y = this.movingPlatform.minY;
            this.movingPlatform.direction = 1;
        } else {
            deltaY = deltaMovement;
            this.movingPlatform.y = newY;
        }
    }

    // Update visual sprites position
    this.platformSprites.forEach((sprite, index) => {
        sprite.x = this.movingPlatform.x - (config.widthInTiles * 16) / 2 + (index * 16) + 8;
        sprite.y = this.movingPlatform.y;
    });

    // Move player with platform if they're on it
    if (this.playerOnPlatform) {
        // Check if player is still on platform
        if (this.player.body.bottom > this.movingPlatform.body.top + 10 || 
            this.player.x < this.movingPlatform.body.left - 5 || 
            this.player.x > this.movingPlatform.body.right + 5) {
            this.playerOnPlatform = false;
        } else {
            // Move player with platform
            this.player.x += deltaX;
            this.player.y += deltaY;
        }
    }
}

	update() {
		if (this.isDead) return;

		// Update moving platform
		this.updateMovingPlatform();

		const player = this.player;
		
		if (this.leftKey.isDown) {
			player.setVelocityX(-160);
			player.anims.play('run', true);
			player.setFlipX(true);
		} else if (this.rightKey.isDown) {
			player.setVelocityX(400);
			player.anims.play('run', true);
			player.setFlipX(false);
		} else {
			player.setVelocityX(0);
			player.anims.play('idle', true);
		}
		
		if (this.jumpKey.isDown && player.body.onFloor()) {
			player.setVelocityY(-300);
			player.anims.play('jump', true);
			this.playerOnPlatform = false; // Player jumps off platform
		}

		const distance = Math.max(0, player.x - this.startX);
		if (distance > this.maxDistance) {
			this.maxDistance = distance;
		}
		this.score = Math.floor(this.maxDistance) * 10;
		this.scoreText.setText('Score: ' + this.score);
	}
	async showQuestionUI(questionId, onCorrect = null) {
		this.physics.world.pause();
		this.input.keyboard.enabled = false;

		const res = await fetch(`http://localhost:5000/api/v1/questions/${questionId}`);
		if (!res.ok) return;
		const q = await res.json();

		const ui = document.createElement('div');
		ui.className = 'question-ui';
		ui.innerHTML = `
		<div class="question-text">${q.text}</div>
		<div class="question-choices">
			${q.choices.map((c, i) => `<button data-index="${i}">${c}</button>`).join('')}
		</div>
		`;
		document.body.appendChild(ui);

		ui.querySelectorAll('button').forEach(btn => {
			btn.onclick = () => {
				const idx = parseInt(btn.dataset.index, 10);
				ui.remove();

				if (idx === q.correct) {
					alert('Bonne réponse !');

					if (typeof onCorrect === 'function') {
						onCorrect(); // ➕ Callback exécuté ici
					}

					this.physics.world.resume();
					this.input.keyboard.enabled = true;
				} else {
					this.showGameOverUI();
				}
			};
		});
	}
	showGameOverUI() {
		this.isDead = true; // Marque le joueur comme mort
		this.physics.world.pause();
		this.input.keyboard.enabled = false;
	
		// Joue l'animation de mort et attend la fin
		this.player.once('animationcomplete-death', () => {
			// Crée l'UI Game Over
			const ui = document.createElement('div');
			ui.className = 'question-ui';
			ui.innerHTML = `
			  <div class="question-text">Game Over</div>
			  <div class="question-choices">
				<button id="retry-btn">Retry</button>
				<button id="quit-btn">Quit</button>
			  </div>
			`;
			document.body.appendChild(ui);
	
			document.getElementById('retry-btn').onclick = () => {
				ui.remove();
				this.physics.world.resume();
				this.input.keyboard.enabled = true;
				this.scene.restart();
			};
			document.getElementById('quit-btn').onclick = () => {
				ui.remove();
				window.location.href = "/";
			};
		});
	
		this.player.anims.play('death', true);
	}
	showVictoryUI() {
		// Pause le jeu si besoin
		this.physics.world.pause();
		this.input.keyboard.enabled = false;
	
		// Crée l'UI de victoire
		const ui = document.createElement('div');
		ui.className = 'question-ui'; // Réutilise le style popup
		ui.innerHTML = `
		  <div class="question-text">Well done ! Level completed</div>
		  <div class="question-choices">
			<button id="next-level-btn">Next level</button>
		  </div>
		`;
		document.body.appendChild(ui);
	
		document.getElementById('next-level-btn').onclick = async () => {
			ui.remove();
			// Transition visuelle
			this.cameras.main.fadeOut(800, 0, 0, 0);
			this.cameras.main.once('camerafadeoutcomplete', async () => {
				await saveUserProgress(this.level + 1);
				this.scene.start('Level2Scene', { level: this.level + 1 });
			});
		};
	}
}