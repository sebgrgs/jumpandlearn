export default class SoundManager {
    constructor() {
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume context if it's suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            console.warn('Audio context not available');
            this.audioContext = null;
        }
    }

    // Méthode utilitaire pour récupérer le volume des SFX
    getSfxVolume() {
        const savedVolume = localStorage.getItem('sfxVolume') || '50';
        return parseFloat(savedVolume) / 100;
    }

    playSound(config) {
        if (!this.audioContext) return;
        
        try {
            const volumeValue = this.getSfxVolume();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configuration de base
            oscillator.type = config.type || 'sine';
            oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
            
            // Configuration des fréquences avec rampe si spécifiée
            if (config.frequencyRamps) {
                config.frequencyRamps.forEach(ramp => {
                    if (ramp.type === 'exponential') {
                        oscillator.frequency.exponentialRampToValueAtTime(
                            ramp.value, 
                            this.audioContext.currentTime + ramp.time
                        );
                    } else if (ramp.type === 'linear') {
                        oscillator.frequency.linearRampToValueAtTime(
                            ramp.value, 
                            this.audioContext.currentTime + ramp.time
                        );
                    }
                });
            }

            // Configuration du gain
            gainNode.gain.setValueAtTime(config.volume * volumeValue, this.audioContext.currentTime);
            
            if (config.gainRamps) {
                config.gainRamps.forEach(ramp => {
                    gainNode.gain.exponentialRampToValueAtTime(
                        ramp.value * volumeValue, 
                        this.audioContext.currentTime + ramp.time
                    );
                });
            }

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);
        } catch (e) {
            if (config.fallbackMessage) {
                console.log(config.fallbackMessage);
            }
        }
    }

    playJumpSound() {
        this.playSound({
            frequency: 200,
            frequencyRamps: [
                { type: 'exponential', value: 400, time: 0.1 }
            ],
            volume: 0.2,
            gainRamps: [
                { value: 0.01, time: 0.15 }
            ],
            duration: 0.15,
            fallbackMessage: 'Jump!'
        });
    }

    playDoubleJumpSound() {
        this.playSound({
            frequency: 300,
            frequencyRamps: [
                { type: 'exponential', value: 600, time: 0.08 },
                { type: 'exponential', value: 500, time: 0.12 }
            ],
            volume: 0.15,
            gainRamps: [
                { value: 0.01, time: 0.2 }
            ],
            duration: 0.2,
            fallbackMessage: 'Double Jump!'
        });
    }

    playWallJumpSound() {
        this.playSound({
            frequency: 600,
            frequencyRamps: [
                { type: 'exponential', value: 400, time: 0.1 }
            ],
            volume: 0.1,
            gainRamps: [
                { value: 0.01, time: 0.1 }
            ],
            duration: 0.1
        });
    }

    playPushSound() {
        this.playSound({
            frequency: 200,
            frequencyRamps: [
                { type: 'exponential', value: 150, time: 0.05 }
            ],
            volume: 0.05,
            gainRamps: [
                { value: 0.01, time: 0.05 }
            ],
            duration: 0.05
        });
    }

    playGameOverSound() { 
        this.playSound({
            type: 'sawtooth',
            frequency: 400,
            frequencyRamps: [
                { type: 'exponential', value: 80, time: 0.5 }
            ],
            volume: 0.05,
            gainRamps: [
                { value: 0.01, time: 0.5 }
            ],
            duration: 0.5
        });
    }

    playVictorySound() {
        this.playSound({
            type: 'triangle',
            frequency: 440,
            frequencyRamps: [
                { type: 'linear', value: 660, time: 0.15 },
                { type: 'linear', value: 880, time: 0.3 }
            ],
            volume: 0.15,
            gainRamps: [
                { value: 0.01, time: 0.35 }
            ],
            duration: 0.35
        });
    }

    playBridgeCreationSound() {
        this.playSound({
            frequency: 600,
            frequencyRamps: [
                { type: 'exponential', value: 800, time: 0.1 },
                { type: 'exponential', value: 700, time: 0.2 }
            ],
            volume: 0.1,
            gainRamps: [
                { value: 0.01, time: 0.25 }
            ],
            duration: 0.25,
            fallbackMessage: 'Bridge tile created!'
        });
    }
}
