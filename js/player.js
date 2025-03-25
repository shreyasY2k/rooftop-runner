class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.speed = 0.15;
        this.jumpForce = 0.5;
        this.gravity = 0.01;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isJumping = false;
        this.canJump = true;
        this.isSprinting = false;
        this.score = 0;
        this.health = 100;
        
        // Player states
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false,
            shift: false
        };
        
        // Initialize player on a building rather than in the air
        this.startingHeight = 20; // Height of starting building + some offset
        
        // Player collider
        this.createPlayerCollider();
        
        // Setup controls
        this.setupKeyControls();
    }
    
    createPlayerCollider() {
        // Player model - simple box for now
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000, transparent: true, opacity: 0.7 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, this.startingHeight, 0); // Start position above the central building
        
        // Add collider
        this.collider = new THREE.Box3().setFromObject(this.mesh);
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Adjust camera
        this.camera.position.set(0, this.startingHeight + 2, 5);
        this.camera.lookAt(this.mesh.position);
    }
    
    setupKeyControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyW': this.keys.forward = true; break;
                case 'KeyS': this.keys.backward = true; break;
                case 'KeyA': this.keys.left = true; break;
                case 'KeyD': this.keys.right = true; break;
                case 'Space': 
                    this.keys.space = true; 
                    this.jump();
                    break;
                case 'ShiftLeft': 
                    this.keys.shift = true; 
                    this.isSprinting = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': this.keys.forward = false; break;
                case 'KeyS': this.keys.backward = false; break;
                case 'KeyA': this.keys.left = false; break;
                case 'KeyD': this.keys.right = false; break;
                case 'Space': this.keys.space = false; break;
                case 'ShiftLeft': 
                    this.keys.shift = false;
                    this.isSprinting = false;
                    break;
            }
        });
    }
    
    jump() {
        if (this.canJump) {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
            this.canJump = false;
        }
    }
    
    update(deltaTime, obstacles, buildings) {
        // Movement
        const actualSpeed = this.isSprinting ? this.speed * 1.8 : this.speed;
        
        if (this.keys.forward) {
            this.velocity.z = -actualSpeed;
        } else if (this.keys.backward) {
            this.velocity.z = actualSpeed;
        } else {
            this.velocity.z = 0;
        }
        
        if (this.keys.right) {
            this.velocity.x = actualSpeed;
        } else if (this.keys.left) {
            this.velocity.x = -actualSpeed;
        } else {
            this.velocity.x = 0;
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity;
        
        // Update position
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.y += this.velocity.y;
        this.mesh.position.z += this.velocity.z;
        
        // Check for ground collision (buildings)
        let isOnGround = false;
        for (const building of buildings) {
            // Get building dimensions
            const buildingWidth = building.geometry.parameters.width;
            const buildingHeight = building.geometry.parameters.height;
            const buildingDepth = building.geometry.parameters.depth;
            
            // Calculate building top
            const buildingTop = building.position.y + buildingHeight / 2;
            const playerBottom = this.mesh.position.y - 1;
            
            // Check if player is above and within the XZ bounds of the building
            if (Math.abs(playerBottom - buildingTop) < 0.2 && // Slightly increased tolerance
                Math.abs(this.mesh.position.x - building.position.x) < buildingWidth / 2 &&
                Math.abs(this.mesh.position.z - building.position.z) < buildingDepth / 2) {
                
                isOnGround = true;
                this.mesh.position.y = buildingTop + 1; // Place player exactly on top
                this.velocity.y = 0;
                this.canJump = true;
                this.isJumping = false;
                break;
            }
        }
        
        // Check for obstacle collisions
        for (const obstacle of obstacles) {
            this.collider.setFromObject(this.mesh);
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            
            if (this.collider.intersectsBox(obstacleBox)) {
                // Handle different obstacle types
                if (obstacle.userData.type === 'collectible') {
                    this.score += 10;
                    obstacle.visible = false;
                    // Remove from obstacles array
                    const index = obstacles.indexOf(obstacle);
                    if (index > -1) {
                        obstacles.splice(index, 1);
                    }
                } else if (obstacle.userData.type === 'hazard') {
                    this.health -= 10;
                }
            }
        }
        
        // Update camera to follow player
        this.camera.position.x = this.mesh.position.x;
        this.camera.position.z = this.mesh.position.z + 5;
        this.camera.position.y = this.mesh.position.y + 2;
        this.camera.lookAt(this.mesh.position);
        
        // Check for falling off - increase the death threshold to prevent false positives
        if (this.mesh.position.y < -20) {
            this.health = 0;
        }
        
        // Update score based on distance traveled
        this.score += Math.abs(this.velocity.x) + Math.abs(this.velocity.z);
        
        // Update UI
        document.getElementById('score').textContent = `Score: ${Math.floor(this.score)}`;
        
        return this.health > 0;
    }
}
