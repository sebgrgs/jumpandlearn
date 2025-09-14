import API_CONFIG from './config.js';

export default class AchievementManager {
    constructor(scene) {
        this.scene = scene;
        this.unlockedAchievements = new Set();
        this.pendingUnlocks = []; // Queue pour les achievements en attente
        this.isProcessing = false;
        this.achievementConditions = {
            'first_death': {
                id: null,
                name: 'First Death',
                description: 'Die for the first time',
                triggered: false
            },
            'speed_runner': {
                id: null,
                name: 'Speed Runner',
                description: 'Complete level 1 in under 2 minutes',
                triggered: false
            },
            'wall_jumper': {
                id: null,
                name: 'Wall Jumper',
                description: 'Perform 5 wall jumps in a single level',
                triggered: false,
                count: 0
            },
            'question_master': {
                id: null,
                name: 'Question Master',
                description: 'Answer all questions correctly',
                triggered: false
            }
        };
        
        // Fetch achievements from server
        this.fetchAchievements();
    }

    async fetchAchievements() {
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/achievements/`);
            if (response.ok) {
                const achievements = await response.json();
                
                // Map server achievements to our local conditions
                achievements.forEach(achievement => {
                    const condition = Object.values(this.achievementConditions)
                        .find(cond => cond.name === achievement.name);
                    if (condition) {
                        condition.id = achievement.id;
                    }
                });
                
                // Fetch user's unlocked achievements after mapping IDs
                await this.fetchUserAchievements();
            }
        } catch (error) {
            console.error('Failed to fetch achievements:', error);
        }
    }

    // Nouvelle méthode pour récupérer les achievements déjà débloqués
    async fetchUserAchievements() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const userId = this.getUserIdFromToken(token);
            if (!userId) return;

            const response = await fetch(`${API_CONFIG.API_BASE_URL}/achievements/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userAchievements = await response.json();
                
                // Marquer les achievements déjà débloqués
                userAchievements.forEach(achievement => {
                    this.unlockedAchievements.add(achievement.id);
                    
                    // Marquer aussi comme triggered dans les conditions locales
                    const condition = Object.values(this.achievementConditions)
                        .find(cond => cond.name === achievement.name);
                    if (condition) {
                        condition.triggered = true;
                    }
                });
                
                console.log('User already has achievements:', this.unlockedAchievements);
            }
        } catch (error) {
            console.error('Failed to fetch user achievements:', error);
        }
    }

    // Called when player dies
    onPlayerDeath() {
        this.checkAchievement('first_death');
    }

    // Called when player performs wall jump
    onWallJump() {
        const condition = this.achievementConditions['wall_jumper'];
        condition.count++;
        
        if (condition.count >= 5) {
            this.checkAchievement('wall_jumper');
        }
    }

    // Called when level is completed
    onLevelComplete(completionTime) {
        // Check speed runner achievement (2 minutes = 120000ms)
        if (completionTime < 120000) {
            this.checkAchievement('speed_runner');
        }

        // Check if all questions were answered
        if (this.scene.answeredQuestions && this.scene.answeredQuestions.size >= 3) {
            this.checkAchievement('question_master');
        }
    }

    async checkAchievement(conditionKey) {
        const condition = this.achievementConditions[conditionKey];
        
        if (!condition || !condition.id) {
            console.log(`Achievement condition not found or no ID: ${conditionKey}`);
            return;
        }

        // Vérifier d'abord si l'achievement est déjà débloqué
        if (condition.triggered || this.unlockedAchievements.has(condition.id)) {
            console.log(`Achievement already unlocked: ${condition.name}`);
            return;
        }

        condition.triggered = true;
        
        // Vérifier l'authentification avant d'ajouter à la queue
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token available, showing achievement locally only');
            // Afficher quand même la notification localement
            this.showAchievementNotification(condition);
            return;
        }
        
        // Ajouter à la queue au lieu d'exécuter immédiatement
        this.pendingUnlocks.push(condition);
        
        // Traiter la queue de manière asynchrone
        this.processUnlockQueue();
    }

    // Nouvelle méthode pour traiter la queue d'achievements
    async processUnlockQueue() {
        if (this.isProcessing || this.pendingUnlocks.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        while (this.pendingUnlocks.length > 0) {
            const condition = this.pendingUnlocks.shift();
            
            // Afficher immédiatement la notification
            this.showAchievementNotification(condition);
            
            // Sauvegarder en arrière-plan sans attendre
            this.saveAchievementInBackground(condition);
            
            // Petit délai entre les notifications
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.isProcessing = false;
    }

    // Améliorer la méthode de sauvegarde en arrière-plan
    saveAchievementInBackground(condition) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found, cannot save achievement');
            return;
        }

        const userId = this.getUserIdFromToken(token);
        if (!userId) {
            console.warn('Cannot get user ID from token');
            return;
        }

        // Vérifier une dernière fois si l'achievement n'est pas déjà débloqué
        if (this.unlockedAchievements.has(condition.id)) {
            console.log(`Achievement already unlocked (double-check): ${condition.name}`);
            return;
        }

        console.log(`Saving achievement in background: ${condition.name}`);

        // Marquer immédiatement comme débloqué localement pour éviter les doublons
        this.unlockedAchievements.add(condition.id);

        // Utiliser fetch sans await pour ne pas bloquer
        fetch(`${API_CONFIG.API_BASE_URL}/achievements/unlock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: userId,
                achievement_id: condition.id
            })
        }).then(response => {
            if (response.ok) {
                console.log(`Achievement saved successfully: ${condition.name}`);
            } else {
                return response.json().then(error => {
                    if (error.error === 'User already has this achievement') {
                        console.log(`User already has achievement: ${condition.name}`);
                    } else {
                        console.error('Failed to save achievement:', error);
                        // En cas d'erreur, retirer de la liste locale
                        this.unlockedAchievements.delete(condition.id);
                        condition.triggered = false;
                    }
                });
            }
        }).catch(error => {
            console.error('Error saving achievement:', error);
            // En cas d'erreur, retirer de la liste locale
            this.unlockedAchievements.delete(condition.id);
            condition.triggered = false;
        });
    }

    // Méthode dépréciée - garder pour compatibilité mais ne plus utiliser
    async unlockAchievement(condition) {
        console.warn('unlockAchievement is deprecated, using background save instead');
        this.saveAchievementInBackground(condition);
    }

    getUserIdFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub;
        } catch (error) {
            console.error('Failed to decode token:', error);
            return null;
        }
    }

    showAchievementNotification(condition) {
        // Create achievement notification UI
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${condition.name}</div>
                <div class="achievement-description">${condition.description}</div>
            </div>
        `;

        // Add CSS for the notification (existing CSS code stays the same)
        if (!document.querySelector('#achievement-styles')) {
            const style = document.createElement('style');
            style.id = 'achievement-styles';
            style.textContent = `
                .achievement-notification {
                    position: fixed;
                    top: 20px;
                    right: -400px;
                    width: 350px;
                    background: linear-gradient(135deg, #ffd700, #ffed4a);
                    border: 2px solid #e6b800;
                    border-radius: 10px;
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                    animation: slideIn 0.5s ease-out forwards, slideOut 0.5s ease-in 4.5s forwards;
                }
                
                .achievement-icon {
                    font-size: 40px;
                    margin-right: 15px;
                }
                
                .achievement-content {
                    flex: 1;
                }
                
                .achievement-title {
                    font-weight: bold;
                    font-size: 16px;
                    color: #8b4513;
                    margin-bottom: 5px;
                }
                
                .achievement-name {
                    font-weight: bold;
                    font-size: 18px;
                    color: #2c1810;
                    margin-bottom: 3px;
                }
                
                .achievement-description {
                    font-size: 14px;
                    color: #5d4e37;
                }
                
                @keyframes slideIn {
                    to { right: 20px; }
                }
                
                @keyframes slideOut {
                    to { right: -400px; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Play achievement sound - improved version
        this.playAchievementSound();

        // Remove notification after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // New method to handle achievement sound playing
    playAchievementSound() {
        try {
            // Check if the scene and sound manager exist
            if (!this.scene || !this.scene.sound) {
                console.warn('Scene or sound manager not available');
                return;
            }

            // Check if the sound exists in the cache
            if (this.scene.sound.sounds && this.scene.sound.sounds.find(sound => sound.key === 'achievement_sound')) {
                this.scene.sound.play('achievement_sound', { volume: 0.3 });
                console.log('Achievement sound played successfully');
            } else {
                console.warn('Achievement sound not found in sound cache');
                // Try alternative approach
                if (this.scene.cache && this.scene.cache.audio.exists('achievement_sound')) {
                    this.scene.sound.play('achievement_sound', { volume: 0.3 });
                    console.log('Achievement sound played via cache');
                } else {
                    console.warn('Achievement sound not loaded or not available');
                }
            }
        } catch (error) {
            console.warn('Could not play achievement sound:', error);
        }
    }
}
