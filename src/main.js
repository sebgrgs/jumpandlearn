// main.js
import Level1Scene from './level1scene.js';
import Level2Scene from './level2scene.js';

async function getUserProgress() {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:5000/api/v1/progress/', {
	  headers: { 'Authorization': 'Bearer ' + token }
  });
  if (res.ok) {
	  const data = await res.json();
	  return data.level; // numéro de la map à charger
  }
  return 1; // Par défaut, map 1
}

export async function saveUserProgress(level) {
  const token = localStorage.getItem('token');
  await fetch('http://localhost:5000/api/v1/progress/', {
	  method: 'POST',
	  headers: {
		  'Content-Type': 'application/json',
		  'Authorization': 'Bearer ' + token
	  },
	  body: JSON.stringify({ level })
  });
}

let selectedLevel = localStorage.getItem('selectedLevel');
let level;
if (selectedLevel) {
  level = parseInt(selectedLevel, 10);
  localStorage.removeItem('selectedLevel'); // Pour ne pas relancer toujours ce niveau
} else {
  level = await getUserProgress();
}

// Classe de démarrage qui décide de la première scène
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }
  
  init(data) {
    this.userLevel = data.level || 1;
  }
  
  create() {
    // Optionnel : afficher un écran de chargement ou logo
    // this.add.text(300, 160, 'Chargement...', { fontSize: '32px', fill: '#000' });
    
    // Démarrer directement la bonne scène selon la progression
    if (this.userLevel === 1) {
      this.scene.start('Level1Scene', { level: 1 });
    } else if (this.userLevel === 2) {
      this.scene.start('Level2Scene', { level: 2 });
    }
    // La BootScene s'arrête automatiquement quand on démarre une autre scène
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
	parent: 'game-container',
	mode: Phaser.Scale.FIT,
	autoCenter: Phaser.Scale.CENTER_BOTH,
	width: 600,
	height: 320,
  },
  pixelArt: true,
  backgroundColor: '#5DACD8',
  physics: {
	default: 'arcade',
	arcade: {
	  gravity: { y: 800 },
	  debug: false
	}
  },
  scene: [
	BootScene,    // Cette scène démarre automatiquement en premier
	Level1Scene,
	Level2Scene,
  ]
};

const game = new Phaser.Game(config);

// Passer le niveau à la BootScene qui prendra la décision
game.scene.start('BootScene', { level: level });