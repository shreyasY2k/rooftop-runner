// Player character and controls

class Player {
    constructor(scene, physics, camera) {
        // Reference to scene, physics, and camera
        this.scene = scene;
        this.physics = physics;
        this.camera = camera;
        
        // Player state
        this.position = new THREE.Vector3(0, 10, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 0);
        this.jumping = false;
        this.onGround = false;
        this.sprinting = false;
        
        // Movement settings
        this.walkSpeed = game.playerSpeed || 5.0;
        this.sprintSpeed = 8.0;
        this.jumpForce = 7.0;
        this.gravity = 20.0;
        
        // Camera settings
        this.cameraHeight = 1.7;
        this.cameraDistance = 5;
        this.lookSensitivity = 0.002;
        this.lookVerticalLimit = Math.PI / 3; // 60 degrees
        
        // Look angles
        this.yaw = -Math.PI / 2; // Face forward (-Z)
        this.pitch = 0;
        
        // Create player mesh
        this.createPlayerMesh();
        
        // Create player physics body
        this.createPlayerBody();
        
        // Setup controls
        this.setupControls();
        
        // Camera target offset
        this.cameraTargetOffset = new THREE.Vector3(0, 1.7, 0);
        
        // Enable pointer lock for first-person controls
        document.addEventListener('click', () => {
            if (game.running && !this.pointerLocked) {
                document.body.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement !== null;
        });
    }
    
    createPlayerMesh() {
        // Use a cylinder for the player's body
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
        
        // Use player color from game data (default to blue)
        const playerColor = game.playerColor ? game.playerColor : 'blue';
        const material = new THREE.MeshPhongMaterial({ color: playerColor });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
        
        // Create a head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.0; // Place on top of body
        this.mesh.add(this.head);
        
        // Create arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const armMaterial = new THREE.MeshPhongMaterial({ color: playerColor });
        
        // Left arm
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.5, 0.3, 0);
        this.mesh.add(this.leftArm);
        
        // Right arm
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.5, 0.3, 0);
        this.mesh.add(this.rightArm);
        
        this.scene.add(this.mesh);
    }
    
    createPlayerBody() {
        // Create a capsule shape for the player (approximated with a cylinder)
        this.body = this.physics.createCylinder(
            0.4, // radius
            1.8, // height
            8,   // segments
            this.position,
            undefined,
            70,  // mass
            this.physics.playerMaterial
        );
        
        // Set damping to limit acceleration
        this.body.linearDamping = 0.4;
        this.body.angularDamping = 0.99;
        
        // Prevent the player from rotating
        this.body.fixedRotation = true;
        this.body.updateMassProperties();
        
        // Add player to physics tracking
        this.physics.addBodyAndMesh(this.body, this.mesh);
    }
    
    setupControls() {
        // Keyboard state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false
        };
        
        // Add event listeners for keyboard
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Add event listener for mouse movement
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
    }
    
    onKeyDown(event) {
        if (!game.running) return;
        
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                this.jump();
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = true;
                break;
            case 'KeyE':
                this.interact();
                break;
        }
    }
    
    onKeyUp(event) {
        if (!game.running) return;
        
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = false;
                break;
        }
    }
    
    onMouseMove(event) {
        if (!game.running || !this.pointerLocked) return;
        
        // Update yaw (horizontal rotation)
        this.yaw -= event.movementX * this.lookSensitivity;
        
        // Update pitch (vertical rotation) with limits
        this.pitch -= event.movementY * this.lookSensitivity;
        this.pitch = Math.max(-this.lookVerticalLimit, Math.min(this.lookVerticalLimit, this.pitch));
    }
    
    jump() {
        if (this.onGround) {
            this.body.velocity.y = this.jumpForce;
            this.jumping = true;
            this.onGround = false;
            
            // Play jump sound
            // (to be implemented)
        }
    }
    
    interact() {
        // Check if near the portal
        if (isNearPortal(this.mesh.position)) {
            enterPortal();
        }
    }
    
    update(delta) {
        // Update velocity based on input
        this.updateMovement(delta);
        
        // Check if on ground
        this.checkGroundContact();
        
        // Update camera position
        this.updateCamera();
        
        // Update player mesh animation
        this.updateAnimation(delta);
        
        // Update position from physics body
        this.position.copy(this.body.position);
    }
    
    updateMovement(delta) {
        // Reset direction
        this.direction.set(0, 0, 0);
        
        // Calculate forward vector
        const forward = new THREE.Vector3(
            Math.sin(this.yaw),
            0,
            Math.cos(this.yaw)
        );
        
        // Calculate right vector
        const right = new THREE.Vector3(
            Math.sin(this.yaw + Math.PI/2),
            0,
            Math.cos(this.yaw + Math.PI/2)
        );
        
        // Set direction based on input
        if (this.keys.forward) this.direction.add(forward);
        if (this.keys.backward) this.direction.sub(forward);
        if (this.keys.right) this.direction.add(right);
        if (this.keys.left) this.direction.sub(right);
        
        // Normalize direction if moving
        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
            
            // Check if sprinting
            this.sprinting = this.keys.sprint;
            
            // Calculate movement speed
            const speed = this.sprinting ? this.sprintSpeed : this.walkSpeed;
            
            // Apply movement to body velocity
            this.body.velocity.x = this.direction.x * speed;
            this.body.velocity.z = this.direction.z * speed;
        }
        
        // Apply gravity if jumping
        if (!this.onGround) {
            this.body.velocity.y -= this.gravity * delta;
        }
    }
    
    checkGroundContact() {
        // Cast a ray downward to check for ground
        const start = new THREE.Vector3().copy(this.position);
        start.y += 0.1; // Slight offset to avoid self-intersection
        
        const end = new THREE.Vector3().copy(start);
        end.y -= 1.0; // Cast down 1 unit
        
        const result = this.physics.raycast(start, end);
        
        // Check if we hit something
        if (result.hasHit) {
            // If we're close to the ground
            if (result.distance < 1.0) {
                if (!this.onGround && this.jumping) {
                    // Just landed
                    this.onGround = true;
                    this.jumping = false;
                    
                    // Play landing sound
                    // (to be implemented)
                } else {
                    this.onGround = true;
                }
            } else {
                this.onGround = false;
            }
        } else {
            this.onGround = false;
        }
    }
    
    updateCamera() {
        // Calculate camera position based on player position and orientation
        const cameraOffset = new THREE.Vector3(
            -Math.sin(this.yaw) * this.cameraDistance * Math.cos(this.pitch),
            this.cameraDistance * Math.sin(this.pitch),
            -Math.cos(this.yaw) * this.cameraDistance * Math.cos(this.pitch)
        );
        
        // Target position is player position plus height offset
        const targetPos = new THREE.Vector3().copy(this.position).add(this.cameraTargetOffset);
        
        // Set camera position
        this.camera.position.copy(targetPos).add(cameraOffset);
        
        // Make camera look at player
        this.camera.lookAt(targetPos);
    }
    
    updateAnimation(delta) {
        // Animate arms based on movement
        if (this.direction.lengthSq() > 0) {
            // Arm swing animation
            const swingSpeed = this.sprinting ? 12 : 8;
            const swingAmount = 0.3;
            
            this.leftArm.rotation.x = Math.sin(Date.now() * 0.01 * swingSpeed) * swingAmount;
            this.rightArm.rotation.x = -Math.sin(Date.now() * 0.01 * swingSpeed) * swingAmount;
        } else {
            // Reset arm positions
            this.leftArm.rotation.x = this.rightArm.rotation.x = 0;
        }
        
        // Bounce animation while moving
        if (this.direction.lengthSq() > 0 && this.onGround) {
            const bounceSpeed = this.sprinting ? 12 : 8;
            const bounceAmount = 0.05;
            
            this.mesh.position.y = this.body.position.y + Math.abs(Math.sin(Date.now() * 0.01 * bounceSpeed)) * bounceAmount;
        } else {
            this.mesh.position.y = this.body.position.y;
        }
    }
    
    // Set player position when entering from a portal
    setPortalEntryPosition() {
        // Position the player near the portal entry point
        const portalEntryPosition = new THREE.Vector3(20, 10, 20); // This will be updated with actual portal position
        
        this.position.copy(portalEntryPosition);
        this.body.position.copy(portalEntryPosition);
        
        // Also update the mesh position
        this.mesh.position.copy(portalEntryPosition);
    }

    // Reset player state
    reset() {
        // Reset player position
        this.position.set(0, 10, 0);
        this.body.position.copy(this.position);
        
        // Reset player velocity
        this.velocity.set(0, 0, 0);
        this.body.velocity.set(0, 0, 0);
        
        // Reset player rotation
        this.yaw = -Math.PI / 2;
        this.pitch = 0;
        
        // Reset player state
        this.jumping = false;
        this.onGround = false;
        this.sprinting = false;
        
        // Reset camera
        this.updateCamera();
    }

    // Remove player from scene and physics world
    remove() {
        this.scene.remove(this.mesh);
        this.physics.removeBody(this.body);
    }

    // Set player position
    setPosition(position) {
        this.position.copy(position);
        this.body.position.copy(position);
        this.mesh.position.copy(position);
    }
}