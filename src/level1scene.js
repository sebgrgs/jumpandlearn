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
					startX: 67, 
					endX: 72, 
					y: 11, 
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

					// ✅ NOUVELLE LOGIQUE : Déplace la caméra vers le pont
					this.startBridgeCreation(bridge, collisionLayer);
					
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
    // Platform 1 configuration
    const platformConfig1 = {
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

    // Platform 2 configuration - new platform
    const platformConfig2 = {
        // Starting tile position
        startTileX: 79,
        startTileY: 12,
        // Platform size in tiles
        widthInTiles: 2,
        heightInTiles: 1,
        // Movement properties
        speed: 40,           // Movement speed in pixels per second
        direction: 'horizontal', // 'horizontal' or 'vertical'
        // Movement boundaries (in tile coordinates)
        minTileX: 79,        // Leftmost position (for horizontal movement)
        maxTileX: 89,        // Rightmost position (for horizontal movement)
        minTileY: 12,        // Topmost position (for vertical movement)
        maxTileY: 12,        // Bottommost position (for vertical movement)
        // Visual tiles to use
        tiles: [
            { tilesetName: 'tileset_spring', localId: 23 }, // Left tile
            { tilesetName: 'tileset_spring', localId: 24 }  // Right tile
        ]
    };

    // Create both platforms
    this.movingPlatforms = [];
    this.platformSprites = [];
    
    [platformConfig1, platformConfig2].forEach((platformConfig, index) => {
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
            console.error('Could not get tile IDs for platform', index);
            return;
        }

        // Create platform physics body with visual sprites
        const movingPlatform = this.physics.add.sprite(startX, startY, null);
        movingPlatform.setSize(
            platformConfig.widthInTiles * 16, 
            platformConfig.heightInTiles * 16
        );
        movingPlatform.body.setImmovable(true);
        movingPlatform.body.setGravityY(-800); // Cancel out gravity
        movingPlatform.setVisible(false); // Hide the sprite, we'll use visual sprites

        // Platform movement properties
        movingPlatform.minX = minX;
        movingPlatform.maxX = maxX;
        movingPlatform.minY = minY;
        movingPlatform.maxY = maxY;
        movingPlatform.movementDirection = platformConfig.direction;
        movingPlatform.speed = platformConfig.speed;
        movingPlatform.config = platformConfig;
        
        // Set initial movement direction (1 = positive direction, -1 = negative direction)
        if (platformConfig.direction === 'horizontal') {
            movingPlatform.direction = 1; // Start moving right
        } else {
            movingPlatform.direction = 1; // Start moving down
        }

        // Create visual sprites for the platform
        const platformSprites = [];
        for (let i = 0; i < platformConfig.widthInTiles; i++) {
            const spriteX = startX - (platformConfig.widthInTiles * 16) / 2 + (i * 16) + 8;
            const spriteY = startY;
            
            // Create a sprite that uses the tileset texture
            const sprite = this.add.sprite(spriteX, spriteY, 'tileset_spring');
            // Use the local tile ID directly (subtract 1 because frames are 0-indexed)
            const localFrameId = platformConfig.tiles[i % platformConfig.tiles.length].localId - 1;
            sprite.setFrame(localFrameId);
            platformSprites.push(sprite);
        }

        this.movingPlatforms.push(movingPlatform);
        this.platformSprites.push(platformSprites);

        // Add collision between player and platform
        this.physics.add.collider(this.player, movingPlatform, () => {
            // Check if player is on top of platform
            if (this.player.body.bottom <= movingPlatform.body.top + 5 && 
                this.player.body.velocity.y >= 0) {
                this.playerOnPlatform = index; // Track which platform player is on
            }
        });
    });

    // Track if player is on platform (will store platform index or false)
    this.playerOnPlatform = false;
}

updateMovingPlatform() {
    if (!this.movingPlatforms || this.movingPlatforms.length === 0) return;

    this.movingPlatforms.forEach((movingPlatform, platformIndex) => {
        const config = movingPlatform.config;
        let deltaX = 0;
        let deltaY = 0;

        if (movingPlatform.movementDirection === 'horizontal') {
            // Horizontal movement
            const deltaMovement = movingPlatform.direction * movingPlatform.speed * (1/60);
            const newX = movingPlatform.x + deltaMovement;
            
            // Check boundaries and reverse direction
            if (newX >= movingPlatform.maxX) {
                movingPlatform.x = movingPlatform.maxX;
                movingPlatform.direction = -1;
            } else if (newX <= movingPlatform.minX) {
                movingPlatform.x = movingPlatform.minX;
                movingPlatform.direction = 1;
            } else {
                deltaX = deltaMovement;
                movingPlatform.x = newX;
            }

        } else if (movingPlatform.movementDirection === 'vertical') {
            // Vertical movement
            const deltaMovement = movingPlatform.direction * movingPlatform.speed * (1/60);
            const newY = movingPlatform.y + deltaMovement;
            
            // Check boundaries and reverse direction
            if (newY >= movingPlatform.maxY) {
                movingPlatform.y = movingPlatform.maxY;
                movingPlatform.direction = -1;
            } else if (newY <= movingPlatform.minY) {
                movingPlatform.y = movingPlatform.minY;
                movingPlatform.direction = 1;
            } else {
                deltaY = deltaMovement;
                movingPlatform.y = newY;
            }
        }

        // Update visual sprites position
        this.platformSprites[platformIndex].forEach((sprite, index) => {
            sprite.x = movingPlatform.x - (config.widthInTiles * 16) / 2 + (index * 16) + 8;
            sprite.y = movingPlatform.y;
        });

        // Move player with platform if they're on this specific platform
        if (this.playerOnPlatform === platformIndex) {
            // Check if player is still on platform
            if (this.player.body.bottom > movingPlatform.body.top + 10 || 
                this.player.x < movingPlatform.body.left - 5 || 
                this.player.x > movingPlatform.body.right + 5) {
                this.playerOnPlatform = false;
            } else {
                // Move player with platform
                this.player.x += deltaX;
                this.player.y += deltaY;
            }
        } else {
            // Check if platform should push the player (when player is beside the platform)
            const platformLeft = movingPlatform.body.left;
            const platformRight = movingPlatform.body.right;
            const platformTop = movingPlatform.body.top;
            const platformBottom = movingPlatform.body.bottom;
            
            const playerLeft = this.player.body.left;
            const playerRight = this.player.body.right;
            const playerTop = this.player.body.top;
            const playerBottom = this.player.body.bottom;
            
            // Check if player overlaps with platform vertically and is beside it horizontally
            const verticalOverlap = playerBottom > platformTop && playerTop < platformBottom;
            
            if (verticalOverlap && deltaX !== 0) {
                // Platform moving right and player is to the right of platform
                if (deltaX > 0 && playerLeft >= platformRight - 10 && playerLeft <= platformRight + 10) {
                    this.player.x += deltaX;
                }
                // Platform moving left and player is to the left of platform  
                else if (deltaX < 0 && playerRight <= platformLeft + 10 && playerRight >= platformLeft - 10) {
                    this.player.x += deltaX;
                }
            }
            
            // Similar logic for vertical movement if needed
            if (deltaY !== 0) {
                const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;
                
                if (horizontalOverlap) {
                    // Platform moving down and player is below platform
                    if (deltaY > 0 && playerTop >= platformBottom - 10 && playerTop <= platformBottom + 10) {
                        this.player.y += deltaY;
                    }
                    // Platform moving up and player is above platform
                    else if (deltaY < 0 && playerBottom <= platformTop + 10 && playerBottom >= platformTop - 10) {
                        this.player.y += deltaY;
                    }
                }
            }
        }
    });
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
			player.setVelocityX(160);
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
		this.input.keyboard.enabled = false;
		this.physics.world.pause();

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
					if (typeof onCorrect === 'function') {
						onCorrect(); // ➕ Callback exécuté ici
					}

					alert('Correct answer!');
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
	// ✅ NOUVELLE MÉTHODE pour gérer la création du pont avec caméra
	startBridgeCreation(bridge, collisionLayer) {
		// Calcule la position centrale du pont
		const bridgeCenterX = ((bridge.startX + bridge.endX) / 2) * 16;
		const bridgeCenterY = bridge.y * 16;
		
		// ✅ Arrête le suivi du joueur
		
		this.cameras.main.stopFollow();
		
		// ✅ Déplace la caméra vers le pont avec une transition fluide
		this.cameras.main.pan(bridgeCenterX, bridgeCenterY, 1500, 'Power2', false, (camera, progress) => {
			if (progress === 1) {
				// ✅ Une fois la caméra arrivée, commence la création du pont
				this.createBridgeWithCamera(bridge, collisionLayer);
			}
		});
	}

	// ✅ NOUVELLE MÉTHODE pour créer le pont avec suivi caméra
	createBridgeWithCamera(bridge, collisionLayer) {
		let tilesCreated = 0;
		const totalTiles = bridge.endX - bridge.startX + 1;
		
		for (let x = bridge.startX; x <= bridge.endX; x++) {
			this.time.addEvent({
				delay: (x - bridge.startX) * 150, // Un peu plus lent pour l'effet visuel
				callback: () => {
					// ✅ Utilise la helper function
					const globalTileId = this.getTileGlobalId(bridge.tileset, bridge.tileId);
					if (globalTileId !== null) {
						const tile = collisionLayer.putTileAt(globalTileId, x, bridge.y);
						if (tile) {
							tile.setCollision(true);
							
							// ✅ Effet visuel sur la tuile qui apparaît
							this.addBridgeTileEffect(tile);
							
							// ✅ Déplace légèrement la caméra pour suivre la progression
							const tilePixelX = x * 16;
							this.cameras.main.pan(tilePixelX, bridge.y * 16, 100, 'Power1');
						}
					}
					
					tilesCreated++;
					
					// ✅ Si c'est la dernière tuile, revient au joueur
					if (tilesCreated === totalTiles) {
						this.time.delayedCall(800, () => {
							this.returnCameraToPlayer();
						});
					}
				}
			});
		}
	}

	// ✅ NOUVELLE MÉTHODE pour revenir au joueur
	returnCameraToPlayer() {
		// ✅ Transition fluide vers le joueur
		this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Power2', false, (camera, progress) => {
			if (progress === 1) {
				// ✅ Reprend le suivi du joueur
				this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
				this.input.keyboard.enabled = true; // Réactive les contrôles
				this.physics.world.resume();

			}
		});
	}

	// ✅ NOUVELLE MÉTHODE pour l'effet visuel des tuiles
	addBridgeTileEffect(tile) {
		// Coordonnées du centre de la tuile
		const tileX = tile.getCenterX();
		const tileY = tile.getCenterY();
		
		// ✅ Particules dorées qui apparaissent
		for (let i = 0; i < 8; i++) {
			const particle = this.add.circle(
				tileX + Phaser.Math.Between(-8, 8), 
				tileY + Phaser.Math.Between(-8, 8), 
				3, 
				0xffd700
			);
			
			this.tweens.add({
				targets: particle,
				alpha: 0,
				scaleX: 0,
				scaleY: 0,
				y: tileY - 20,
				duration: 600,
				delay: i * 50,
				ease: 'Power2',
				onComplete: () => particle.destroy()
			});
		}
	}
}