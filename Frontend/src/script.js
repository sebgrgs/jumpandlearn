import API_CONFIG from "./config.js";

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get all buttons
    const playBtn = document.getElementById('playBtn');
    const levelsBtn = document.getElementById('levelsBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const reviewsBtn = document.getElementById('reviewsBtn');


function updateAuthButtons() {
    if (localStorage.getItem('token')) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

    updateAuthButtons();

    async function submitLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Désactiver le bouton et afficher le loading
        const submitBtn = document.getElementById('loginSubmitBtn');
        const btnText = document.getElementById('loginBtnText');
        const btnLoading = document.getElementById('loginBtnLoading');
        
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');

        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                alert('Login successful!');
                updateAuthButtons();
                window.dispatchEvent(new CustomEvent('hideAllModals'));
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    }
    window.submitLogin = submitLogin;

    async function submitRegister() {
        const email = document.getElementById('registerEmail').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        // Validation basique
        if (!email || !username || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Désactiver le bouton et afficher le loading
        const submitBtn = document.getElementById('registerSubmitBtn');
        const btnText = document.getElementById('registerBtnText');
        const btnLoading = document.getElementById('registerBtnLoading');
        
        // État de loading
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');

        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Registration successful, you can now login!');
                // Vider les champs
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerPassword').value = '';
                window.dispatchEvent(new CustomEvent('hideAllModals'));
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error. Please try again.');
        } finally {
            // Réactiver le bouton dans tous les cas
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    }
    window.submitRegister = submitRegister;

    // Example function to fetch leaderboard
    async function fetchLeaderboard() {
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/progress/leaderboard`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.leaderboard;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return [];
        }
    }

    // Add pixel sound effect simulation
    function playPixelSound() {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    // Add hover sound effect
    function playHoverSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    }

    // Button click handlers
    window.addEventListener('showSettings', () => {
        document.getElementById('settingsForm').classList.remove('hidden');
        document.querySelector('.button-container').classList.add('hidden');
        document.querySelector('.secondary-buttons').classList.add('hidden');
        loadControlSettings();
    });

    window.addEventListener('showLogin', () => {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.querySelector('.button-container').classList.add('hidden');
        document.querySelector('.secondary-buttons').classList.add('hidden');
    });
    
    window.addEventListener('showRegister', () => {
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
        document.querySelector('.button-container').classList.add('hidden');
        document.querySelector('.secondary-buttons').classList.add('hidden');
    });
    
    window.addEventListener('hideAllModals', () => {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('levelSelect').classList.add('hidden');
        document.getElementById('settingsForm').classList.add('hidden');
        document.getElementById('leaderboardForm').classList.add('hidden');
        document.getElementById('reviewsForm').classList.add('hidden');
        document.querySelector('.button-container').classList.remove('hidden');
        document.querySelector('.secondary-buttons').classList.remove('hidden');
    });

    window.addEventListener('showLevels', () => {
        document.getElementById('levelSelect').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.querySelector('.button-container').classList.add('hidden');
        document.querySelector('.secondary-buttons').classList.add('hidden');

        // For example, you could display a modal or redirect to a levels page
    });

    playBtn.addEventListener('click', function() {
        if (!localStorage.getItem('token')) {
            alert('You must be logged to play !');
            return;
        }
        playPixelSound();
        window.location.href = "game.html";
    });

    levelsBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Levels button clicked - Show level selection!');
        window.dispatchEvent(new CustomEvent('showLevels'));
    });

    registerBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Register button clicked - Show registration form!');
        window.dispatchEvent(new CustomEvent('showRegister'));
    });

    loginBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Login button clicked - Show login form!');
        window.dispatchEvent(new CustomEvent('showLogin'));
    });

    logoutBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Logout button clicked - Perform logout!');
        localStorage.removeItem('token');
        alert('You have been logged out.');
        updateAuthButtons();
        window.dispatchEvent(new CustomEvent('hideAllModals'));
    });

    settingsBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Settings button clicked - Show settings menu!');
        window.dispatchEvent(new CustomEvent('showSettings'));
    });

    leaderboardBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Leaderboard button clicked - Show leaderboard!');
        showLeaderboard();
    });

    reviewsBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Reviews button clicked - Show reviews!');
        showReviews();
    });
    
    function loadControlSettings() {
        const controls = JSON.parse(localStorage.getItem('gameControls')) || {
            jump: 'Space',
            left: 'ArrowLeft', 
            right: 'ArrowRight'
        };
        
        document.getElementById('jumpKey').textContent = getKeyDisplayName(controls.jump);
        document.getElementById('leftKey').textContent = getKeyDisplayName(controls.left);
        document.getElementById('rightKey').textContent = getKeyDisplayName(controls.right);
    }

    function getKeyDisplayName(key) {
        const keyNames = {
            // Touches spéciales
            'Space': 'SPACE',
            'Enter': 'ENTER',
            'Escape': 'ESC',
            'Tab': 'TAB',
            'Backspace': 'BACKSPACE',
            'Delete': 'DELETE',
            'Insert': 'INSERT',
            'Home': 'HOME',
            'End': 'END',
            'PageUp': 'PAGE UP',
            'PageDown': 'PAGE DOWN',
            
            // Flèches
            'ArrowUp': 'UP ARROW',
            'ArrowDown': 'DOWN ARROW',
            'ArrowLeft': 'LEFT ARROW',
            'ArrowRight': 'RIGHT ARROW',
            
            // Lettres (A-Z)
            'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E',
            'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J',
            'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O',
            'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T',
            'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y',
            'KeyZ': 'Z',
            
            // Chiffres
            'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
            'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9',
            
            // Touches F
            'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
            'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
            'F11': 'F11', 'F12': 'F12',
            
            // Pavé numérique
            'Numpad0': 'NUM 0', 'Numpad1': 'NUM 1', 'Numpad2': 'NUM 2',
            'Numpad3': 'NUM 3', 'Numpad4': 'NUM 4', 'Numpad5': 'NUM 5',
            'Numpad6': 'NUM 6', 'Numpad7': 'NUM 7', 'Numpad8': 'NUM 8',
            'Numpad9': 'NUM 9', 'NumpadEnter': 'NUM ENTER',
            
            // Modificateurs
            'ShiftLeft': 'LEFT SHIFT', 'ShiftRight': 'RIGHT SHIFT',
            'ControlLeft': 'LEFT CTRL', 'ControlRight': 'RIGHT CTRL',
            'AltLeft': 'LEFT ALT', 'AltRight': 'RIGHT ALT',
            
            // Ponctuation
            'Semicolon': ';', 'Equal': '=', 'Comma': ',', 'Minus': '-',
            'Period': '.', 'Slash': '/', 'Backquote': '`',
            'BracketLeft': '[', 'Backslash': '\\', 'BracketRight': ']',
            'Quote': "'"
        };
        
        // Si la touche est dans le mapping, retourne le nom lisible
        if (keyNames[key]) {
            return keyNames[key];
        }
        
        // Sinon, format automatique pour les touches non listées
        return key.replace('Key', '').replace('Digit', '').replace('Numpad', 'NUM ').toUpperCase();
    }

    // Écoute des clics sur les boutons de contrôle
    document.querySelectorAll('.control-key').forEach(btn => {
        btn.addEventListener('click', function() {
            const control = this.dataset.control;
            this.textContent = 'Press key...';
            this.classList.add('listening');
            
            const handleKeyPress = (e) => {
                e.preventDefault();
                const newKey = e.code;
                
                // Sauvegarde le nouveau contrôle
                const controls = JSON.parse(localStorage.getItem('gameControls')) || {};
                controls[control] = newKey;
                localStorage.setItem('gameControls', JSON.stringify(controls));
                
                // Met à jour l'affichage
                this.textContent = getKeyDisplayName(newKey);
                this.classList.remove('listening');
                
                // Retire l'écouteur
                document.removeEventListener('keydown', handleKeyPress);
            };
            
            document.addEventListener('keydown', handleKeyPress);
        });
    });

    // Reset des contrôles par défaut
    document.getElementById('resetControls').addEventListener('click', function() {
        const defaultControls = {
            jump: 'ArrowUp',
            left: 'ArrowLeft',
            right: 'ArrowRight'
        };
        localStorage.setItem('gameControls', JSON.stringify(defaultControls));
        loadControlSettings();
    });
    // Add keyboard navigation
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case 'Enter':
            case ' ':
                if (document.activeElement && document.activeElement.classList.contains('pixel-button')) {
                    document.activeElement.click();
                }
                break;
            case 'Escape':
                // Hide any open modals or return to main menu
                window.dispatchEvent(new CustomEvent('hideAllModals'));
                break;
        }
    });

    // Add floating animation to title
    function animateTitle() {
        const title = document.querySelector('.game-title');
        let direction = 1;
        let position = 0;

        setInterval(() => {
            position += direction * 0.5;
            if (position > 5 || position < -5) {
                direction *= -1;
            }
            title.style.transform = `translateY(${position}px)`;
        }, 100);
    }

    // Start title animation
    animateTitle();

    // Parallax effect for clouds
    let cloudOffset = 0;
    function animateClouds() {
        cloudOffset += 0.1;
        const clouds = document.querySelectorAll('.cloud');
        clouds.forEach((cloud, index) => {
            const speed = 0.5 + (index * 0.2);
            cloud.style.transform = `translateX(${Math.sin(cloudOffset * speed) * 10}px)`;
        });
        requestAnimationFrame(animateClouds);
    }

    // Start cloud animation
    animateClouds();

    // API for external integration (your Phaser game can use these)
    window.landingPageAPI = {
        // Hide the landing page
        hide: function() {
            document.querySelector('.game-container').style.display = 'none';
        },

        // Show the landing page
        show: function() {
            document.querySelector('.game-container').style.display = 'block';
        },

        // Update button states (e.g., disable play button if not logged in)
        updateButtonState: function(buttonId, enabled) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = !enabled;
                button.style.opacity = enabled ? '1' : '0.5';
            }
        },

        // Set user info (for display purposes)
        setUserInfo: function(username, isLoggedIn) {
            if (isLoggedIn && username) {
                // You could add a welcome message or user indicator here
                console.log(`Welcome, ${username}!`);
            }
        }
    };

    document.querySelectorAll('.level-select-buttons .pixel-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const level = this.getAttribute('data-level');
            localStorage.setItem('selectedLevel', level);
            window.location.href = "game.html";
        });
    });

    document.getElementById('refreshLeaderboard').addEventListener('click', function() {
        playPixelSound();
        showLeaderboard();
    });
    
    console.log('Landing page initialized! Use window.landingPageAPI to interact with it.');

    async function showLeaderboard() {
        try {
            const leaderboardForm = document.getElementById('leaderboardForm');
            const leaderboardContent = document.getElementById('leaderboardContent');
            
            leaderboardForm.classList.remove('hidden');
            document.querySelector('.button-container').classList.add('hidden');
            document.querySelector('.secondary-buttons').classList.add('hidden');
            
            leaderboardContent.innerHTML = '<div class="loading-message">Loading leaderboard...</div>';
            
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/progress/leaderboard`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            let leaderboardHTML = '';
            
            if (!data.leaderboard || Object.keys(data.leaderboard).length === 0) {
                leaderboardHTML = '<div class="no-data-message">No times recorded yet. Be the first to complete a level!</div>';
            } else {
                // Iterate through each level
                Object.keys(data.leaderboard).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
                    const levelRecords = data.leaderboard[level];
                    
                    leaderboardHTML += `
                        <div class="level-section">
                            <h3>🎮 Level ${level - 1} 🎮</h3>
                            <div class="leaderboard-entries">`;
            
                    levelRecords.forEach((entry, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span class="rank-badge">${index + 1}</span>`;
                        leaderboardHTML += `
                            <div class="leaderboard-entry">
                                <span class="medal">${medal}</span>
                                <span class="player-name">${entry.username}</span>
                                <span class="player-time">${formatTime(entry.completion_time)}</span>
                            </div>`;
                });
                
                leaderboardHTML += '</div></div>';
                });
            }
            
            leaderboardContent.innerHTML = leaderboardHTML;
            
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            const leaderboardContent = document.getElementById('leaderboardContent');
            leaderboardContent.innerHTML = `
                <div class="no-data-message">
                    ❌ Failed to load leaderboard<br>
                    <small>Error: ${error.message}</small><br>
                    <small>Make sure the server is running on localhost:5000</small>
                </div>`;
        }
    }

    function formatTime(timeMs) {
        if (!timeMs) return 'N/A';
        
        const totalMs = Math.floor(timeMs);
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const milliseconds = totalMs % 1000;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
    }

    // Add event handlers for the reviews functionality
    reviewsBtn.addEventListener('click', function() {
        playPixelSound();
        console.log('Reviews button clicked - Show reviews!');
        showReviews();
    });

    document.getElementById('refreshReviews').addEventListener('click', function() {
        playPixelSound();
        showReviews();
    });

    document.getElementById('addReviewBtn').addEventListener('click', function() {
        playPixelSound();
        toggleAddReviewPanel();
    });

    // Setup review form handlers
    setupReviewForm();

    // Function to fetch and display reviews
async function showReviews() {
    try {
        const reviewsForm = document.getElementById('reviewsForm');
        const reviewsContent = document.getElementById('reviewsContent');
        const addReviewBtn = document.getElementById('addReviewBtn');
        
        reviewsForm.classList.remove('hidden');
        document.querySelector('.button-container').classList.add('hidden');
        document.querySelector('.secondary-buttons').classList.add('hidden');
        
        // Show add review button only if logged in
        if (localStorage.getItem('token')) {
            addReviewBtn.classList.remove('hidden');
        } else {
            addReviewBtn.classList.add('hidden');
        }
        
        reviewsContent.innerHTML = '<div class="loading-message">Loading reviews...</div>';
        
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/reviews/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reviews = await response.json();
        
        if (!reviews || reviews.length === 0) {
            reviewsContent.innerHTML = '<div class="no-data-message">No reviews yet. Be the first to share your thoughts!</div>';
            return;
        }
        
        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        let reviewsHTML = '';
        reviews.forEach(review => {
            const isAuthor = localStorage.getItem('token') && 
                             review.user_id === getUserIdFromToken(localStorage.getItem('token'));
            
            // Nettoyer le contenu de la review pour supprimer les espaces inutiles
            const cleanContent = review.content
                .split('\n')                           // Séparer par lignes
                .map(line => line.trim())              // Supprimer espaces début/fin de chaque ligne
                .filter(line => line.length > 0)      // Supprimer les lignes vides
                .join('\n');                           // Rejoindre avec des sauts de ligne simples
            
            reviewsHTML += `
<div class="review-item" data-review-id="${review.id}">
    <div class="review-header">
        <div>
            <div class="review-title">${escapeHTML(review.title)}</div>
            <div class="review-meta">
                <span class="review-author">By: ${escapeHTML(review.username || 'Anonymous')}</span>
                <span class="review-date">${formatDate(review.created_at)}</span>
            </div>
        </div>
        <div class="review-rating">
            ${generateStars(review.rating)}
        </div>
    </div>
    <div class="review-content" id="content-${review.id}">${escapeHTML(cleanContent)}</div>
    ${isAuthor ? `
    <div class="review-actions">
        <button class="review-action-btn edit-review" data-review-id="${review.id}">EDIT</button>
        <button class="review-action-btn delete-review" data-review-id="${review.id}">DELETE</button>
    </div>
    ` : ''}
</div>`.trim();
        });
        
        reviewsContent.innerHTML = reviewsHTML;
        
        // Add event listeners for edit/delete buttons
        document.querySelectorAll('.edit-review').forEach(btn => {
            btn.addEventListener('click', function() {
                editReview(this.dataset.reviewId);
            });
        });
        
        document.querySelectorAll('.delete-review').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteReview(this.dataset.reviewId);
            });
        });
        
    } catch (error) {
        console.error('Failed to load reviews:', error);
        const reviewsContent = document.getElementById('reviewsContent');
        reviewsContent.innerHTML = `
            <div class="no-data-message">
                ❌ Failed to load reviews<br>
                <small>Error: ${error.message}</small>
            </div>`;
    }
}

    // Function to toggle add review panel
    function toggleAddReviewPanel() {
        const addReviewPanel = document.getElementById('addReviewPanel');
        
        if (addReviewPanel.classList.contains('hidden')) {
            // Reset form fields
            document.getElementById('reviewTitle').value = '';
            document.getElementById('reviewContent').value = '';
            document.querySelectorAll('.star-button').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            addReviewPanel.classList.remove('hidden');
        } else {
            addReviewPanel.classList.add('hidden');
        }
    }

    // Setup review form event handlers
    function setupReviewForm() {
        // Character counter for title
        const titleInput = document.getElementById('reviewTitle');
        const titleCounter = document.getElementById('titleCounter');
        
        titleInput.addEventListener('input', function() {
            const count = this.value.length;
            titleCounter.textContent = `${count}/100`;
            
            if (count > 90) {
                titleCounter.classList.add('near-limit');
            } else {
                titleCounter.classList.remove('near-limit');
            }
            
            if (count >= 100) {
                titleCounter.classList.add('at-limit');
            } else {
                titleCounter.classList.remove('at-limit');
            }
        });
        
        // Character counter for content
        const contentInput = document.getElementById('reviewContent');
        const contentCounter = document.getElementById('contentCounter');
        
        contentInput.addEventListener('input', function() {
            const count = this.value.length;
            contentCounter.textContent = `${count}/500`;
            
            if (count > 450) {
                contentCounter.classList.add('near-limit');
            } else {
                contentCounter.classList.remove('near-limit');
            }
            
            if (count >= 500) {
                contentCounter.classList.add('at-limit');
            } else {
                contentCounter.classList.remove('at-limit');
            }
        });
        
        // Star rating buttons
        document.querySelectorAll('.star-button').forEach(btn => {
            btn.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                
                // Remove selected class from all stars
                document.querySelectorAll('.star-button').forEach(star => {
                    star.classList.remove('selected');
                });
                
                // Add selected class to current star and all previous stars
                document.querySelectorAll(`.star-button[data-rating="${rating}"], .star-button[data-rating="${rating}"] ~ .star-button`).forEach(star => {
                    if (parseInt(star.dataset.rating) <= rating) {
                        star.classList.add('selected');
                    }
                });
            });
        });
        
        // Submit review button
        document.getElementById('submitReviewBtn').addEventListener('click', submitReview);
    }

        // Function to show a temporary notification
    function showNotification(message, type = 'success', duration = 3000) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    // Function to submit a new review
    async function submitReview() {
        if (!localStorage.getItem('token')) {
            showNotification('You must be logged in to submit a review.', 'error');
            return;
        }
        
        const title = document.getElementById('reviewTitle').value.trim();
        const content = document.getElementById('reviewContent').value.trim();
        const ratingEl = document.querySelector('.star-button.selected');
        
        if (!title) {
            showNotification('Please enter a title for your review.', 'error');
            return;
        }
        
        if (!content) {
            showNotification('Please enter content for your review.', 'error');
            return;
        }
        
        if (!ratingEl) {
            showNotification('Please select a rating for your review.', 'error');
            return;
        }
        
        const rating = parseInt(ratingEl.dataset.rating);
        
        const submitBtn = document.getElementById('submitReviewBtn');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.innerHTML = `
            <span class="loading-spinner"></span>
            SUBMITTING...
        `;
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/reviews/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, content, rating })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Review submitted successfully!', 'success');
                toggleAddReviewPanel(); // Hide the form
                showReviews(); // Refresh reviews list
            } else {
                showNotification(`Error: ${data.error || 'Failed to submit review'}`, 'error');
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Function to edit a review
    async function editReview(reviewId) {
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/reviews/${reviewId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const review = await response.json();
            
            // Populate form with existing review data
            document.getElementById('reviewTitle').value = review.title;
            document.getElementById('reviewContent').value = review.content;
            
            // Select the appropriate star
            document.querySelectorAll('.star-button').forEach(btn => {
                const btnRating = parseInt(btn.dataset.rating);
                if (btnRating <= review.rating) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
            
            // Show the form
            toggleAddReviewPanel();
            
            // Change submit button to update
            const submitBtn = document.getElementById('submitReviewBtn');
            submitBtn.textContent = 'UPDATE REVIEW';
            submitBtn.dataset.reviewId = reviewId;
            submitBtn.dataset.isUpdate = 'true';
            
            // Replace the regular submit handler with update handler
            submitBtn.removeEventListener('click', submitReview);
            submitBtn.addEventListener('click', async function updateHandler() {
                await updateReview(reviewId);
                
                // Restore original button state after update
                submitBtn.textContent = 'SUBMIT REVIEW';
                delete submitBtn.dataset.reviewId;
                delete submitBtn.dataset.isUpdate;
                
                // Restore original click handler
                submitBtn.removeEventListener('click', updateHandler);
                submitBtn.addEventListener('click', submitReview);
            }, { once: true });
            
        } catch (error) {
            console.error('Failed to load review for editing:', error);
            alert('Failed to load review. Please try again.');
        }
    }

    // Function to update a review
    async function updateReview(reviewId) {
        const title = document.getElementById('reviewTitle').value.trim();
        const content = document.getElementById('reviewContent').value.trim();
        const ratingEl = document.querySelector('.star-button.selected');
        
        if (!title || !content || !ratingEl) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        
        const rating = parseInt(ratingEl.dataset.rating);
        
        const submitBtn = document.getElementById('submitReviewBtn');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.innerHTML = `
            <span class="loading-spinner"></span>
            UPDATING...
        `;
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, content, rating })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Review updated successfully!', 'success');
                toggleAddReviewPanel(); // Hide the form
                showReviews(); // Refresh reviews list
            } else {
                showNotification(`Error: ${data.error || 'Failed to update review'}`, 'error');
            }
        } catch (error) {
            console.error('Failed to update review:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Function to delete a review
    async function deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }
        
        // Find the delete button and show loading
        const deleteBtn = document.querySelector(`[data-review-id="${reviewId}"].delete-review`);
        const originalText = deleteBtn.textContent;
        
        deleteBtn.innerHTML = `
            <span class="loading-spinner"></span>
            DELETING...
        `;
        deleteBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                showNotification('Review deleted successfully!', 'success');
                
                // Animate the review item removal
                const reviewItem = document.querySelector(`[data-review-id="${reviewId}"]`);
                if (reviewItem) {
                    reviewItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    reviewItem.style.opacity = '0';
                    reviewItem.style.transform = 'translateX(-100%)';
                    
                    setTimeout(() => {
                        showReviews(); // Refresh reviews list
                    }, 300);
                } else {
                    showReviews(); // Fallback refresh
                }
            } else {
                const data = await response.json();
                showNotification(`Error: ${data.error || 'Failed to delete review'}`, 'error');
                
                // Restore button state on error
                deleteBtn.textContent = originalText;
                deleteBtn.disabled = false;
            }
        } catch (error) {
            console.error('Failed to delete review:', error);
            showNotification('Network error. Please try again.', 'error');
            
            // Restore button state on error
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        }
    }

    // Helper function to generate star rating HTML
    function generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '⭐' : '☆';
        }
        return stars;
    }

    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Helper function to escape HTML to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Helper function to extract user ID from JWT token
    function getUserIdFromToken(token) {
        try {
            // JWT tokens are in the format: header.payload.signature
            // We need the payload part
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload).sub; // 'sub' is standard for subject/user ID
        } catch (e) {
            console.error('Error extracting user ID from token:', e);
            return null;
        }
    }
    });