import { startPhaserGame } from "./main.js";

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get all buttons
    const playBtn = document.getElementById('playBtn');
    const levelsBtn = document.getElementById('levelsBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');

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
    playBtn.addEventListener('click', function() {
        playPixelSound();
        window.landingPageAPI.hide();
        startPhaserGame();
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

    // Add hover effects with sound (optional - commented out to avoid too many sounds)
    /*
    const allButtons = document.querySelectorAll('.pixel-button, .small-pixel-button');
    allButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            playHoverSound();
        });
    });
    */

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

    console.log('Landing page initialized! Use window.landingPageAPI to interact with it.');
});