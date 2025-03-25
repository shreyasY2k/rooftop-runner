class ObstacleManager {
    constructor(scene, environment) {
        this.scene = scene;
        this.environment = environment;
        this.obstacles = [];
        this.collectibles = [];
        
        this.createSpecialObstacles();
    }
    
    createSpecialObstacles() {
        // Add special obstacles and challenges based on buildings
        this.createJumpPads();
        this.createCollectibles();
        this.createHazards();
    }
    
    createJumpPads() {
        // Add jump pads to some buildings
        for (const building of this.environment.buildings) {
            if (Math.random() > 0.9) {
                const jumpPadGeometry = new THREE.CylinderGeometry(1, 1.2, 0.3, 16);
                const jumpPadMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
                const jumpPad = new THREE.Mesh(jumpPadGeometry, jumpPadMaterial);
                
                jumpPad.position.set(
                    building.position.x + randomRange(-building.geometry.parameters.width/4, building.geometry.parameters.width/4),
                    building.position.y + building.geometry.parameters.height/2 + 0.15,
                    building.position.z + randomRange(-building.geometry.parameters.depth/4, building.geometry.parameters.depth/4)
                );
                
                jumpPad.userData = { type: 'jumpPad', boostFactor: 2.5 };
                
                this.scene.add(jumpPad);
                this.obstacles.push(jumpPad);
            }
        }
    }
    
    createCollectibles() {
        // Add collectible coins/items
        for (const building of this.environment.buildings) {
            if (Math.random() > 0.7) {
                const collectibleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
                const collectibleMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
                const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
                
                collectible.position.set(
                    building.position.x + randomRange(-building.geometry.parameters.width/4, building.geometry.parameters.width/4),
                    building.position.y + building.geometry.parameters.height/2 + 1.5,
                    building.position.z + randomRange(-building.geometry.parameters.depth/4, building.geometry.parameters.depth/4)
                );
                
                collectible.userData = { type: 'collectible', value: 50 };
                
                this.scene.add(collectible);
                this.collectibles.push(collectible);
            }
        }
    }
    
    createHazards() {
        // Add hazards on some buildings
        for (const building of this.environment.buildings) {
            if (Math.random() > 0.8) {
                // Spikes
                const spikeCount = Math.floor(randomRange(3, 7));
                const hazardGroup = new THREE.Group();
                
                for (let i = 0; i < spikeCount; i++) {
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
                    building.position.x + randomRange(-building.geometry.parameters.width/4, building.geometry.parameters.width/4),
                    building.position.y + building.geometry.parameters.height/2,
                    building.position.z + randomRange(-building.geometry.parameters.depth/4, building.geometry.parameters.depth/4)
                );
                
                hazardGroup.userData = { type: 'hazard', damage: 25 };
                
                this.scene.add(hazardGroup);
                this.obstacles.push(hazardGroup);
            }
        }
    }
    
    update(deltaTime, timeOfDay) {
        // Make collectibles rotate and bob up and down
        for (const collectible of this.collectibles) {
            collectible.rotation.y += deltaTime * 2;
            collectible.position.y += Math.sin(Date.now() * 0.003) * 0.01;
        }
        
        // Make jump pads pulse at night
        if (timeOfDay > 0.75 || timeOfDay < 0.25) {
            for (const obstacle of this.obstacles) {
                if (obstacle.userData && obstacle.userData.type === 'jumpPad') {
                    const pulseIntensity = (Math.sin(Date.now() * 0.005) + 1) / 2;
                    obstacle.material.emissive = new THREE.Color(0x00FF00);
                    obstacle.material.emissiveIntensity = pulseIntensity;
                }
            }
        }
    }
    
    checkCollisions(player) {
        // Check player collision with obstacles
        for (const obstacle of this.obstacles) {
            if (!obstacle.visible) continue;
            
            const playerBox = new THREE.Box3().setFromObject(player.mesh);
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                if (obstacle.userData.type === 'jumpPad') {
                    player.velocity.y = player.jumpForce * obstacle.userData.boostFactor;
                    player.isJumping = true;
                } else if (obstacle.userData.type === 'hazard') {
                    player.health -= obstacle.userData.damage;
                    obstacle.visible = false;
                    setTimeout(() => {
                        obstacle.visible = true;
                    }, 3000);
                }
            }
        }
        
        // Check collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            if (!collectible.visible) continue;
            
            const playerBox = new THREE.Box3().setFromObject(player.mesh);
            const collectibleBox = new THREE.Box3().setFromObject(collectible);
            
            if (playerBox.intersectsBox(collectibleBox)) {
                player.score += collectible.userData.value;
                this.scene.remove(collectible);
                this.collectibles.splice(i, 1);
            }
        }
    }
}
