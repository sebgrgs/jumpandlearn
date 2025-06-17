import { saveUserProgress } from './main.js';

export default class Level1Scene extends Phaser.Scene {
	constructor() {
		super('Level1Scene');
	}

	init(data) {
		this.level = data.level || 1;
	}

	preload() {
		this.load.image('tileset_spring', 'assets/tilesets/spring_tileset.png');
		this.load.image('tileset_world', 'assets/tilesets/world_tileset.png');
		this.load.tilemapTiledJSON('level1', 'assets/maps/level1.json');
		this.load.spritesheet('player', 'assets/personnage/personnage.png', { frameWidth: 32, frameHeight: 32 });
	}

	create() {
		const map = this.make.tilemap({ key: 'level1' });

		const dangerLayer = map.getObjectLayer('danger');
		this.dangerZones = this.physics.add.staticGroup();
	  
		dangerLayer.objects.forEach(obj => {
		  const zone = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
		  this.physics.add.existing(zone, true); // true = static
		  this.dangerZones.add(zone);
		});
	  
		// Collision avec la zone de danger = mort
	  
		const tilesetWorld = map.addTilesetImage('tileset_world', 'tileset_world');
		const tilesetspring = map.addTilesetImage('tileset_spring', 'tileset_spring');
	  
		const background = map.createLayer('ciel', tilesetWorld);
		const collision = map.createLayer('colision', [tilesetWorld, tilesetspring]);
		collision.setCollisionByProperty({ collision: true });
	  
		this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.player = this.physics.add.sprite(100, 100, 'player');
		this.player.setCollideWorldBounds(true);
		this.player.setSize(15, 15);
		this.player.setOffset(10, 10);
	  
		this.endZone = this.add.rectangle(1600 - 50, 100, 50, 100);
		this.physics.add.existing(this.endZone, true); // true = static

		this.physics.add.collider(this.player, collision);
	  
		this.physics.add.overlap(this.player, this.endZone, async () => {
			await saveUserProgress(this.level + 1); // Sauvegarde la progression
			this.scene.start('Level2Scene', { level: this.level + 1 });
		  });

		this.physics.add.overlap(this.player, this.dangerZones, () => {
		  this.scene.restart(); // Redémarre le niveau en cas de contact avec l’eau
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
	  
		this.cursors = this.input.keyboard.createCursorKeys();
		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.cameras.main.startFollow(this.player, true, 0.1, 0.1);	  
	}

	update() {
		const player = this.player;
		const cursors = this.cursors;
	  
		if (cursors.left.isDown) {
		  console.log('left')
		  player.setVelocityX(-160);
		  player.anims.play('run', true);
		  player.setFlipX(true);
		} else if (cursors.right.isDown) {
		  player.setVelocityX(400);
		  player.anims.play('run', true);
		  player.setFlipX(false);
		} else {
		  player.setVelocityX(0);
		  player.anims.play('idle', true);
		}
	  
		if (cursors.up.isDown && player.body.blocked.down) {
		  console.log('Jumping');
		  player.setVelocityY(-300);
		  player.anims.play('jump', true);
		}
	}
}