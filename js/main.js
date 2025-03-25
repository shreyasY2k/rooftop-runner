// Main game file for Rooftop Runner

class Game {
    constructor() {
        // Game elements
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.physics = null;
        this.map = null;
        this.buildings = null;
        this.player = null;
        this.controls = null;
        this.dayNightCycle = null;
        this.obstacles = null;
        
        // Game state
        this.isLoading = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.gameTime = 0;
        this.lastFrameTime = 0;
        this.ammoLoaded = false;
        
        // DOM elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.progress');
        this.loadingText = document.querySelector('.loading-text');
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartButton = document.getElementById('restart-button');
        
        // Event listeners
        this.restartButton.addEventListener('click', () => this.restart());
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                this.togglePause();
            }
        });
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Set up loading screen
        this.showLoadingScreen(0);
        
        // Initialize Three.js scene
        this.initScene();
        
        // Load Ammo.js first, then initialize physics
        this.loadAmmo()
            .then(() => this.initPhysics())
            .then(() => this.loadAssets())
            .then(() => this.initializeGameComponents())
            .catch(error => {
                console.error('Game initialization failed:', error);
                this.loadingText.textContent = 'Error loading game. Please refresh the page.';
            });
    }
    
    loadAmmo() {
        this.loadingText.textContent = 'Loading physics engine...';
        return new Promise((resolve, reject) => {
            // Check if Ammo is already loaded
            if (typeof Ammo !== 'undefined') {
                if (typeof Ammo === 'function') {
                    // If Ammo is a function, it needs to be initialized
                    Ammo().then(() => {
                        console.log('Ammo.js initialized successfully');
                        this.ammoLoaded = true;
                        resolve();
                    }).catch(error => {
                        reject(error);
                    });
                } else {
                    // Ammo is already initialized
                    console.log('Ammo.js already loaded');
                    this.ammoLoaded = true;
                    resolve();
                }
                return;
            }
            
            // If we get here, we need to load Ammo.js dynamically
            // Since we've added Ammo.js in the HTML, this is now a fallback
            const script = document.createElement('script');
            script.src = 'scripts/ammo.js';
            script.async = true;
            
            script.onload = () => {
                Ammo().then(() => {
                    console.log('Ammo.js loaded and initialized successfully');
                    this.ammoLoaded = true;
                    resolve();
                }).catch(error => {
                    reject(error);
                });
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Ammo.js script'));
            };
            
            document.body.appendChild(script);
        });
    }
    
    initScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Set up lights
        this.setupLights();
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 70, 30);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Store lights for day/night cycle
        this.sunLight = directionalLight;
        this.ambientLight = ambientLight;
    }
    
    initPhysics() {
        if (!this.ammoLoaded) {
            console.error('Ammo.js not loaded. Cannot initialize physics.');
            return Promise.reject(new Error('Ammo.js not loaded'));
        }
        
        try {
            // Create physics system with error handling
            this.physics = new Physics();
            return this.physics.init()
                .then(() => {
                    console.log('Physics initialized successfully');
                    // Turn off debug renderer to avoid rendering issues
                    if (this.physics.debugRenderer) {
                        this.physics.debugRenderer.disable();
                    }
                })
                .catch(error => {
                    console.error('Failed to initialize physics:', error);
                    this.loadingText.textContent = 'Error initializing physics. Please refresh the page.';
                    throw error;
                });
        } catch (error) {
            console.error('Error creating physics system:', error);
            return Promise.reject(error);
        }
    }
    
    loadAssets() {
        this.loadingText.textContent = 'Loading game assets...';
        
        return new Promise(resolve => {
            // Simulate asset loading
            let progress = 0.1; // Start at 10% since Ammo.js is already loaded
            const loadingInterval = setInterval(() => {
                progress += 0.01;
                this.showLoadingScreen(Math.min(progress, 0.9)); // Cap at 90%
                
                if (progress >= 0.9) {
                    clearInterval(loadingInterval);
                    resolve();
                }
            }, 50);
            
            // In a real game, you would use the asset loader:
            /*
            const assets = [
                { name: 'playerModel', url: 'assets/models/player.glb' },
                { name: 'cityTexture', url: 'assets/textures/city.jpg' },
                // ... more assets
            ];
            
            return new Promise(resolve => {
                Utils.loadAssets(
                    assets,
                    (progress) => {
                        this.showLoadingScreen(0.1 + progress * 0.8); // Scale to 10%-90%
                    },
                    (loadedAssets) => {
                        // Store loaded assets
                        this.assets = loadedAssets;
                        resolve();
                    }
                );
            });
            */
        });
    }
    
    initializeGameComponents() {
        // Make sure physics is initialized
        if (!this.physics || !this.ammoLoaded) {
            console.error('Physics system not initialized. Cannot continue.');
            this.loadingText.textContent = 'Error initializing physics. Please refresh the page.';
            return;
        }
        
        // Initialize day/night cycle
        this.dayNightCycle = new DayNightCycle(
            this.scene,
            this.sunLight,
            this.ambientLight
        );
        
        // Initialize city map
        this.map = new Map(this.scene, this.physics);
        
        // Initialize buildings
        this.buildings = new Buildings(this.scene, this.physics, this.map);
        this.buildings.init();
        
        // Initialize obstacles
        this.obstacles = new Obstacles(this.scene, this.physics, this.buildings);
        this.obstacles.init();
        
        // Initialize player
        this.player = new Player(this.scene, this.physics, this.camera);
        this.player.init();
        
        // Initialize controls
        this.controls = new Controls(this.player);
        this.controls.init();
        
        // Set player in map for minimap updates
        this.map.player = this.player;
        
        // Set day/night cycle in map
        this.map.dayNightCycle = this.dayNightCycle;
        
        // Initialize map after setting player
        this.map.init();
        
        // Hide loading screen and start game
        setTimeout(() => {
            this.showLoadingScreen(1);
            this.startGame();
        }, 500);
    }
    
    startGame() {
        // Hide loading screen
        this.loadingScreen.style.display = 'none';
        
        // Reset game state
        this.isLoading = false;
        this.isGameOver = false;
        this.score = 0;
        this.gameTime = 0;
        this.lastFrameTime = performance.now();
        
        // Update score display
        this.updateScoreDisplay();
        
        // Start game loop
        this.gameLoop();
    }
    
    gameLoop() {
        if (this.isGameOver) return;
        
        try {
            // Calculate delta time
            const now = performance.now();
            const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1); // Cap at 0.1 seconds
            this.lastFrameTime = now;
            
            if (!this.isPaused) {
                // Update game time
                this.gameTime += deltaTime;
                
                // Update physics
                if (this.physics) {
                    this.physics.update(deltaTime);
                }
                
                // Update player
                this.player.update(deltaTime);
                
                // Update day/night cycle
                this.dayNightCycle.update(deltaTime);
                
                // Update map
                this.map.update();
                
                // Update obstacles
                this.obstacles.update(deltaTime);
                
                // Check collectible collisions
                const collectedItems = this.obstacles.checkCollisions(
                    this.player.getPosition(),
                    this.player.radius
                );
                
                // Process collected items
                this.processCollectedItems(collectedItems);
                
                // Remove collected items from scene
                this.obstacles.removeCollected();
                
                // Check for game over conditions
                this.checkGameOver();
                
                // Update UI
                this.updateUI();
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
            
            // Continue game loop
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Error in game loop:', error);
            // Try to continue
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    processCollectedItems(collectedItems) {
        collectedItems.forEach(item => {
            // Add to score
            this.score += item.value;
            
            // Create pickup effect
            Utils.createPickupEffect(
                this.scene,
                item.object.position.clone(),
                item.object.material.color.getHex(),
                1,
                0.5
            );
            
            // Handle special items
            if (item.type === 'powerup') {
                // Apply power-up effect (e.g., temporary speed boost)
                this.player.moveSpeed *= 1.5;
                
                // Reset after duration
                setTimeout(() => {
                    this.player.moveSpeed /= 1.5;
                }, 5000);
            }
        });
        
        // Update score display
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        this.scoreElement.textContent = Utils.formatScore(this.score);
    }
    
    updateUI() {
        // Update time display with day/night state
        const timeOfDay = this.dayNightCycle.getTimeOfDay();
        this.timeElement.textContent = timeOfDay;
        
        // Change UI colors based on time of day
        if (timeOfDay === 'Night') {
            document.getElementById('score-container').style.backgroundColor = 'rgba(0, 0, 50, 0.7)';
            document.getElementById('time-container').style.backgroundColor = 'rgba(0, 0, 50, 0.7)';
        } else {
            document.getElementById('score-container').style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            document.getElementById('time-container').style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }
    }
    
    checkGameOver() {
        // Check if player has fallen below the city
        if (this.player.getPosition().y < -20) {
            this.gameOver();
        }
    }
    
    gameOver() {
        // Set game over state
        this.isGameOver = true;
        
        // Show game over screen
        this.gameOverScreen.classList.remove('hidden');
        this.finalScoreElement.textContent = Utils.formatScore(this.score);
        
        // Check for high score
        if (Utils.saveHighScore(this.score)) {
            // Show high score message
            const highScoreMessage = document.createElement('p');
            highScoreMessage.textContent = 'New High Score!';
            highScoreMessage.style.color = '#FFD700';
            highScoreMessage.style.fontSize = '1.5em';
            
            const gameOverContent = document.querySelector('.game-over-content');
            gameOverContent.insertBefore(highScoreMessage, this.restartButton);
        }
    }
    
    restart() {
        // Hide game over screen
        this.gameOverScreen.classList.add('hidden');
        
        // Reset player
        this.player.reset();
        
        // Reset obstacles
        this.obstacles.reset();
        
        // Reset day/night cycle
        this.dayNightCycle.reset();
        
        // Reset game state
        this.isGameOver = false;
        this.score = 0;
        this.gameTime = 0;
        this.lastFrameTime = performance.now();
        
        // Update score display
        this.updateScoreDisplay();
        
        // Start game loop again
        this.gameLoop();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        // Show/hide pause indicator
        if (this.isPaused) {
            // Create pause screen if it doesn't exist
            if (!this.pauseScreen) {
                this.pauseScreen = document.createElement('div');
                this.pauseScreen.id = 'pause-screen';
                this.pauseScreen.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 10px;
                    font-size: 2em;
                    z-index: 20;
                `;
                this.pauseScreen.textContent = 'PAUSED';
                document.getElementById('game-container').appendChild(this.pauseScreen);
            } else {
                this.pauseScreen.style.display = 'block';
            }
        } else if (this.pauseScreen) {
            this.pauseScreen.style.display = 'none';
        }
    }
    
    showLoadingScreen(progress) {
        // Update progress bar
        this.progressBar.style.width = `${progress * 100}%`;
        
        // Update loading text based on progress
        if (progress < 0.1) {
            this.loadingText.textContent = 'Loading physics engine...';
        } else if (progress < 0.3) {
            this.loadingText.textContent = 'Initializing physics...';
        } else if (progress < 0.6) {
            this.loadingText.textContent = 'Building city...';
        } else if (progress < 0.9) {
            this.loadingText.textContent = 'Placing obstacles...';
        } else {
            this.loadingText.textContent = 'Ready!';
        }
        
        // When fully loaded
        if (progress >= 1) {
            this.loadingScreen.style.opacity = 0;
            
            // Wait for fade out animation to complete
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                this.loadingScreen.style.opacity = 1;
            }, 500);
        }
    }
    
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    dispose() {
        // Clean up resources
        window.removeEventListener('resize', this.onWindowResize);
        
        // Dispose of Three.js resources
        this.renderer.dispose();
        
        // Clean up physics
        this.physics.cleanup();
    }
}

// Initialize game when page is loaded
window.addEventListener('load', () => {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not found. Make sure you include it before main.js');
        document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Three.js not loaded. Please check your script includes.</div>';
        return;
    }
    
    const game = new Game();
});
