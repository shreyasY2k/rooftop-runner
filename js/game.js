class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').prepend(this.renderer.domElement);
        
        this.clock = new THREE.Clock();
        this.gameTime = 0;
        this.isGameRunning = false;
        this.score = 0;
        
        // Initialize systems in correct order to ensure proper player placement
        this.environment = new Environment(this.scene);
        
        // Find a suitable starting building
        const startingBuilding = this.findStartingBuilding();
        
        this.player = new Player(this.scene, this.camera);
        
        // Position player on the starting building
        if (startingBuilding) {
            const buildingTop = startingBuilding.position.y + startingBuilding.geometry.parameters.height / 2;
            this.player.mesh.position.set(
                startingBuilding.position.x,
                buildingTop + 1, // 1 unit above the building top
                startingBuilding.position.z
            );
        }
        
        this.dayNightCycle = new DayNightCycle(this.scene, this.environment);
        this.obstacleManager = new ObstacleManager(this.scene, this.environment);
        
        // Combine all obstacles
        this.obstacles = [...this.environment.obstacles, ...this.obstacleManager.obstacles];
        
        // Initialize minimap after all other systems
        this.minimap = new Minimap(this);
        
        // UI elements
        this.setupEventListeners();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Start animation loop
        this.animate();
    }
    
    setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startGame() {
        document.getElementById('menu').classList.add('hidden');
        this.isGameRunning = true;
        this.clock.start();
    }
    
    gameOver() {
        this.isGameRunning = false;
        document.getElementById('final-score').textContent = Math.floor(this.score);
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    restartGame() {
        // Find starting building for reset
        const startingBuilding = this.findStartingBuilding();
        
        // Reset player
        if (startingBuilding) {
            const buildingTop = startingBuilding.position.y + startingBuilding.geometry.parameters.height / 2;
            this.player.mesh.position.set(
                startingBuilding.position.x,
                buildingTop + 1,
                startingBuilding.position.z
            );
        } else {
            this.player.mesh.position.set(0, 20, 0); // Fallback position
        }
        
        this.player.velocity = new THREE.Vector3(0, 0, 0);
        this.player.health = 100;
        this.player.score = 0;
        
        // Reset time
        this.gameTime = 0;
        
        // Reset UI
        document.getElementById('game-over').classList.add('hidden');
        
        // Start game
        this.isGameRunning = true;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updateGame(deltaTime) {
        if (!this.isGameRunning) return;
        
        // Update game time
        this.gameTime += deltaTime;
        document.getElementById('time').textContent = `Time: ${formatTime(this.gameTime)}`;
        
        // Update day/night cycle
        const timeOfDay = this.dayNightCycle.update(deltaTime);
        
        // Update player - returns false if player died
        const playerAlive = this.player.update(deltaTime, this.obstacles, this.environment.buildings);
        
        if (!playerAlive) {
            this.gameOver();
            return;
        }
        
        // Update score
        this.score = this.player.score;
        
        // Update obstacles
        this.obstacleManager.update(deltaTime, timeOfDay);
        
        // Check obstacle collisions
        this.obstacleManager.checkCollisions(this.player);
        
        // Adjust difficulty based on time
        if (this.gameTime > 30 && Math.random() > 0.99) {
            // Add new obstacles occasionally
            this.addRandomObstacle();
        }
        
        // Safety check - if player falls far below the world, reset them to a building
        if (this.player.mesh.position.y < -50) {
            const startingBuilding = this.findStartingBuilding();
            if (startingBuilding) {
                const buildingTop = startingBuilding.position.y + startingBuilding.geometry.parameters.height / 2;
                this.player.mesh.position.set(
                    startingBuilding.position.x,
                    buildingTop + 1,
                    startingBuilding.position.z
                );
                this.player.velocity.set(0, 0, 0);
            }
        }
        
        // Update minimap at the end after all other updates
        if (this.minimap) {
            this.minimap.update();
        }
    }
    
    addRandomObstacle() {
        // Add a random obstacle near the player
        const obstacleTypes = ['jumpPad', 'hazard', 'collectible'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        // Find a building near the player
        const nearbyBuildings = this.environment.buildings.filter(building => {
            const distance = Math.sqrt(
                Math.pow(building.position.x - this.player.mesh.position.x, 2) +
                Math.pow(building.position.z - this.player.mesh.position.z, 2)
            );
            return distance < 50 && distance > 20;
        });
        
        if (nearbyBuildings.length > 0) {
            const building = nearbyBuildings[Math.floor(Math.random() * nearbyBuildings.length)];
            
            if (type === 'jumpPad') {
                const jumpPadGeometry = new THREE.CylinderGeometry(1, 1.2, 0.3, 16);
                const jumpPadMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
                const jumpPad = new THREE.Mesh(jumpPadGeometry, jumpPadMaterial);
                
                jumpPad.position.set(
                    building.position.x,
                    building.position.y + building.geometry.parameters.height/2 + 0.15,
                    building.position.z
                );
                
                jumpPad.userData = { type: 'jumpPad', boostFactor: 2.5 };
                
                this.scene.add(jumpPad);
                this.obstacles.push(jumpPad);
                this.obstacleManager.obstacles.push(jumpPad);
            } else if (type === 'hazard') {
                // Spikes
                const hazardGroup = new THREE.Group();
                
                for (let i = 0; i < 5; i++) {
                    const spikeGeometry = new THREE.ConeGeometry(0.2, 1, 8);
                    const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
                    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                    
                    spike.position.set(
                        randomRange(-1, 1),
                        0.5,
                        randomRange(-1, 1)
                    );
                    
                    hazardGroup.add(spike);
                }
                
                hazardGroup.position.set(
                    building.position.x,
                    building.position.y + building.geometry.parameters.height/2,
                    building.position.z
                );
                
                hazardGroup.userData = { type: 'hazard', damage: 25 };
                
                this.scene.add(hazardGroup);
                this.obstacles.push(hazardGroup);
                this.obstacleManager.obstacles.push(hazardGroup);
            } else if (type === 'collectible') {
                const collectibleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
                const collectibleMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
                const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
                
                collectible.position.set(
                    building.position.x,
                    building.position.y + building.geometry.parameters.height/2 + 1.5,
                    building.position.z
                );
                
                collectible.userData = { type: 'collectible', value: 50 };
                
                this.scene.add(collectible);
                this.obstacleManager.collectibles.push(collectible);
            }
        }
    }
    
    findStartingBuilding() {
        // Look for the central skyscraper or a suitable tall building
        for (const building of this.environment.buildings) {
            // Find the tallest building near the center (the skyscraper we created at 0,0)
            if (Math.abs(building.position.x) < 10 && Math.abs(building.position.z) < 10) {
                return building;
            }
        }
        
        // If no central building is found, find any tall building
        if (this.environment.buildings.length > 0) {
            // Sort buildings by height
            const sortedBuildings = [...this.environment.buildings].sort((a, b) => 
                (b.position.y + b.geometry.parameters.height) - 
                (a.position.y + a.geometry.parameters.height)
            );
            
            return sortedBuildings[0]; // Return the tallest building
        }
        
        return null;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.updateGame(deltaTime);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game
window.addEventListener('load', () => {
    new Game();
});
