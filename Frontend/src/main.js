// main.js
import Level1Scene from './level1scene.js';
import Level2Scene from './level2scene.js';
import Level3Scene from './level3scene.js';
import API_CONFIG from './config.js';

class ControlsManager {
  static currentPad = null;

  // ✅ Ajouter des variables pour traquer l'état précédent
  static previousGamepadState = {
      jumpPressed: false,
      leftPressed: false,
      rightPressed: false,
      leftAxisValue: 0
  };

  static getControls() {
      return JSON.parse(localStorage.getItem('gameControls')) || {
          jump: 'ArrowUp',
          left: 'ArrowLeft',
          right: 'ArrowRight'
      };
  }

  static getGamepadControls() {
      return JSON.parse(localStorage.getItem('gamepadControls')) || {
          jump: 0,    // Bouton A/Cross
          left: 14,   // D-pad gauche
          right: 15,  // D-pad droite
          leftAxis: 0 // Stick analogique gauche (axe horizontal)
      };
  }

  static setGamepadControls(controls) {
      localStorage.setItem('gamepadControls', JSON.stringify(controls));
  }

  static createKeys(scene) {
      const controls = this.getControls();
      
      // Conversion des codes en keycodes Phaser
      const keyMap = {
          'Space': Phaser.Input.Keyboard.KeyCodes.SPACE,
          'ArrowLeft': Phaser.Input.Keyboard.KeyCodes.LEFT,
          'ArrowRight': Phaser.Input.Keyboard.KeyCodes.RIGHT,
          'ArrowUp': Phaser.Input.Keyboard.KeyCodes.UP,
          'ArrowDown': Phaser.Input.Keyboard.KeyCodes.DOWN,
          'KeyW': Phaser.Input.Keyboard.KeyCodes.W,
          'KeyA': Phaser.Input.Keyboard.KeyCodes.A,
          'KeyS': Phaser.Input.Keyboard.KeyCodes.S,
          'KeyD': Phaser.Input.Keyboard.KeyCodes.D,
          'KeyQ': Phaser.Input.Keyboard.KeyCodes.Q,
          'KeyZ': Phaser.Input.Keyboard.KeyCodes.Z,
          'KeyE': Phaser.Input.Keyboard.KeyCodes.E,
          'KeyR': Phaser.Input.Keyboard.KeyCodes.R,
          'KeyT': Phaser.Input.Keyboard.KeyCodes.T,
          'KeyY': Phaser.Input.Keyboard.KeyCodes.Y,
          'KeyU': Phaser.Input.Keyboard.KeyCodes.U,
          'KeyI': Phaser.Input.Keyboard.KeyCodes.I,
          'KeyO': Phaser.Input.Keyboard.KeyCodes.O,
          'KeyP': Phaser.Input.Keyboard.KeyCodes.P,
          'KeyF': Phaser.Input.Keyboard.KeyCodes.F,
          'KeyG': Phaser.Input.Keyboard.KeyCodes.G,
          'KeyH': Phaser.Input.Keyboard.KeyCodes.H,
          'KeyJ': Phaser.Input.Keyboard.KeyCodes.J,
          'KeyK': Phaser.Input.Keyboard.KeyCodes.K,
          'KeyL': Phaser.Input.Keyboard.KeyCodes.L,
          'KeyX': Phaser.Input.Keyboard.KeyCodes.X,
          'KeyC': Phaser.Input.Keyboard.KeyCodes.C,
          'KeyV': Phaser.Input.Keyboard.KeyCodes.V,
          'KeyB': Phaser.Input.Keyboard.KeyCodes.B,
          'KeyN': Phaser.Input.Keyboard.KeyCodes.N,
          'KeyM': Phaser.Input.Keyboard.KeyCodes.M,
          'Digit1': Phaser.Input.Keyboard.KeyCodes.ONE,
          'Digit2': Phaser.Input.Keyboard.KeyCodes.TWO,
          'Digit3': Phaser.Input.Keyboard.KeyCodes.THREE,
          'Digit4': Phaser.Input.Keyboard.KeyCodes.FOUR,
          'Digit5': Phaser.Input.Keyboard.KeyCodes.FIVE,
          'Digit6': Phaser.Input.Keyboard.KeyCodes.SIX,
          'Digit7': Phaser.Input.Keyboard.KeyCodes.SEVEN,
          'Digit8': Phaser.Input.Keyboard.KeyCodes.EIGHT,
          'Digit9': Phaser.Input.Keyboard.KeyCodes.NINE,
          'Digit0': Phaser.Input.Keyboard.KeyCodes.ZERO
      };

      return {
          jumpKey: scene.input.keyboard.addKey(keyMap[controls.jump] || controls.jump),
          leftKey: scene.input.keyboard.addKey(keyMap[controls.left] || controls.left),
          rightKey: scene.input.keyboard.addKey(keyMap[controls.right] || controls.right),
          escapeKey: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      };
  }

  static listenForGamepad(scene) {
      console.log('Tentative d\'initialisation de la manette...');
      
      // Vérifier si l'API gamepad est disponible dans le navigateur
      if (!navigator.getGamepads) {
          console.log('L\'API Gamepad n\'est pas supportée par ce navigateur');
          return;
      }

      // Vérifier si l'API gamepad de Phaser est disponible
      if (!scene.input.gamepad) {
          console.log('L\'API Gamepad de Phaser n\'est pas disponible');
          return;
      }

      // Démarrer l'API gamepad
      scene.input.gamepad.start();
      console.log('API Gamepad de Phaser démarrée');

      // Vérifier immédiatement les manettes connectées
      const gamepads = navigator.getGamepads();
      console.log('Manettes détectées par le navigateur:', gamepads.length);
      
      for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i]) {
              console.log(`Manette ${i}:`, gamepads[i].id);
          }
      }

      // Écouter les connexions de manettes
      scene.input.gamepad.on('connected', (pad) => {
          console.log('Manette connectée via Phaser:', pad.id);
          this.currentPad = pad;
      });

      scene.input.gamepad.on('disconnected', (pad) => {
          console.log('Manette déconnectée:', pad.id);
          if (this.currentPad === pad) {
              this.currentPad = null;
          }
      });

      // Vérifier si une manette est déjà connectée via Phaser
      if (scene.input.gamepad.total > 0) {
          this.currentPad = scene.input.gamepad.getPad(0);
          console.log('Manette déjà connectée via Phaser:', this.currentPad.id);
      } else {
          // Fallback: essayer de détecter via l'API native du navigateur
          const nativeGamepads = navigator.getGamepads();
          for (let i = 0; i < nativeGamepads.length; i++) {
              if (nativeGamepads[i]) {
                  console.log('Manette détectée via API native, tentative de connexion...');
                  // Forcer la détection en simulant une pression de bouton
                  this.forceGamepadDetection(scene);
                  break;
              }
          }
      }
  }

  static forceGamepadDetection(scene) {
      // Vérifier périodiquement si une manette devient disponible
      const checkInterval = setInterval(() => {
          if (scene.input.gamepad.total > 0) {
              this.currentPad = scene.input.gamepad.getPad(0);
              console.log('Manette forcée détectée:', this.currentPad.id);
              clearInterval(checkInterval);
          }
      }, 500);

      // Arrêter la vérification après 10 secondes
      setTimeout(() => {
          clearInterval(checkInterval);
      }, 10000);
  }

  static getGamepadInput() {
      if (!this.currentPad || !this.currentPad.connected) {
          return null;
      }

      const gamepadControls = this.getGamepadControls();
      
      // ✅ État actuel de la manette
      const currentState = {
          jumpPressed: this.currentPad.buttons[gamepadControls.jump] ? this.currentPad.buttons[gamepadControls.jump].pressed : false,
          leftPressed: this.currentPad.buttons[gamepadControls.left] ? this.currentPad.buttons[gamepadControls.left].pressed : false,
          rightPressed: this.currentPad.buttons[gamepadControls.right] ? this.currentPad.buttons[gamepadControls.right].pressed : false,
          leftAxisValue: this.currentPad.axes[gamepadControls.leftAxis] ? this.currentPad.axes[gamepadControls.leftAxis].getValue() : 0,
          
          // ✅ Ajouter les contrôles de navigation
          upPressed: this.currentPad.buttons[12] ? this.currentPad.buttons[12].pressed : false, // D-pad Up
          downPressed: this.currentPad.buttons[13] ? this.currentPad.buttons[13].pressed : false, // D-pad Down
          cancelPressed: this.currentPad.buttons[1] ? this.currentPad.buttons[1].pressed : false // B/Circle button
      };

      // ✅ Détecter les transitions (juste pressé vs maintenu)
      const result = {
          ...currentState,
          jumpJustPressed: currentState.jumpPressed && !this.previousGamepadState.jumpPressed,
          leftJustPressed: currentState.leftPressed && !this.previousGamepadState.leftPressed,
          rightJustPressed: currentState.rightPressed && !this.previousGamepadState.rightPressed,
          
          // ✅ Ajouter les détections "juste pressé" pour la navigation
          upJustPressed: currentState.upPressed && !this.previousGamepadState.upPressed,
          downJustPressed: currentState.downPressed && !this.previousGamepadState.downPressed,
          cancelJustPressed: currentState.cancelPressed && !this.previousGamepadState.cancelPressed
      };

      // ✅ Sauvegarder l'état pour la prochaine frame
      this.previousGamepadState = { ...currentState };

      return result;
  }

  static getButtonName(buttonIndex) {
      const buttonNames = {
          0: 'A/Cross',
          1: 'B/Circle', 
          2: 'X/Square',
          3: 'Y/Triangle',
          4: 'LB/L1',
          5: 'RB/R1',
          6: 'LT/L2',
          7: 'RT/R2',
          8: 'Back/Select',
          9: 'Start/Options',
          10: 'L3',
          11: 'R3',
          12: 'Up',
          13: 'Down',
          14: 'Left',
          15: 'Right'
      };
      return buttonNames[buttonIndex] || `Button ${buttonIndex}`;
  }

  static debugGamepad() {
      console.log('=== DEBUG GAMEPAD ===');
      
      // Vérifier l'API native
      const nativeGamepads = navigator.getGamepads();
      console.log('Manettes détectées (API native):', nativeGamepads.length);
      
      for (let i = 0; i < nativeGamepads.length; i++) {
          if (nativeGamepads[i]) {
              const pad = nativeGamepads[i];
              console.log(`Manette ${i}:`, {
                  id: pad.id,
                  connected: pad.connected,
                  buttons: pad.buttons.length,
                  axes: pad.axes.length
              });
          }
      }
      
      // Vérifier l'état actuel
      console.log('Manette actuelle:', this.currentPad ? this.currentPad.id : 'Aucune');
      
      if (this.currentPad) {
          console.log('État des boutons:', this.currentPad.buttons.map(b => b.pressed));
          console.log('État des axes:', this.currentPad.axes.map(a => a.getValue()));
      }
  }
}

// Nouvelle classe pour gérer les settings in-game
class InGameSettingsManager {
    static showSettings(scene) {
        // Pause le jeu
        scene.physics.world.pause();
        scene.input.keyboard.enabled = false;
        this.pauseTimer(scene);

        const settingsUI = document.createElement('div');
        settingsUI.className = 'in-game-settings-ui';
        settingsUI.innerHTML = `
            <div class="settings-inner">
                <div class="settings-title">⚙ SETTINGS ⚙</div>
                <div class="settings-content">
                    <div class="settings-section">
                        <h3>🎮 Keyboard Controls</h3>
                        <div class="control-setting">
                            <label>Jump:</label>
                            <button class="control-key" id="gameJumpKey" data-control="jump">SPACE</button>
                        </div>
                        <div class="control-setting">
                            <label>Move Left:</label>
                            <button class="control-key" id="gameLeftKey" data-control="left">LEFT ARROW</button>
                        </div>
                        <div class="control-setting">
                            <label>Move Right:</label>
                            <button class="control-key" id="gameRightKey" data-control="right">RIGHT ARROW</button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>🎮 Gamepad Controls</h3>
                        <div class="gamepad-status" id="gamepadStatus">
                            No gamepad detected
                        </div>
                        <div class="control-setting">
                            <label>Jump:</label>
                            <button class="control-key" id="gamepadJumpKey" data-gamepad-control="jump">A/Cross</button>
                        </div>
                        <div class="control-setting">
                            <label>Move Left:</label>
                            <button class="control-key" id="gamepadLeftKey" data-gamepad-control="left">Left D-pad</button>
                        </div>
                        <div class="control-setting">
                            <label>Move Right:</label>
                            <button class="control-key" id="gamepadRightKey" data-gamepad-control="right">Right D-pad</button>
                        </div>
                    </div>
                    
                    <div class="volume-setting">
                        <label>Music Volume:</label>
                        <input type="range" id="musicVolume" min="0" max="100" value="10" class="volume-slider">
                        <span id="volumeValue">10%</span>
                    </div>
                </div>
                <div class="settings-buttons">
                    <button class="pixel-button" id="resetGameControls">Reset Default</button>
                    <button class="pixel-button" id="resumeGame">Resume Game</button>
                    <button class="pixel-button" id="quitToMenu">Quit to Menu</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsUI);
        
        // Charger les settings actuels
        this.loadControlSettings();
        this.loadGamepadSettings();
        this.loadVolumeSettings(scene);
        this.updateGamepadStatus();
        
        // Event listeners
        this.setupSettingsListeners(settingsUI, scene);
    }

    static loadControlSettings() {
        const controls = JSON.parse(localStorage.getItem('gameControls')) || {
            jump: 'ArrowUp',
            left: 'ArrowLeft', 
            right: 'ArrowRight'
        };
        
        document.getElementById('gameJumpKey').textContent = this.getKeyDisplayName(controls.jump);
        document.getElementById('gameLeftKey').textContent = this.getKeyDisplayName(controls.left);
        document.getElementById('gameRightKey').textContent = this.getKeyDisplayName(controls.right);
    }

    static loadGamepadSettings() {
        const gamepadControls = ControlsManager.getGamepadControls();
        
        if (document.getElementById('gamepadJumpKey')) {
            document.getElementById('gamepadJumpKey').textContent = ControlsManager.getButtonName(gamepadControls.jump);
        }
        if (document.getElementById('gamepadLeftKey')) {
            document.getElementById('gamepadLeftKey').textContent = ControlsManager.getButtonName(gamepadControls.left);
        }
        if (document.getElementById('gamepadRightKey')) {
            document.getElementById('gamepadRightKey').textContent = ControlsManager.getButtonName(gamepadControls.right);
        }
    }

    static loadVolumeSettings(scene) {
        const savedVolume = localStorage.getItem('musicVolume') || '10';
        const volumeSlider = document.getElementById('musicVolume');
        const volumeValue = document.getElementById('volumeValue');
        
        volumeSlider.value = savedVolume;
        volumeValue.textContent = savedVolume + '%';
        
        // Appliquer le volume à la musique si elle existe
        if (scene.backgroundMusic) {
            const volumeFloat = parseFloat(savedVolume) / 100;
            scene.backgroundMusic.setVolume(volumeFloat);
        }
    }

    static updateGamepadStatus() {
        const statusElement = document.getElementById('gamepadStatus');
        if (statusElement) {
            if (ControlsManager.currentPad && ControlsManager.currentPad.connected) {
                statusElement.textContent = `Connected: ${ControlsManager.currentPad.id}`;
                statusElement.style.color = '#4CAF50';
            } else {
                statusElement.textContent = 'No gamepad detected';
                statusElement.style.color = '#f44336';
            }
        }
    }

    static setupSettingsListeners(settingsUI, scene) {
        // Event listeners pour les contrôles clavier
        document.querySelectorAll('#gameJumpKey, #gameLeftKey, #gameRightKey').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const control = e.target.dataset.control;
                e.target.textContent = 'Press key...';
                e.target.classList.add('listening');
                
                const handleKeyPress = (keyEvent) => {
                    keyEvent.preventDefault();
                    const newKey = keyEvent.code;
                    
                    const controls = JSON.parse(localStorage.getItem('gameControls')) || {};
                    controls[control] = newKey;
                    localStorage.setItem('gameControls', JSON.stringify(controls));
                    
                    e.target.textContent = this.getKeyDisplayName(newKey);
                    e.target.classList.remove('listening');
                    
                    this.reloadControls(scene);
                    document.removeEventListener('keydown', handleKeyPress);
                };
                
                document.addEventListener('keydown', handleKeyPress);
            });
        });

        // Event listeners pour les contrôles manette
        document.querySelectorAll('#gamepadJumpKey, #gamepadLeftKey, #gamepadRightKey').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!ControlsManager.currentPad || !ControlsManager.currentPad.connected) {
                    alert('Please connect a gamepad first!');
                    return;
                }

                const control = e.target.dataset.gamepadControl;
                e.target.textContent = 'Press button...';
                e.target.classList.add('listening');
                
                const checkGamepadInput = () => {
                    if (!ControlsManager.currentPad || !ControlsManager.currentPad.connected) {
                        e.target.textContent = 'Gamepad disconnected';
                        e.target.classList.remove('listening');
                        return;
                    }

                    // Vérifier tous les boutons
                    for (let i = 0; i < ControlsManager.currentPad.buttons.length; i++) {
                        if (ControlsManager.currentPad.buttons[i].pressed) {
                            const gamepadControls = ControlsManager.getGamepadControls();
                            gamepadControls[control] = i;
                            ControlsManager.setGamepadControls(gamepadControls);
                            
                            e.target.textContent = ControlsManager.getButtonName(i);
                            e.target.classList.remove('listening');
                            return;
                        }
                    }

                    // Continuer à vérifier
                    requestAnimationFrame(checkGamepadInput);
                };

                checkGamepadInput();
            });
        });

        // Volume slider
        const volumeSlider = document.getElementById('musicVolume');
        const volumeValue = document.getElementById('volumeValue');
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            volumeValue.textContent = volume + '%';
            localStorage.setItem('musicVolume', volume);
            
            if (scene.backgroundMusic) {
                scene.backgroundMusic.setVolume(parseFloat(volume) / 100);
            }
        });

        // Reset controls
        document.getElementById('resetGameControls').addEventListener('click', () => {
            const defaultControls = {
                jump: 'ArrowUp',
                left: 'ArrowLeft',
                right: 'ArrowRight'
            };
            const defaultGamepadControls = {
                jump: 0,
                left: 14,
                right: 15,
                leftAxis: 0
            };
            localStorage.setItem('gameControls', JSON.stringify(defaultControls));
            ControlsManager.setGamepadControls(defaultGamepadControls);
            this.loadControlSettings();
            this.loadGamepadSettings();
            this.reloadControls(scene);
        });

        // Resume game
        document.getElementById('resumeGame').addEventListener('click', () => {
            this.resumeFromSettings(settingsUI, scene);
        });

        // Quit to menu
        document.getElementById('quitToMenu').addEventListener('click', () => {
            settingsUI.remove();
            this.stopMusic(scene);
            window.location.href = "/";
        });

        // Échap pour fermer les settings
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.resumeFromSettings(settingsUI, scene);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Mettre à jour le statut de la manette périodiquement
        const gamepadStatusInterval = setInterval(() => {
            this.updateGamepadStatus();
        }, 1000);

        // Nettoyer l'intervalle quand les settings se ferment
        settingsUI.addEventListener('remove', () => {
            clearInterval(gamepadStatusInterval);
        });
    }

    static resumeFromSettings(settingsUI, scene) {
        settingsUI.remove();
        scene.input.keyboard.enabled = true;
        scene.physics.world.resume();
        this.resumeTimer(scene);
    }

    static reloadControls(scene) {
        // Recharge les contrôles depuis localStorage
        const controls = ControlsManager.createKeys(scene);
        scene.jumpKey = controls.jumpKey;
        scene.leftKey = controls.leftKey;
        scene.rightKey = controls.rightKey;
        scene.escapeKey = controls.escapeKey;
    }

    static getKeyDisplayName(key) {
        const keyNames = {
            'Space': 'SPACE',
            'Enter': 'ENTER',
            'Escape': 'ESC',
            'ArrowUp': 'UP ARROW',
            'ArrowDown': 'DOWN ARROW',
            'ArrowLeft': 'LEFT ARROW',
            'ArrowRight': 'RIGHT ARROW',
            'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E',
            'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J',
            'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O',
            'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T',
            'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y',
            'KeyZ': 'Z',
            'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
            'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9'
        };
        
        return keyNames[key] || key.replace('Key', '').replace('Digit', '').toUpperCase();
    }

    static pauseTimer(scene) {
        if (scene.uiManager && typeof scene.uiManager.pauseTimer === 'function') {
            scene.uiManager.pauseTimer();
        }
    }

    static resumeTimer(scene) {
        if (scene.uiManager && typeof scene.uiManager.resumeTimer === 'function') {
            scene.uiManager.resumeTimer();
        }
    }


    static stopMusic(scene) {
        if (scene.backgroundMusic && scene.backgroundMusic.isPlaying) {
            scene.backgroundMusic.stop();
        }
    }
}

// Classe de base pour tous les niveaux
class BaseGameScene extends Phaser.Scene {
    constructor(key) {
        super(key);
    }

    setupInput() {
        const controls = ControlsManager.createKeys(this);
        this.jumpKey = controls.jumpKey;
        this.leftKey = controls.leftKey;
        this.rightKey = controls.rightKey;
        this.escapeKey = controls.escapeKey;
    }

    update() {
        // Vérifier si Échap est pressé pour ouvrir les settings
        if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
            InGameSettingsManager.showSettings(this);
            return;
        }

        // Appeler la méthode update spécifique au niveau si elle existe
        if (this.levelUpdate) {
            this.levelUpdate();
        }
    }
}

// Exporter les classes
export { ControlsManager, InGameSettingsManager, BaseGameScene };

async function getUserProgress() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_CONFIG.API_BASE_URL}/progress/`, {
      headers: { 'Authorization': 'Bearer ' + token }
  });
  if (res.ok) {
      const data = await res.json();
      return data.max_level; // Utiliser max_level au lieu de level
  }
  return 1; // Par défaut, map 1
}

export async function saveUserProgress(level, completionTime = null) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const payload = { level };
        if (completionTime !== null) {
            payload.completion_time = completionTime;
        }

        const response = await fetch(`${API_CONFIG.API_BASE_URL}/progress/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('Progress saved successfully');
        }
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
}

async function checkAuthenticationBeforeGame() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('You must be logged in to play!');
        window.location.href = '/index.html';
        return false;
    }
    
    try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/protected/`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
        
        return true;
    } catch (error) {
        console.error('Authentication failed:', error);
        localStorage.removeItem('token');
        alert('Your session has expired. Please login again.');
        window.location.href = '/index.html';
        return false;
    }
}

// Modifier la création du jeu pour inclure la vérification
(async function() {
    const isAuthenticated = await checkAuthenticationBeforeGame();
    if (!isAuthenticated) {
        return; // Arrêter l'exécution si pas authentifié
    }
    
    let selectedLevel = localStorage.getItem('selectedLevel');
    let level;
    if (selectedLevel) {
        level = parseInt(selectedLevel, 10);
        localStorage.removeItem('selectedLevel');
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
        // Démarrer directement la bonne scène selon la progression
        if (this.userLevel === 1) {
            this.scene.start('Level1Scene', { level: 1 });
        } else if (this.userLevel === 2) {
            this.scene.start('Level2Scene', { level: 2 });
        } else if (this.userLevel === 3) {
            this.scene.start('Level3Scene', { level: 3 });
        } else {
            // Si le niveau n'existe pas, retourner au niveau le plus élevé disponible
            console.log(`Level ${this.userLevel} doesn't exist, redirecting to Level 3`);
            this.scene.start('Level3Scene', { level: 3 });
        }
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
        }},
      input : {
          gamepad: true // Activer l'API Gamepad
      },
      fps: {
        target: 60,
        forceSetTimeOut: true // Plus fiable pour forcer le cap sur certains navigateurs
      },
      scene: [
        BootScene,
        Level1Scene,
        Level2Scene,
        Level3Scene
      ]
    };

    const game = new Phaser.Game(config);

    // Passer le niveau à la BootScene qui prendra la décision
    game.scene.start('BootScene', { level: level });

    // Ajouter cette ligne après la création du jeu pour debug
    window.debugGamepad = () => ControlsManager.debugGamepad();
})();