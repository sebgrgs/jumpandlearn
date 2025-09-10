export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.startX = 0;
        this.maxDistance = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerStopped = false;
        this.timerPaused = false;
        this.pausedTime = 0;
        
        // DOM elements
        this.uiContainer = null;
        this.timerElement = null;
        this.scoreElement = null;
    }

    initialize(playerStartX) {
        this.createUIElements();
        this.score = 0;
        this.startX = playerStartX;
        this.maxDistance = 0;
        this.startTime = this.scene.time.now;
        this.elapsedTime = 0;
        this.timerStopped = false;
        this.timerPaused = false;
    }

    createUIElements() {
        // Supprimer l'ancien container s'il existe
        if (this.uiContainer) {
            this.uiContainer.remove();
        }

        // Supprimer aussi toutes les div timer-ui existantes (au cas où)
        const existingTimerUIs = document.querySelectorAll('.timer-ui');
        existingTimerUIs.forEach(ui => ui.remove());

        // Create a single container for both timer and score
        this.uiContainer = document.createElement('div');
        this.uiContainer.className = 'timer-ui';

        // DOM element for the timer
        this.timerElement = document.createElement('div');
        this.timerElement.textContent = 'Time: 00:00:000';
        this.uiContainer.appendChild(this.timerElement);

        // DOM element for the score
        this.scoreElement = document.createElement('div');
        this.scoreElement.textContent = 'Score: 0';
        this.uiContainer.appendChild(this.scoreElement);

        // Add container to the DOM
        document.body.appendChild(this.uiContainer);
    }

    update(playerX) {
        this.updateTimer();
        this.updateScore(playerX);
    }

    updateTimer() {
        if (!this.timerStopped && !this.timerPaused) {
            this.elapsedTime = this.scene.time.now - this.startTime;
            this.updateTimerDisplay();
        }
    }

    updateTimerDisplay() {
        const totalMs = Math.floor(this.elapsedTime);
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const milliseconds = totalMs % 1000;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;

        this.timerElement.textContent = `Time: ${formattedTime}`;
    }

    updateScore(playerX) {
        const distance = Math.max(0, playerX - this.startX);
        if (distance > this.maxDistance) {
            this.maxDistance = distance;
        }
        this.score = Math.floor(this.maxDistance) * 10;
        
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${this.score}`;
        }
    }

    pauseTimer() {
        this.timerPaused = true;
        this.pausedTime = this.scene.time.now;
    }

    resumeTimer() {
        if (this.timerPaused) {
            const pauseDuration = this.scene.time.now - this.pausedTime;
            this.startTime += pauseDuration;
            this.timerPaused = false;
        }
    }

    stopTimer() {
        this.timerStopped = true;
    }

    getFinalTime() {
        const totalMs = Math.floor(this.elapsedTime);
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const milliseconds = totalMs % 1000;

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
    }

    resetScore() {
        this.score = 0;
        if (this.scoreElement) {
            this.scoreElement.textContent = 'Score: 0';
        }
    }

    destroy() {
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.remove();
        }
        
        this.uiContainer = null;
        this.timerElement = null;
        this.scoreElement = null;
    }
}