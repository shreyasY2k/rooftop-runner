// Main Game Initialization and Loop

// Game state variables
let game = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    physics: null,
    player: null,
    world: null,
    dayNightCycle: null,
    running: false,
    score: 0,
    startTime: 0,
    username: '',
    playerColor: 'blue',
    playerSpeed: 5,
    referrer: '',
    portalMode: false
};

// Initialize the game
function initGame() {
    console.log("Initializing game...");
    
    try {
        // Check URL parameters
        checkURLParameters();
        
        console.log("Creating renderer...");
        // Create renderer
        game.renderer = new THREE.WebGLRenderer({ antialias: true });
        game.renderer.setSize(window.innerWidth, window.innerHeight);
        game.renderer.shadowMap.enabled = true;
        document.body.appendChild(game.renderer.domElement);
        
        console.log("Creating scene...");
        // Create scene
        game.scene = new THREE.Scene();
        game.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        console.log("Creating camera...");
        // Create camera
        game.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        game.camera.position.set(0, 5, 10);
        
        console.log("Creating clock...");
        // Create clock for animations
        game.clock = new THREE.Clock();
        
        console.log("Initializing physics...");
        // Initialize physics
        if (typeof Physics !== 'function') {
            throw new Error("Physics class is not defined. Make sure physics.js is loaded correctly.");
        }
        game.physics = new Physics();
        
        console.log("Initializing world...");
        // Initialize world with buildings and environment
        if (typeof World !== 'function') {
            throw new Error("World class is not defined. Make sure world.js is loaded correctly.");
        }
        game.world = new World(game.scene, game.physics);
        
        console.log("Initializing day/night cycle...");
        // Initialize day/night cycle
        if (typeof DayNightCycle !== 'function') {
            throw new Error("DayNightCycle class is not defined. Make sure daynight.js is loaded correctly.");
        }
        game.dayNightCycle = new DayNightCycle(game.scene, game.renderer);
        
        console.log("Initializing player...");
        // Initialize player
        if (typeof Player !== 'function') {
            throw new Error("Player class is not defined. Make sure player.js is loaded correctly.");
        }
        game.player = new Player(game.scene, game.physics, game.camera);
        
        // Set player position based on portal entry if applicable
        if (game.portalMode) {
            game.player.setPortalEntryPosition();
        }
        
        console.log("Initializing portal...");
        // Initialize portal
        if (typeof initPortal !== 'function') {
            throw new Error("initPortal function is not defined. Make sure portal.js is loaded correctly.");
        }
        initPortal(game.scene, game.world);
        
        // Setup event listeners
        window.addEventListener('resize', onWindowResize);
        
        // Start the game loop
        game.running = true;
        game.startTime = Date.now();
        animate();
        
        console.log("Showing UI...");
        // Show game UI
        document.getElementById('game-ui').style.display = 'block';
        document.getElementById('controls-info').style.display = 'block';
        
        // Initialize UI if the function exists
        if (typeof window.initUI === 'function') {
            window.initUI();
        } else {
            console.warn("initUI function not available");
        }
        
        console.log("Game initialization complete!");
    } catch (error) {
        console.error("Error initializing game:", error.message);
        console.error("Stack trace:", error.stack);
        alert("There was an error starting the game: " + error.message);
    }
}

// Check for URL parameters (from portal)
function checkURLParameters() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check if coming from portal
        if (urlParams.has('portal') && urlParams.get('portal') === 'true') {
            console.log("Portal entry detected");
            game.portalMode = true;
            
            // Get player data from URL
            if (urlParams.has('username')) {
                game.username = urlParams.get('username');
            }
            
            if (urlParams.has('color')) {
                game.playerColor = urlParams.get('color');
            }
            
            if (urlParams.has('speed')) {
                game.playerSpeed = parseFloat(urlParams.get('speed'));
            }
            
            if (urlParams.has('ref')) {
                game.referrer = urlParams.get('ref');
            }
            
            // Skip start screen if from portal
            document.getElementById('start-screen').style.display = 'none';
            initGame();
        }
    } catch (error) {
        console.error("Error checking URL parameters:", error);
    }
}

// Handle window resize
function onWindowResize() {
    if (!game.camera || !game.renderer) return;
    
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main game loop
function animate() {
    if (!game.running) return;
    
    requestAnimationFrame(animate);
    
    try {
        const delta = game.clock.getDelta();
        
        // Update physics
        game.physics.update(delta);
        
        // Update player
        game.player.update(delta);
        
        // Update day/night cycle
        game.dayNightCycle.update(delta);
        
        // Update portal
        updatePortal(delta, game.player);
        
        // Update UI - make sure we check if the function exists
        if (typeof window.updateUI === 'function') {
            window.updateUI();
        } else {
            console.warn("updateUI function not available");
        }
        
        // Check for game over condition
        if (game.player.position.y < -20) {
            gameOver();
        }
        
        // Render scene
        game.renderer.render(game.scene, game.camera);
    } catch (error) {
        console.error("Error in animation loop:", error);
        game.running = false;
    }
}

// Game over function
function gameOver() {
    game.running = false;
    
    // Create game over screen
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>GAME OVER</h2>
        <p>You fell from the rooftops!</p>
        <p>Score: ${game.score}</p>
        <button id="restart-button">TRY AGAIN</button>
    `;
    document.body.appendChild(gameOverDiv);
    
    // Add event listener to restart button
    document.getElementById('restart-button').addEventListener('click', () => {
        location.reload();
    });
}

// Start the game when the button is clicked
window.addEventListener('load', function() {
    console.log("Page loaded, setting up event listeners");
    
    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.error("THREE.js not loaded!");
        alert("THREE.js library failed to load. Please refresh the page or check your internet connection.");
        return;
    }
    
    // Check URL parameters first for portal entry
    checkURLParameters();
    
    // Set up start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', function() {
            console.log("Start button clicked");
            
            // Get username if provided
            const usernameInput = document.getElementById('username-input');
            if (usernameInput && usernameInput.value.trim() !== '') {
                game.username = usernameInput.value.trim();
            }
            
            // Hide start screen
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.style.display = 'none';
            }
            
            // Initialize game
            initGame();
        });
    } else {
        console.error("Start button not found in the DOM!");
    }
});