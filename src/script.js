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
    
        const response = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            alert('Login successful');
            window.dispatchEvent(new CustomEvent('hideAllModals'));
            updateAuthButtons();
        } else {
            alert(data.error || 'Login failed');
        }
    }
    window.submitLogin = submitLogin;

    async function submitRegister() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
    
        const response = await fetch('http://localhost:5000/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful, you can now login');
            window.dispatchEvent(new CustomEvent('showLogin'));
            window.landingPageAPI.hide();
        } else {
            alert(data.error || 'Registration failed');
        }
    }
    window.submitRegister = submitRegister;

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
        document.getElementById('settingsForm').classList.add('hidden'); // Ajoute cette ligne
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
        window.dispatchEvent(new CustomEvent('showLeaderboard'));
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

    console.log('Landing page initialized! Use window.landingPageAPI to interact with it.');
});