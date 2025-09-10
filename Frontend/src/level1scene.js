import { saveUserProgress, ControlsManager, InGameSettingsManager } from './main.js';
import { PendulumObstacles } from './PendulumObstacles.js';
import { MovingPlatforms } from './MovingPlatforms.js';
import Bee from './Bee.js';
import Bomb from './Bomb.js';
import SoundManager from './SoundManager.js';
import UIManager from './UIManager.js';
import API_CONFIG from './config.js';

/**
 * Level 1 Scene - Main gameplay scene with enhanced platformer mechanics
 * Features: Enhanced jumping, wall jumping, moving platforms, pendulum obstacles, pushable objects
 */
export default class Level1Scene extends Phaser.Scene {
    constructor() {
        super('Level1Scene');
        this.initializeProperties();
        this.pendulumObstaclesManager = new PendulumObstacles(this);
        this.movingPlatformsManager = new MovingPlatforms(this);
        this.soundManager = new SoundManager();
        this.uiManager = new UIManager(this);
        
        // Initialisation des tableaux pour gérer les ennemis du niveau
        this.bees = [];
        this.bombs = [];
    }

    /**
     * Initialize all scene properties
     */
    initializeProperties() {
        // État principal du jeu
        this.isDead = false;
        this.level = 1;
        this.isSpawning = true;

        // Variables pour les contrôles gamepad
        this.gamepadLeft = false;
        this.gamepadRight = false;
        this.gamepadJump = false;
        this.gamepadJumpHeld = false;
        this.gamepadJumpJustPressed = false;

        // Mécaniques de saut améliorées
        this.jumpForce = -250;
        this.minJumpForce = -100;
        this.coyoteTime = 150;
        this.jumpBuffer = 150;
        this.lastGroundedTime = 0;
        this.jumpBufferTime = 0;
        this.isJumping = false;
        this.jumpHeld = false;
        this.hasDoubleJump = false;
        this.usedDoubleJump = false;

        // Mécaniques de saut mural
        this.wallJumpCooldown = 0;
        this.isWallSliding = false;
        this.wallSlidingSide = 0;
        this.wallSlideSpeed = 50;
        this.wallJumpForceX = 200;
        this.wallJumpForceY = -250;
        this.wallJumpTime = 300;
        this.wallJumpTimer = 0;
        this.wallJumpDirection = 0;

        // Système de questions
        this.questionZonesData = [];
        this.questionZones = null;
        this.answeredQuestions = new Set();

        // Objets interactifs
        this.movingPlatforms = [];
        this.platformSprites = [];
        this.pushableObstacles = [];
        this.playerOnPlatform = false;
    }

    // ===========================================
    // MÉTHODES DU CYCLE DE VIE PHASER
    // ===========================================

    init(data) {
        this.level = data.level || 1;
        this.initializeProperties();
    }

    preload() {
        // Chargement des spritesheets pour les tuiles et objets
        this.load.spritesheet('tileset_spring', 'assets/tilesets/spring_tileset.png', { 
            frameWidth: 16, frameHeight: 16 
        });
        this.load.spritesheet('staticObjects_', 'assets/tilesets/staticObjects_.png', { 
            frameWidth: 16, frameHeight: 16 
        });
        this.load.spritesheet('tileset_world', 'assets/tilesets/world_tileset.png', { 
            frameWidth: 16, frameHeight: 16 
        });

        this.load.spritesheet('dungeon', 'assets/tilesets/dungeon_.png', {
            frameWidth: 16, frameHeight: 16 
        });
        
        // Chargement de la carte et du personnage
        this.load.tilemapTiledJSON('level1', 'assets/maps/level1.json');
        this.load.spritesheet('player', 'assets/personnage/personnage.png', { 
            frameWidth: 32, frameHeight: 32 
        });
        
        // Chargement des ennemis
        this.load.spritesheet('bee', 'assets/personnage/Bee_1.png', {
            frameWidth: 24, frameHeight: 24
        });
        this.load.spritesheet('bomb', 'assets/personnage/Bomb.png', {
            frameWidth: 24, frameHeight: 24
        });

        // Chargement de la musique de fond
        this.load.audio('level1_music', 'assets/song/level1_music.mp3');
    }

    create() {
        // Configuration des contrôles
        this.setupInput();
        
        // Initialiser la manette après un petit délai
        this.time.delayedCall(100, () => {
            ControlsManager.listenForGamepad(this);
        });
        
        // Configuration de la carte
        this.setupMap();
        // Configuration du joueur
        this.setupPlayer();
        // Configuration des zones de questions
        this.setupQuestionZones();
        // Configuration des abeilles
        this.setupBee();
        // Configuration des bombes
        this.setupBomb();
        // Configuration des animations
        this.setupAnimations();
        // Configuration de l'interface utilisateur
        this.setupUI();
        // Configuration de la caméra
        this.setupCamera();
        // Création des objets interactifs
        this.createInteractiveObjects();
        // Configuration de la musique
        this.setupMusic();
    }

    update() {
        if (this.isDead || this.isSpawning) return; // Empêcher les contrôles pendant le spawn

        // Gestion de la touche Échap pour ouvrir les paramètres
        if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
            InGameSettingsManager.showSettings(this);
            return;
        }

        // Intégrer les entrées de la manette
        this.handleGamepadInput();

        // Exécution de la boucle de mise à jour spécifique au niveau
        this.levelUpdate();
    }

    levelUpdate() {
        // Exécution de toutes les mises à jour nécessaires pour ce niveau
        this.uiManager.update(this.player.x)
        this.updateInteractiveObjects();
        
        // Empêcher le mouvement du joueur pendant le spawn
        if (!this.isSpawning) {
            this.updatePlayerMovement();
        }
        
        this.updateBees();
        this.updateBombs();
    }

    updateBees() {
        // Mise à jour de la logique et du comportement de chaque abeille
        this.bees.forEach(bee => {
            bee.update();
        });
    }

    updateBombs() {
        // Mise à jour de la logique et du comportement de chaque bombe
        this.bombs.forEach(bomb => {
            bomb.update();
        });
    }

    // ===========================================
    // MÉTHODES DE CONFIGURATION
    // ===========================================

    setupInput() {
        // Initialisation des contrôles de jeu via le gestionnaire centralisé
        const controls = ControlsManager.createKeys(this);
        this.jumpKey = controls.jumpKey;
        this.leftKey = controls.leftKey;
        this.rightKey = controls.rightKey;
        this.escapeKey = controls.escapeKey;
    }

    setupMap() {
        // Initialisation de la carte de jeu à partir des données JSON
        this.map = this.make.tilemap({ key: 'level1' });
        
        // Ajout et configuration des différents tilesets
        const tilesetWorld = this.map.addTilesetImage('tileset_world', 'tileset_world');
        const tilesetspring = this.map.addTilesetImage('tileset_spring', 'tileset_spring');
        const tilesetStaticObjects = this.map.addTilesetImage('staticObjects_', 'staticObjects_');
        const dungeon = this.map.addTilesetImage('dungeon', 'dungeon');
        
        // Construction des différentes couches visuelles de la carte
        const background = this.map.createLayer('ciel', [tilesetWorld, dungeon]);
        const fakeground = this.map.createLayer('fakepike', tilesetStaticObjects);
        const collision = this.map.createLayer('colision', [tilesetWorld, tilesetspring, tilesetStaticObjects]);
        collision.setCollisionByProperty({ collision: true });
        
        // Définition des limites physiques du monde de jeu
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
        // Initialisation des zones dangereuses
        this.setupDangerZones();
        
        // Création de la zone de victoire à la fin du niveau
        this.endZone = this.add.rectangle(282 * 16 + 8, 12 * 16 + 8, 50, 50);
        this.physics.add.existing(this.endZone, true);
    }

    setupDangerZones() {
        // Extraction des zones de danger définies dans la carte
        const dangerLayer = this.map.getObjectLayer('danger');
        this.dangerZones = this.physics.add.staticGroup();
        
        // Conversion des objets de la carte en zones de collision mortelles
        dangerLayer.objects.forEach(obj => {
            const zone = this.add.rectangle(
                obj.x + obj.width / 2, 
                obj.y + obj.height / 2, 
                obj.width, 
                obj.height
            );
            this.physics.add.existing(zone, true);
            this.dangerZones.add(zone);
        });
    }

    setupPlayer() {
        // Instanciation du joueur à sa position de départ sur la carte
        this.player = this.physics.add.sprite(3 * 16 + 8, 30 * 16 + 8, 'player');
        this.player.setCollideWorldBounds(true);
        
        // Ajustement de la zone de collision du personnage
        this.player.setSize(13, 15);
        this.player.setOffset(8, 10);
        
        // Paramètres de hitbox adaptés selon l'orientation du personnage
        this.hitboxParams = {
            right: { width: 13, height: 15, offsetX: 8, offsetY: 10 },
            left: { width: 13, height: 15, offsetX: 11, offsetY: 10 }
        };
        
        // Mise en place des interactions physiques du joueur
        this.physics.add.collider(this.player, this.map.getLayer('colision').tilemapLayer);
        this.physics.add.overlap(this.player, this.endZone, () => this.showVictoryUI());
        this.physics.add.overlap(this.player, this.dangerZones, () => {
            this.showGameOverUI();
        });

        // Démarrer l'animation de spawn
        this.startSpawnAnimation();
    }

    // Nouvelle méthode pour l'animation de spawn
    startSpawnAnimation() {
        // Rendre le joueur initialement invisible
        
        // Désactiver temporairement les contrôles et la physique
        this.isSpawning = true;
        this.player.body.setVelocity(0, 0);
        
        this.anims.create({
            key: 'appear',
            frames: this.anims.generateFrameNumbers('player', { start: 20, end: 16 }),
            frameRate: 10,
            repeat: 0
        });
        
        this.player.anims.play('appear', true);
        this.player.once('animationcomplete', () => {
            this.isSpawning = false;
        });
        this.addSpawnEffect();
    }

    // Effet visuel pour le spawn
    addSpawnEffect() {
        // Cercle d'énergie qui s'étend
        const energyRing = this.add.circle(this.player.x, this.player.y, 5, 0x2c8095, 0.6);
        this.tweens.add({
            targets: energyRing,
            radius: 30,
            alpha: 0,
            duration: 700,
            ease: 'Power2',
            onComplete: () => energyRing.destroy()
        });
        
    }

    setupQuestionZones() {
        this.questionZonesData = [
            { 
                x: 80 * 16 + 8, y: 7 * 16 + 7, width: 1 * 16, height: 1 * 16, 
                questionId: "1",
                bridge: { 
                    startX: 82, endX: 89, y: 7, 
                    tileId: 10, tileset: 'tileset_world',
                    hasCollision: true
                }
            },
            { 
                x: 204 * 16 + 8, y: 22 * 16 + 7, width: 1 * 16, height: 1 * 16, 
                questionId: "2",
                bridge: { 
                    startX: 209, endX: 210, y: 22, 
                    tileId: 123, tileset: 'tileset_spring',
                    hasCollision: true
                }
            },
            { 
                x: 268 * 16 + 8, y: 7 * 16 + 7, width: 1 * 16, height: 1 * 16, 
                questionId: "3",
                bridge: { 
                    startX: 269, endX: 276, y: 6, 
                    tileId: 59, tileset: 'tileset_world',
                    hasCollision: false  // Pas de collision pour le bloc invisible
                }
            }
        ];

        this.questionZones = this.physics.add.staticGroup();
        this.questionZonesData.forEach(data => {
            const zone = this.add.rectangle(data.x, data.y, data.width, data.height, 0x00ff00, 0);
            zone.questionId = data.questionId;
            zone.bridgeConfig = data.bridge;
            this.physics.add.existing(zone, true);
            this.questionZones.add(zone);
        });

        this.physics.add.overlap(this.player, this.questionZones, (player, zone) => {
            if (!this.answeredQuestions.has(zone.questionId)) {
                this.showQuestionUI(zone.questionId, () => {
                    // Passer un tableau de layers au lieu d'un seul
                    const collisionLayers = [
                        this.map.getLayer('colision').tilemapLayer,
                        this.map.getLayer('fakepike').tilemapLayer  // Ajouter le deuxième layer
                    ];
                    this.startBridgeCreation(zone.bridgeConfig, collisionLayers);
                    this.answeredQuestions.add(zone.questionId);
                    zone.destroy();
                });
            }
        });
    }

    setupBee() {
        // Configuration des abeilles avec différentes propriétés
        const beeConfigs = [
            {
                x: 99 * 16 + 8,
                y: 10 * 16 + 8,
                config: {
                    speed: 30,
                    patrolDistance: 6 * 16,
                    floatingAmplitude: 0.2
                }
            },
            {
                x: 99 * 16 + 8,
                y: 14 * 16 + 8,
                config: {
                    speed: 90,
                    patrolDistance: 6 * 16,
                    floatingAmplitude: 0.2
                }
            },
            {
                x: 26 * 16 + 8,
                y: 22 * 16 + 8,
                config: {
                    speed: 60,
                    patrolDistance: 6 * 16,
                    floatingAmplitude: 0.2
                }
            },
            {
                x: 162 * 16 + 8,
                y: 24 * 16 + 8,
                config: {
                    speed: 60,
                    patrolDistance: 6 * 16,
                    floatingAmplitude: 0.2
                }
            },
            {
                x: 162 * 16 + 8,
                y: 16 * 16 + 8,
                config: {
                    speed: 60,
                    patrolDistance: 6 * 16,
                    floatingAmplitude: 0.2
                }
            },
        ];

        // Création des abeilles selon les configurations
        beeConfigs.forEach(beeConfig => {
            const bee = new Bee(this, beeConfig.x, beeConfig.y, beeConfig.config);
            this.bees.push(bee);
        });
    }

    setupBomb() {
        // Configuration des bombes avec différentes propriétés
        const bombConfigs = [
            {
                x: 15 * 16 + 8,
                y: 26 * 16 + 5,
                config: {
                    speed: 50,
                    patrolDistance: 4 * 16
                }
            },
            {
                x: 151 * 16 + 8,
                y: 30 * 16 + 5,
                config: {
                    speed: 50,
                    patrolDistance: 3 * 16
                }
            },
            {
                x: 143 * 16 + 8,
                y: 30 * 16 + 5,
                config: {
                    speed: 50,
                    patrolDistance: 4 * 16
                }
            },
            {
                x: 135 * 16 + 8,
                y: 30 * 16 + 5,
                config: {
                    speed: 50,
                    patrolDistance: 5 * 16
                }
            },
            {
                x: 125 * 16 + 8,
                y: 30 * 16 + 5,
                config: {
                    speed: 50,
                    patrolDistance: 5 * 16
                }
            },
        ];

        // Création des bombes selon les configurations
        bombConfigs.forEach(bombConfig => {
            const bomb = new Bomb(this, bombConfig.x, bombConfig.y, bombConfig.config);
            this.bombs.push(bomb);
        });
    }

    setupAnimations() {
        // Animation d'attente du joueur
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 8 }),
            frameRate: 5,
            repeat: -1
        });

        // Animation de course du joueur
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 9, end: 14 }),
            frameRate: 10,
            repeat: -1
        });

        // Animation de saut du joueur
        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('player', { start: 15, end: 15 }),
            frameRate: 1,
            repeat: 0
        });

        // Animation de mort du joueur
        this.anims.create({
            key: 'death',
            frames: this.anims.generateFrameNumbers('player', { start: 16, end: 20 }),
            frameRate: 10,
            repeat: 0
        });
        
        // Animation de vol des abeilles
        this.anims.create({
            key: 'bee_fly',
            frames: this.anims.generateFrameNumbers('bee', { start: 0, end: 9 }),
            frameRate: 8,
            repeat: -1
        });

        // Animation de marche des bombes
        this.anims.create({
            key: 'bomb_walk',
            frames: this.anims.generateFrameNumbers('bomb', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1
        });
    }

    setupUI() {
        this.uiManager.initialize(this.player.x);
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(0, 30);

        // Debug click handler for tile coordinates
        this.input.on('pointerdown', (pointer) => {
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;
            const tileX = Math.floor(worldX / 16);
            const tileY = Math.floor(worldY / 16);
            console.log(`Tile position: x=${tileX}, y=${tileY}`);
        });
    }

    createInteractiveObjects() {
        this.movingPlatformsManager.createMovingPlatforms();
        this.pendulumObstaclesManager.createPendulumObstacles();
        this.createPushableObstacles();
    }

    // ===========================================
    // MÉTHODES DE MISE À JOUR
    // ===========================================

    updateInteractiveObjects() {
        this.movingPlatformsManager.updateMovingPlatforms();
        this.pendulumObstaclesManager.updatePendulumObstacles();
        this.updatePushableObstacles();
    }
    updatePlayerMovement() {
        // Mise à jour des temporisateurs pour les sauts muraux
        if (this.wallJumpCooldown > 0) {
            this.wallJumpCooldown -= this.game.loop.delta;
        }
        if (this.wallJumpTimer > 0) {
            this.wallJumpTimer -= this.game.loop.delta;
        }

        this.updateWallSliding();
        this.updateJumpMechanics();
        this.handleMovementInput();
        this.handleJumpInput();
    }

    handleMovementInput() {
        const player = this.player;
        
        // Combiner les entrées clavier et manette
        const leftPressed = this.leftKey.isDown || this.gamepadLeft;
        const rightPressed = this.rightKey.isDown || this.gamepadRight;
        
        if (leftPressed) {
            if (this.wallJumpTimer <= 0 || this.wallJumpDirection <= 0) {
                player.setVelocityX(-160);
                player.anims.play('run', true);
                player.setFlipX(true);
                
                // Ajuster la hitbox pour la direction gauche
                this.updatePlayerHitbox('left');
            }
        } else if (rightPressed) {
            if (this.wallJumpTimer <= 0 || this.wallJumpDirection >= 0) {
                player.setVelocityX(160);
                player.anims.play('run', true);
                player.setFlipX(false);
                
                // Ajuster la hitbox pour la direction droite
                this.updatePlayerHitbox('right');
            }
        } else {
            if (this.wallJumpTimer <= 0) {
                player.setVelocityX(0);
                player.anims.play('idle', true);
            }
        }
    }

    updatePlayerHitbox(direction) {
        const params = this.hitboxParams[direction];
        this.player.setSize(params.width, params.height);
        this.player.setOffset(params.offsetX, params.offsetY);
    }


    // ===========================================
    // SYSTÈME D'OBSTACLES POUSSABLES
    // ===========================================

    createPushableObstacles() {
        this.pushableObstacles = [];
        
        const pushableConfigs = [
            {
                x: 120 * 16 + 8, y: 30 * 16 + 8,
                width: 16, height: 16, pushSpeed: 30,
                spriteConfig: { tileset: 'tileset_world', frameId: 55 }
            },
            /*{
                x: 218 * 16 + 8, y: 21 * 16 + 8,
                width: 16, height: 16, pushSpeed: 30,
                spriteConfig: { tileset: 'tileset_world', frameId: 55 }
            },*/
            {
                x: 220 * 16 + 8, y: 21 * 16 + 8,
                width: 16, height: 16, pushSpeed: 30,
                spriteConfig: { tileset: 'tileset_world', frameId: 55 }
            }
        ];

        pushableConfigs.forEach((config, index) => {
            this.createSinglePushableObstacle(config, index);
        });
    }

    createSinglePushableObstacle(config, index) {
        const obstacle = this.physics.add.sprite(config.x, config.y, config.spriteConfig.tileset);
        obstacle.setFrame(config.spriteConfig.frameId);
        obstacle.setSize(config.width, config.height);
        
        // Configure physics
        obstacle.body.setCollideWorldBounds(true);
        obstacle.body.setImmovable(false);
        obstacle.body.setMass(1);
        obstacle.body.setDrag(1000, 0);
        obstacle.body.setMaxVelocity(config.pushSpeed, 400);

        // Configure obstacle properties
        Object.assign(obstacle, {
            config,
            isPushable: true,
            isBeingPushed: false,
            pushDirection: 0
        });
        
        this.pushableObstacles.push(obstacle);
        this.setupPushableObstacleCollisions(obstacle);
    }

    setupPushableObstacleCollisions(obstacle) {
        // Collision with map
        this.physics.add.collider(obstacle, this.map.getLayer('colision').tilemapLayer);
        
        // Collision with other pushable obstacles
        this.pushableObstacles.forEach(otherObstacle => {
            if (otherObstacle !== obstacle) {
                this.physics.add.collider(obstacle, otherObstacle);
            }
        });
        
        // Collision with player
        this.physics.add.collider(this.player, obstacle, (player, obstacle) => {
            this.handlePlayerObstacleCollision(player, obstacle);
        });
        
        // Collision with moving platforms
        if (this.movingPlatforms) {
            this.movingPlatforms.forEach(platform => {
                this.physics.add.collider(obstacle, platform);
            });
        }
        
        // Overlap with danger zones
        // this.physics.add.overlap(obstacle, this.dangerZones, (obstacle, danger) => {
        //    this.resetPushableObstacle(obstacle);
        // });
    }

    updatePushableObstacles() {
        if (!this.pushableObstacles) return;
        
        this.pushableObstacles.forEach(obstacle => {
            this.updateObstacleState(obstacle);
            this.checkObstacleBounds(obstacle);
        });
    }

    updateObstacleState(obstacle) {
        const playerNearby = Phaser.Geom.Rectangle.Overlaps(
            this.player.body,
            new Phaser.Geom.Rectangle(
                obstacle.body.x - 5, obstacle.body.y, 
                obstacle.body.width + 10, obstacle.body.height
            )
        );
        
        if (!playerNearby || Math.abs(this.player.body.velocity.x) < 50) {
            obstacle.isBeingPushed = false;
            obstacle.body.setVelocityX(0);
        }
        
        if (!obstacle.isBeingPushed) {
            obstacle.body.setVelocityX(0);
        }
    }

    checkObstacleBounds(obstacle) {
        if (obstacle.y > this.map.heightInPixels + 100) {
            this.resetPushableObstacle(obstacle);
        }
    }

    handlePlayerObstacleCollision(player, obstacle) {
        if (!obstacle.isPushable) return;
        
        const playerCenter = player.body.center;
        const obstacleCenter = obstacle.body.center;
        
        // Vérification si le joueur est positionné au-dessus de l'obstacle
        const onTop = player.body.bottom <= obstacle.body.top + 8 && 
                     player.body.velocity.y >= 0 &&
                     Math.abs(playerCenter.x - obstacleCenter.x) < obstacle.body.width * 0.7;

        if (onTop) {
            obstacle.isBeingPushed = false;
            obstacle.body.setVelocityX(0);
            return;
        }
        
        // Gestion du poussage horizontal des obstacles
        const horizontalOverlap = Math.abs(playerCenter.x - obstacleCenter.x) > 
                                 Math.abs(playerCenter.y - obstacleCenter.y);
    
        if (horizontalOverlap && player.body.onFloor() && obstacle.body.onFloor()) {
            const pushDirection = playerCenter.x < obstacleCenter.x ? 1 : -1;
            
            if ((pushDirection > 0 && player.body.velocity.x > 50) || 
                (pushDirection < 0 && player.body.velocity.x < -50)) {
                
                obstacle.isBeingPushed = true;
                obstacle.pushDirection = pushDirection;
                obstacle.body.setVelocityX(pushDirection * obstacle.config.pushSpeed);
                
                this.addPushEffect(obstacle);
                this.soundManager.playPushSound(); // Updated call
            } else {
                obstacle.isBeingPushed = false;
                obstacle.body.setVelocityX(0);
            }
        } else {
            obstacle.isBeingPushed = false;
            obstacle.body.setVelocityX(0);
        }
    }

    addPushEffect(obstacle) {
        this.tweens.add({
            targets: obstacle,
            scaleX: 1.02,
            scaleY: 0.98,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
    }

    resetPushableObstacle(obstacle) {
        obstacle.setPosition(obstacle.config.x, obstacle.config.y);
        obstacle.body.setVelocity(0, 0);
        obstacle.isBeingPushed = false;
        
        this.tweens.add({
            targets: obstacle,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2,
            ease: 'Power2'
        });
    }

    // ===========================================
    // MÉCANIQUES DE SAUT AMÉLIORÉES
    // ===========================================

    updateJumpMechanics() {
        const currentTime = this.time.now;
        const isGrounded = this.player.body.onFloor() || this.playerOnPlatform !== false;
        
        if (isGrounded) {
            this.lastGroundedTime = currentTime;
            this.usedDoubleJump = false;
            
            if (this.isJumping && this.player.body.velocity.y >= 0) {
                this.isJumping = false;
            }
        }
        
        // Combiner les entrées clavier et manette pour la gestion du saut variable
        const jumpHeld = this.jumpKey.isDown || this.gamepadJump;
        
        // Gestion de la hauteur variable du saut (saut plus court si on relâche)
        if (this.isJumping && !jumpHeld && this.player.body.velocity.y < 0) {
            if (this.player.body.velocity.y < this.minJumpForce) {
                this.player.setVelocityY(this.minJumpForce);
            }
            this.isJumping = false;
        }
        
        // Suivi de l'état de la touche de saut (clavier)
        if (this.jumpKey.isDown && !this.jumpHeld) {
            this.jumpBufferTime = currentTime;
            this.jumpHeld = true;
        } else if (!this.jumpKey.isDown) {
            this.jumpHeld = false;
        }
        
        // Suivi de l'état de la manette de saut (gamepad)  
        if (this.gamepadJump && !this.gamepadJumpHeld) {
            this.jumpBufferTime = currentTime;
            this.gamepadJumpHeld = true;
        } else if (!this.gamepadJump) {
            this.gamepadJumpHeld = false;
        }
    }

    handleJumpInput() {
        const currentTime = this.time.now;
        
        // Détecter "juste pressé" pour clavier et manette
        const keyboardJustPressed = this.jumpKey.isDown && !this.jumpHeld;
        const gamepadJustPressed = this.gamepadJumpJustPressed;
        const jumpJustPressed = keyboardJustPressed || gamepadJustPressed;
        
        // Détecter "maintenu enfoncé" pour clavier et manette
        const jumpCurrentlyHeld = this.jumpKey.isDown || this.gamepadJump;
        
        // Gestion de l'état "held" pour le clavier
        if (this.jumpKey.isDown && !this.jumpHeld) {
            this.jumpBufferTime = currentTime;
            this.jumpHeld = true;
        } else if (!this.jumpKey.isDown) {
            this.jumpHeld = false;
        }
        
        // Gestion de l'état "held" pour la manette
        if (this.gamepadJump && !this.gamepadJumpHeld) {
            this.jumpBufferTime = currentTime;
            this.gamepadJumpHeld = true;
        } else if (!this.gamepadJump) {
            this.gamepadJumpHeld = false;
        }
        
        const jumpBuffered = this.jumpBufferTime > 0 && (currentTime - this.jumpBufferTime) <= this.jumpBuffer;
        
        // Exécuter le saut si "juste pressé" ou si buffered et maintenu
        if (jumpJustPressed || (jumpBuffered && jumpCurrentlyHeld)) {
            const canCoyoteJump = (currentTime - this.lastGroundedTime) <= this.coyoteTime;
            const isGrounded = this.player.body.onFloor() || this.playerOnPlatform !== false;
            
            if (isGrounded || canCoyoteJump) {
                this.performJump();
                this.jumpBufferTime = 0;
            } else if (this.isWallSliding && this.wallJumpCooldown <= 0) {
                this.performWallJump();
                this.jumpBufferTime = 0;
            } else if (this.hasDoubleJump && !this.usedDoubleJump && !isGrounded) {
                this.performDoubleJump();
                this.jumpBufferTime = 0;
            }
        }
        
        // Gestion de la hauteur variable du saut (fonctionne maintenant avec la manette)
        if (this.isJumping && !jumpCurrentlyHeld && this.player.body.velocity.y < 0) {
            if (this.player.body.velocity.y < this.minJumpForce) {
                this.player.setVelocityY(this.minJumpForce);
            }
            this.isJumping = false;
        }
        
        // Nettoyage des anciens buffers de saut expirés
        if (jumpBuffered && (currentTime - this.jumpBufferTime) > this.jumpBuffer) {
            this.jumpBufferTime = 0;
        }
    }

    performJump() {
        this.player.setVelocityY(this.jumpForce);
        this.player.anims.play('jump', true);
        this.isJumping = true;
        this.playerOnPlatform = false;
        
        this.soundManager.playJumpSound(); // Updated call
    }

    performDoubleJump() {
        this.player.setVelocityY(this.jumpForce * 0.8);
        this.player.anims.play('jump', true);
        this.isJumping = true;
        this.usedDoubleJump = true;
        
        this.addDoubleJumpEffect();
        this.soundManager.playDoubleJumpSound(); // Updated call
    }

    // ===========================================
    // MÉCANIQUES DE SAUT MURAL
    // ===========================================

    checkWallCollision() {
        if (!this.player.body) return false;
        
        const playerBody = this.player.body;
        const tileSize = 16;
        const collisionLayer = this.map.getLayer('colision').tilemapLayer;
        
        const checkTopY = Math.floor((playerBody.top + 2) / tileSize);
        const checkBottomY = Math.floor((playerBody.bottom - 2) / tileSize);
        
        // Détection des murs sur le côté gauche du joueur
        const leftTileX = Math.floor((playerBody.left - 1) / tileSize);
        let leftWallFound = false;
        for (let y = checkTopY; y <= checkBottomY; y++) {
            const tile = collisionLayer.getTileAt(leftTileX, y);
            if (tile && tile.collides) {
                leftWallFound = true;
                break;
            }
        }
        
        // Détection des murs sur le côté droit du joueur
        const rightTileX = Math.floor((playerBody.right + 1) / tileSize);
        let rightWallFound = false;
        for (let y = checkTopY; y <= checkBottomY; y++) {
            const tile = collisionLayer.getTileAt(rightTileX, y);
            if (tile && tile.collides) {
                rightWallFound = true;
                break;
            }
        }
        
        // Inclure les contrôles gamepad dans la vérification
        const leftPressed = this.leftKey.isDown || this.gamepadLeft;
        const rightPressed = this.rightKey.isDown || this.gamepadRight;
        
        if (leftWallFound && leftPressed) return -1;
        if (rightWallFound && rightPressed) return 1;
        
        return 0;
    }

    updateWallSliding() {
        const wallSide = this.checkWallCollision();
        const canWallSlide = !this.player.body.onFloor() && 
                           this.player.body.velocity.y > 0 && 
                           wallSide !== 0 &&
                           this.wallJumpTimer <= 0;
        
        if (canWallSlide) {
            this.isWallSliding = true;
            this.wallSlidingSide = wallSide;
            
            if (this.player.body.velocity.y > this.wallSlideSpeed) {
                this.player.body.velocity.y = this.wallSlideSpeed;
            }
            
            this.addWallSlideEffect();
        } else {
            this.isWallSliding = false;
            this.wallSlidingSide = 0;
        }
    }

    performWallJump() {
        if (this.isWallSliding && this.wallJumpCooldown <= 0) {
            this.player.body.velocity.x = this.wallJumpForceX * -this.wallSlidingSide;
            this.player.body.velocity.y = this.wallJumpForceY;
            
            this.wallJumpTimer = this.wallJumpTime;
            this.wallJumpDirection = -this.wallSlidingSide;
            this.wallJumpCooldown = 200;
            
            this.isJumping = true;
            this.usedDoubleJump = false;
            this.isWallSliding = false;
            this.wallSlidingSide = 0;
            
            this.player.anims.play('jump', true);
            this.player.setFlipX(this.wallJumpDirection < 0);
            
            this.addWallJumpEffect();
            this.soundManager.playWallJumpSound(); // Updated call
        }
    }

    // ===========================================
    // EFFETS VISUELS ET SONORES
    // ===========================================

    addJumpEffect() {
        const dustParticles = this.add.particles(this.player.x, this.player.y + 15, 'tileset_world', {
            frame: [8, 9, 10],
            scale: { start: 0.3, end: 0.1 },
            speed: { min: 20, max: 50 },
            lifespan: 300,
            quantity: 3,
            angle: { min: 260, max: 280 }
        });
        
        this.time.delayedCall(500, () => {
            if (dustParticles) dustParticles.destroy();
        });
    }
    
    addDoubleJumpEffect() {
        // Effet plus prononcé pour le double saut
        const sparkles = this.add.particles(this.player.x, this.player.y, 'staticObjects_', {
            frame: [26], // Utilisation du sprite de balle comme étincelle
            scale: { start: 0.5, end: 0.1 },
            speed: { min: 30, max: 80 },
            lifespan: 400,
            quantity: 5,
            angle: { min: 0, max: 360 },
            tint: 0x00ffff // Teinte bleue pour le double saut
        });
        
        this.time.delayedCall(600, () => {
            if (sparkles) sparkles.destroy();
        });
    }

    addWallSlideEffect() {
        if (Math.random() < 0.1) {
            const offsetX = this.wallSlidingSide === -1 ? -8 : 8;
            const particle = this.add.circle(
                this.player.x + offsetX,
                this.player.y + Phaser.Math.Between(-10, 10),
                2, 0xcccccc
            );
            
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: particle.x + (this.wallSlidingSide * -10),
                y: particle.y + 20,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    addWallJumpEffect() {
        const offsetX = this.wallJumpDirection > 0 ? -12 : 12;
        
        for (let i = 0; i < 6; i++) {
            const particle = this.add.circle(
                this.player.x + offsetX, this.player.y, 3, 0xffffff
            );
            
            const angle = Phaser.Math.Between(-60, 60) * Phaser.Math.DEG_TO_RAD;
            const speed = Phaser.Math.Between(50, 100);
            
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: particle.x + Math.cos(angle + (this.wallJumpDirection > 0 ? 0 : Math.PI)) * speed,
                y: particle.y + Math.sin(angle) * speed,
                duration: 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    // ===========================================
    // EFFETS SONORES
    // ===========================================

    playJumpSound() {
        this.soundManager.playJumpSound();
    }
    
    playDoubleJumpSound() {
        this.soundManager.playDoubleJumpSound();
    }

    playWallJumpSound() {
        this.soundManager.playWallJumpSound();
    }

    playPushSound() {
        this.soundManager.playPushSound();
    }

    playGameOverSound() {
        this.soundManager.playGameOverSound();
    }

    playVictorySound() {
        this.soundManager.playVictorySound();
    }

    playBridgeCreationSound() {
        this.soundManager.playBridgeCreationSound();
    }

    // ===========================================
    // MÉTHODES UTILITAIRES
    // ===========================================

    getTileGlobalId(tilesetName, localTileId) {
        const tileset = this.map.getTileset(tilesetName);
        if (!tileset) {
            console.error(`Tileset ${tilesetName} not found`);
            return null;
        }
        return tileset.firstgid + localTileId;
    }

    // ===========================================
    // GESTION DE L'INTERFACE ET ÉTAT DU JEU
    // ===========================================

    async showQuestionUI(questionId, onCorrect = null) {
        this.physics.world.pause();
        this.input.keyboard.enabled = false;

        const res = await fetch(`${API_CONFIG.API_BASE_URL}/questions/${questionId}`);
        if (!res.ok) return;
        const q = await res.json();

        const ui = document.createElement('div');
        ui.className = 'question-ui';
        ui.innerHTML = `
        <div class="question-text">${q.text}</div>
        <div class="question-choices">
            ${q.choices.map((c, i) => `<button class="choice-button" data-index="${i}">${c}</button>`).join('')}
        </div>
        <div class="navigation-hint">
            🎮 Use ← → or D-pad to navigate • Enter/A to select
        </div>
        `;
        document.body.appendChild(ui);

        // Navigation au clavier et manette
        let selectedIndex = 0;
        const buttons = ui.querySelectorAll('.choice-button');
        
        // Fonction pour mettre à jour la sélection visuelle
        const updateSelection = () => {
            buttons.forEach((btn, index) => {
                btn.classList.toggle('selected', index === selectedIndex);
            });
        };
        
        // Initialiser la première sélection
        updateSelection();
        
        // Fonction pour sélectionner une réponse
        const selectAnswer = (index) => {
            ui.remove();
            document.removeEventListener('keydown', navigationHandler);
            
            if (index === q.correct) {
                if (typeof onCorrect === 'function') {
                    onCorrect();
                }
                this.input.keyboard.resetKeys();
            } else {
                this.showGameOverUI();
            }
        };
        
        // Gestionnaire de navigation
        const navigationHandler = (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    event.preventDefault();
                    selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
                    updateSelection();
                    break;
                    
                case 'ArrowRight':
                case 'd':
                case 'D':
                    event.preventDefault();
                    selectedIndex = (selectedIndex + 1) % buttons.length;
                    updateSelection();
                    break;
                    
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    selectAnswer(selectedIndex);
                    break;
                    
                case 'Escape':
                    event.preventDefault();
                    ui.remove();
                    document.removeEventListener('keydown', navigationHandler);
                    this.showGameOverUI(); // Considérer ESC comme abandon
                    break;
                    
                // Touches numériques pour sélection rapide
                case '1':
                case '2':
                case '3':
                case '4':
                    event.preventDefault();
                    const numIndex = parseInt(event.key) - 1;
                    if (numIndex >= 0 && numIndex < buttons.length) {
                        selectedIndex = numIndex;
                        updateSelection();
                        selectAnswer(selectedIndex);
                    }
                    break;
            }
        };
        
        // Gestionnaire pour la manette
        const gamepadHandler = () => {
            const gamepadState = ControlsManager.getGamepadInput();
            if (!gamepadState) return;
            
            // Navigation avec D-pad
            if (gamepadState.leftJustPressed) {
                selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
                updateSelection();
            } else if (gamepadState.rightJustPressed) {
                selectedIndex = (selectedIndex + 1) % buttons.length;
                updateSelection();
            }
            
            // Sélection avec bouton A/Cross
            if (gamepadState.jumpJustPressed) {
                selectAnswer(selectedIndex);
                return;
            }
            
            // Annulation avec bouton B/Circle
            if (gamepadState.cancelJustPressed) {
                ui.remove();
                document.removeEventListener('keydown', navigationHandler);
                this.stopGamepadPolling();
                this.showGameOverUI();
                return;
            }
            
            // Continuer à écouter la manette
            requestAnimationFrame(gamepadHandler);
        };
        
        // Commencer l'écoute
        document.addEventListener('keydown', navigationHandler);
        gamepadHandler(); // Démarrer le polling pour la manette
        
        // Gestionnaire de clic pour la souris (optionnel)
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => selectAnswer(index));
            btn.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
            });
        });
        
        // Méthode pour arrêter le polling gamepad
        this.stopGamepadPolling = () => {
            // Le polling s'arrête automatiquement quand gamepadHandler n'est plus appelé
        };
    }

    showGameOverUI() {
        this.isDead = true;
        this.uiManager.stopTimer();
        this.stopMusic();
        this.soundManager.playGameOverSound();
        this.physics.world.pause();
        this.input.keyboard.enabled = false;

        this.player.once('animationcomplete-death', () => {
            const ui = document.createElement('div');
            ui.className = 'question-ui';
            ui.innerHTML = `
            <div class="question-text">Game Over</div>
            <div class="question-choices">
                <button class="choice-button" id="retry-btn">Retry</button>
                <button class="choice-button" id="quit-btn">Quit</button>
            </div>
            <div class="navigation-hint">
                🎮 Use ← → or D-pad to navigate • Enter/A to select
            </div>
            `;
            document.body.appendChild(ui);

            // Navigation pour l'écran Game Over
            let selectedIndex = 0;
            const buttons = ui.querySelectorAll('.choice-button');
            
            const updateSelection = () => {
                buttons.forEach((btn, index) => {
                    btn.classList.toggle('selected', index === selectedIndex);
                });
            };
            
            updateSelection();
            
            const selectAction = (index) => {
                ui.remove();
                document.removeEventListener('keydown', gameOverNavigationHandler);
                
                if (index === 0) { // Retry
                    this.isDead = false;
                    this.input.keyboard.enabled = true;
                    this.physics.world.resume();
                    this.scene.restart();
                } else { // Quit
                    window.location.href = "/";
                }
            };
            
            const gameOverNavigationHandler = (event) => {
                switch(event.key) {
                    case 'ArrowUp':
                    case 'ArrowLeft':
                    case 'w':
                    case 'W':
                    case 'a':
                    case 'A':
                        event.preventDefault();
                        selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
                        updateSelection();
                        break;
                        
                    case 'ArrowDown':
                    case 'ArrowRight':
                    case 's':
                    case 'S':
                    case 'd':
                    case 'D':
                        event.preventDefault();
                        selectedIndex = (selectedIndex + 1) % buttons.length;
                        updateSelection();
                        break;
                        
                    case 'Enter':
                    case ' ':
                        event.preventDefault();
                        selectAction(selectedIndex);
                        break;
                }
            };
            
            // Gestionnaire manette pour Game Over
            const gameOverGamepadHandler = () => {
                const gamepadState = ControlsManager.getGamepadInput();
                if (!gamepadState) return;
                
                if (gamepadState.leftJustPressed || gamepadState.upJustPressed) {
                    selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
                    updateSelection();
                } else if (gamepadState.rightJustPressed || gamepadState.downJustPressed) {
                    selectedIndex = (selectedIndex + 1) % buttons.length;
                    updateSelection();
                }
                
                if (gamepadState.jumpJustPressed) {
                    selectAction(selectedIndex);
                    return;
                }
                
                requestAnimationFrame(gameOverGamepadHandler);
            };
            
            document.addEventListener('keydown', gameOverNavigationHandler);
            gameOverGamepadHandler();
            
            // Clic souris
            document.getElementById('retry-btn').onclick = () => selectAction(0);
            document.getElementById('quit-btn').onclick = () => selectAction(1);
            
            buttons.forEach((btn, index) => {
                btn.addEventListener('mouseenter', () => {
                    selectedIndex = index;
                    updateSelection();
                });
            });
        });

        this.player.anims.play('death', true);
    }

    showVictoryUI() {
        this.uiManager.stopTimer();
        this.stopMusic();
        this.soundManager.playVictorySound();
        const finalTime = this.uiManager.getFinalTime();
        const finalTimeMs = this.uiManager.elapsedTime;
        
        this.physics.world.pause();
        this.input.keyboard.enabled = false;
    
        const ui = document.createElement('div');
        ui.className = 'question-ui';
        ui.innerHTML = `
          <div class="question-text">Well done ! Level completed</div>
          <div class="question-text" style="font-size: 14px; margin-top: 10px;">Final Time: ${finalTime}</div>
          <div class="question-choices">
            <button class="choice-button" id="next-level-btn">Next level</button>
          </div>
          <div class="navigation-hint">
            🎮 Press Enter/A to continue
          </div>
        `;
        document.body.appendChild(ui);
        
        // Navigation pour l'écran Victory
        const button = ui.querySelector('.choice-button');
        button.classList.add('selected');
        
        const proceedToNextLevel = async () => {
            ui.remove();
            document.removeEventListener('keydown', victoryNavigationHandler);
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', async () => {
                await saveUserProgress(this.level + 1, finalTimeMs);
                this.scene.start('Level2Scene', { level: this.level + 1 });
            });
        };
        
        const victoryNavigationHandler = (event) => {
            switch(event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    proceedToNextLevel();
                    break;
            }
        };
        
        // Gestionnaire manette pour Victory
        const victoryGamepadHandler = () => {
            const gamepadState = ControlsManager.getGamepadInput();
            if (!gamepadState) return;
            
            if (gamepadState.jumpJustPressed) {
                proceedToNextLevel();
                return;
            }
            
            requestAnimationFrame(victoryGamepadHandler);
        };
        
        document.addEventListener('keydown', victoryNavigationHandler);
        victoryGamepadHandler();
        
        // Clic souris
        document.getElementById('next-level-btn').onclick = proceedToNextLevel;
    }

    // ===========================================
    // SYSTÈME DE CRÉATION DE PONTS
    // ===========================================

    startBridgeCreation(bridge, collisionLayers) {
        const bridgeCenterX = ((bridge.startX + bridge.endX) / 2) * 16;
        const bridgeCenterY = bridge.y * 16;
        
        this.cameras.main.stopFollow();
        this.cameras.main.pan(bridgeCenterX, bridgeCenterY, 1500, 'Power2', false, (camera, progress) => {
            if (progress === 1) {
                this.createBridgeWithCamera(bridge, collisionLayers);
            }
        });
    }

    createBridgeWithCamera(bridge, collisionLayers) {
        let tilesCreated = 0;
        const totalTiles = bridge.endX - bridge.startX + 1;
        
        for (let x = bridge.startX; x <= bridge.endX; x++) {
            this.time.addEvent({
                delay: (x - bridge.startX) * 150,
                callback: () => {
                    const globalTileId = this.getTileGlobalId(bridge.tileset, bridge.tileId);
                    if (globalTileId !== null) {
                        // Appliquer le changement sur tous les layers
                        collisionLayers.forEach(layer => {
                            const tile = layer.putTileAt(globalTileId, x, bridge.y);
                            if (tile) {
                                // Utiliser la propriété hasCollision pour déterminer les collisions
                                tile.setCollision(bridge.hasCollision !== false);
                            }
                        });
                        
                        // Effet visuel seulement une fois
                        this.addBridgeTileEffect({ 
                            getCenterX: () => x * 16 + 8, 
                            getCenterY: () => bridge.y * 16 + 8 
                        });
                        
                        this.soundManager.playBridgeCreationSound(); // Updated call

                        const tilePixelX = x * 16;
                        this.cameras.main.pan(tilePixelX, bridge.y * 16, 100, 'Power1');
                    }
                    
                    tilesCreated++;
                    
                    if (tilesCreated === totalTiles) {
                        this.time.delayedCall(800, () => {
                            this.returnCameraToPlayer();
                        });
                    }
                }
            });
        }
    }

    returnCameraToPlayer() {
        this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Power2', false, (camera, progress) => {
            if (progress === 1) {
                this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
                this.input.keyboard.enabled = true;
                this.physics.world.resume();
            }
        });
    }

    addBridgeTileEffect(tile) {
        const tileX = tile.getCenterX();
        const tileY = tile.getCenterY();
        
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(
                tileX + Phaser.Math.Between(-8, 8), 
                tileY + Phaser.Math.Between(-8, 8), 
                3, 0xffd700
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

    setupMusic() {
        // Récupération du volume sauvegardé ou utilisation de la valeur par défaut
        const savedVolume = localStorage.getItem('musicVolume') || '10';
        const volumeValue = parseFloat(savedVolume) / 100;
        
        // Création de l'objet audio avec le volume sauvegardé
        this.backgroundMusic = this.sound.add('level1_music', {
            volume: volumeValue,    // Utilise le volume sauvegardé
            loop: true             // Jouer en boucle
        });
        
        // Démarrage de la musique
        this.backgroundMusic.play();
    }

    stopMusic() {
        // Arrêt de la musique avec fade out progressif
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.tweens.add({
                targets: this.backgroundMusic,
                volume: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.backgroundMusic.stop();
                    this.backgroundMusic.destroy();
                    this.backgroundMusic = null;
                }
            });
        }
    }

    // ===========================================
    // GESTION DES COLLISIONS AVEC LES ENNEMIS
    // ===========================================

    handleBeeCollision() {
        // Gestion de la collision avec une abeille : réinitialisation et fin de partie
        this.uiManager.resetScore();
        this.showGameOverUI();
    }

    handleBombCollision() {
        // Gestion de la collision avec une bombe : réinitialisation et fin de partie
        this.uiManager.resetScore();
        this.showGameOverUI();
    }

    handleGamepadInput() {
        const gamepadState = ControlsManager.getGamepadInput();
        if (!gamepadState) return;

        // Mouvement horizontal avec D-pad et stick analogique
        this.gamepadLeft = gamepadState.leftPressed || gamepadState.leftAxisValue < -0.3;
        this.gamepadRight = gamepadState.rightPressed || gamepadState.leftAxisValue > 0.3;
        
        // Saut avec distinction entre "juste pressé" et "maintenu"
        this.gamepadJump = gamepadState.jumpPressed;
        this.gamepadJumpJustPressed = gamepadState.jumpJustPressed;
    }
}
