// World generation and environment

class World {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // World settings
        this.citySize = 5; // Number of blocks in each direction
        this.blockSize = { width: 40, depth: 40 };
        this.streetWidth = 15;
        
        // Store created buildings
        this.buildings = [];
        
        // Create the world
        this.createSkybox();
        this.createGround();
        this.createCity();
        this.createLandmarks();
        this.createObstacles();
        this.createJumpingPaths();
        this.createAtmosphericElements();
    }
    
    createSkybox() {
        // Create a simple skybox using a large box with faces pointing inward
        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skyboxMaterials = [
            new THREE.MeshBasicMaterial({ 
                map: this.createSkyTexture('#87CEEB', '#4169E1'), 
                side: THREE.BackSide 
            }),
            new THREE.MeshBasicMaterial({ 
                map: this.createSkyTexture('#87CEEB', '#4169E1'), 
                side: THREE.BackSide 
            }),
            new THREE.MeshBasicMaterial({ 
                map: this.createSkyTexture('#87CEEB', '#000030'), 
                side: THREE.BackSide 
            }),
            new THREE.MeshBasicMaterial({ 
                map: this.createSkyTexture('#87CEEB', '#4169E1'), 
                side: THREE.BackSide 
            }),
            new THREE.MeshBasicMaterial({ 
                map: this.createSkyTexture('#87CEEB', '#4169E1'), 
                side: THREE.BackSide 
            }),
            new THREE.MeshBasicMaterial({ 
                map: this.createSkyTexture('#87CEEB', '#4169E1'), 
                side: THREE.BackSide 
            })
        ];
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
        this.scene.add(skybox);
    }
    
    createSkyTexture(topColor, bottomColor) {
        // Create a canvas for the sky gradient
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, bottomColor);
        gradient.addColorStop(1, topColor);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        // Add some clouds to the sky
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 512;
            const y = 50 + Math.random() * 200;
            const width = 30 + Math.random() * 70;
            const height = 15 + Math.random() * 15;
            
            context.beginPath();
            context.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
            context.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createGround() {
        // Create a simple ground plane far below the buildings
        // This will catch players who fall from the rooftops
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1B5E20,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.y = -20;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        
        // Create ground physics body
        this.physics.createBox(
            1000, 1, 1000,
            { x: 0, y: -20.5, z: 0 },
            { x: -Math.PI / 2, y: 0, z: 0 },
            0 // Static body
        );
    }
    
    createCity() {
        // Calculate city dimensions
        const totalWidth = this.citySize * (this.blockSize.width + this.streetWidth);
        const totalDepth = this.citySize * (this.blockSize.depth + this.streetWidth);
        
        // Generate city blocks
        for (let x = 0; x < this.citySize; x++) {
            for (let z = 0; z < this.citySize; z++) {
                // Calculate block position
                const xPos = (x - this.citySize / 2 + 0.5) * (this.blockSize.width + this.streetWidth);
                const zPos = (z - this.citySize / 2 + 0.5) * (this.blockSize.depth + this.streetWidth);
                
                // Calculate number of buildings in this block (randomly)
                const numBuildings = 3 + Math.floor(Math.random() * 3);
                
                // Create a block of buildings
                const blockBuildings = createCityBlock(
                    this.scene,
                    this.physics,
                    { x: xPos, y: 0, z: zPos },
                    this.blockSize,
                    numBuildings
                );
                
                // Add buildings to the list
                this.buildings.push(...blockBuildings);
            }
        }
    }
    
    createLandmarks() {
        // Add a few notable landmarks to the city
        
        // 1. Central Tower (tallest building in center)
        const centerX = 0;
        const centerZ = 0;
        
        const towerHeight = 50;
        const towerWidth = 15;
        const towerDepth = 15;
        
        const centralTower = new Building(
            this.scene,
            this.physics,
            { x: centerX, y: 0, z: centerZ },
            { width: towerWidth, depth: towerDepth },
            towerHeight,
            'glass'
        );
        
        this.buildings.push(centralTower);
        
        // 2. City Park (empty area with some trees and benches)
        this.createCityPark(
            { x: this.blockSize.width, y: 0, z: -this.blockSize.depth },
            { width: this.blockSize.width, depth: this.blockSize.depth }
        );
        
        // 3. Construction Site
        this.createConstructionSite(
            { x: -this.blockSize.width, y: 0, z: this.blockSize.depth },
            { width: this.blockSize.width * 0.8, depth: this.blockSize.depth * 0.8 }
        );
    }
    
    createCityPark(position, size) {
        // Create park ground
        const parkGroundGeometry = new THREE.PlaneGeometry(size.width, size.depth);
        const parkGroundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const parkGround = new THREE.Mesh(parkGroundGeometry, parkGroundMaterial);
        parkGround.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        parkGround.position.set(position.x, 0.1, position.z); // Slightly above street level
        parkGround.receiveShadow = true;
        
        this.scene.add(parkGround);
        
        // Create trees
        const numTrees = 8 + Math.floor(Math.random() * 7);
        
        for (let i = 0; i < numTrees; i++) {
            // Random position within park
            const xPos = position.x + (Math.random() - 0.5) * size.width * 0.8;
            const zPos = position.z + (Math.random() - 0.5) * size.depth * 0.8;
            
            this.createTree(xPos, 0, zPos);
        }
        
        // Create benches
        const numBenches = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numBenches; i++) {
            // Random position near the edges
            const t = Math.random();
            let xPos, zPos;
            
            if (Math.random() < 0.5) {
                // Along width edges
                xPos = position.x + (t - 0.5) * size.width * 0.8;
                zPos = position.z + (Math.random() < 0.5 ? -1 : 1) * size.depth * 0.4;
            } else {
                // Along depth edges
                xPos = position.x + (Math.random() < 0.5 ? -1 : 1) * size.width * 0.4;
                zPos = position.z + (t - 0.5) * size.depth * 0.8;
            }
            
            this.createBench(xPos, 0, zPos);
        }
    }
    
    createTree(x, y, z) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, y + 1, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Tree foliage (multiple layers)
        const foliageColors = [0x2E7D32, 0x388E3C, 0x43A047];
        
        for (let i = 0; i < 3; i++) {
            const yOffset = 1.5 + i * 0.8;
            const radius = 1.5 - i * 0.3;
            
            const foliageGeometry = new THREE.ConeGeometry(radius, 1.5, 8);
            const foliageMaterial = new THREE.MeshStandardMaterial({ 
                color: foliageColors[i],
                roughness: 0.8
            });
            
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(x, y + yOffset, z);
            foliage.castShadow = true;
            this.scene.add(foliage);
        }
        
        // Simple physics body for the tree (just the trunk)
        this.physics.createCylinder(
            0.3, 2, 8,
            { x, y: y + 1, z },
            undefined,
            0 // Static body
        );
    }
    
    createBench(x, y, z) {
        // Bench seat
        const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
        const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(x, y + 0.5, z);
        seat.castShadow = true;
        seat.receiveShadow = true;
        this.scene.add(seat);
        
        // Bench legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(x - 0.8, y + 0.25, z);
        leftLeg.castShadow = true;
        this.scene.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(x + 0.8, y + 0.25, z);
        rightLeg.castShadow = true;
        this.scene.add(rightLeg);
        
        // Add physics body for the bench
        this.physics.createBox(
            2, 0.6, 0.6,
            { x, y: y + 0.3, z },
            undefined,
            0 // Static body
        );
    }
    
    createConstructionSite(position, size) {
        // Base ground
        const groundGeometry = new THREE.PlaneGeometry(size.width, size.depth);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xBDBDBD, // Concrete color
            roughness: 0.9,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.set(position.x, 0.1, position.z); // Slightly above street level
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        
        // Create scaffolding
        this.createScaffolding(
            { x: position.x, y: 0, z: position.z },
            { width: size.width * 0.7, depth: size.depth * 0.7, height: 15 }
        );
        
        // Create construction crane
        this.createCrane(
            { x: position.x - size.width * 0.25, y: 0, z: position.z - size.depth * 0.25 },
            25 // Height
        );
        
        // Add some construction materials
        for (let i = 0; i < 5; i++) {
            const xPos = position.x + (Math.random() - 0.5) * size.width * 0.6;
            const zPos = position.z + (Math.random() - 0.5) * size.depth * 0.6;
            
            if (Math.random() < 0.5) {
                this.createMaterialStack(xPos, 0, zPos);
            } else {
                this.createPipesStack(xPos, 0, zPos);
            }
        }
    }
    
    createScaffolding(position, size) {
        // Create main structure (vertical poles)
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, size.height, 6);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x607D8B });
        
        const cornerPositions = [
            { x: position.x - size.width/2, z: position.z - size.depth/2 },
            { x: position.x + size.width/2, z: position.z - size.depth/2 },
            { x: position.x - size.width/2, z: position.z + size.depth/2 },
            { x: position.x + size.width/2, z: position.z + size.depth/2 }
        ];
        
        // Create corner poles
        cornerPositions.forEach(corner => {
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(corner.x, position.y + size.height/2, corner.z);
            pole.castShadow = true;
            this.scene.add(pole);
            
            // Add physics body for pole
            this.physics.createCylinder(
                0.1, size.height, 6,
                { x: corner.x, y: position.y + size.height/2, z: corner.z },
                undefined,
                0 // Static body
            );
        });
        
        // Create horizontal connectors and platforms
        const numLevels = Math.floor(size.height / 3);
        
        for (let level = 1; level <= numLevels; level++) {
            const y = position.y + level * 3;
            
            // Create platform
            const platformGeometry = new THREE.BoxGeometry(size.width, 0.1, size.depth);
            const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(position.x, y, position.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            
            // Add physics body for platform
            this.physics.createBox(
                size.width, 0.1, size.depth,
                { x: position.x, y, z: position.z },
                undefined,
                0 // Static body
            );
            
            // Create railings
            this.createRailings(
                { x: position.x, y, z: position.z },
                { width: size.width, depth: size.depth }
            );
        }
    }
    
    createRailings(position, size) {
        const railHeight = 1;
        const railMaterial = new THREE.MeshStandardMaterial({ color: 0xFF9800 });
        
        // Top rail
        const topRailGeometry = new THREE.BoxGeometry(size.width, 0.05, 0.05);
        const topRail1 = new THREE.Mesh(topRailGeometry, railMaterial);
        topRail1.position.set(position.x, position.y + railHeight, position.z - size.depth/2);
        this.scene.add(topRail1);
        
        const topRail2 = new THREE.Mesh(topRailGeometry, railMaterial);
        topRail2.position.set(position.x, position.y + railHeight, position.z + size.depth/2);
        this.scene.add(topRail2);
        
        const topRail3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, size.depth), railMaterial);
        topRail3.position.set(position.x - size.width/2, position.y + railHeight, position.z);
        this.scene.add(topRail3);
        
        const topRail4 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, size.depth), railMaterial);
        topRail4.position.set(position.x + size.width/2, position.y + railHeight, position.z);
        this.scene.add(topRail4);
        
        // Vertical posts
        const numPosts = 4;
        const postGeometry = new THREE.CylinderGeometry(0.03, 0.03, railHeight, 4);
        
        for (let i = 0; i < numPosts; i++) {
            // Front
            const post1 = new THREE.Mesh(postGeometry, railMaterial);
            post1.position.set(
                position.x - size.width/2 + i * size.width/(numPosts-1),
                position.y + railHeight/2,
                position.z - size.depth/2
            );
            this.scene.add(post1);
            
            // Back
            const post2 = new THREE.Mesh(postGeometry, railMaterial);
            post2.position.set(
                position.x - size.width/2 + i * size.width/(numPosts-1),
                position.y + railHeight/2,
                position.z + size.depth/2
            );
            this.scene.add(post2);
            
            if (i > 0 && i < numPosts - 1) {
                // Left
                const post3 = new THREE.Mesh(postGeometry, railMaterial);
                post3.position.set(
                    position.x - size.width/2,
                    position.y + railHeight/2,
                    position.z - size.depth/2 + i * size.depth/(numPosts-1)
                );
                this.scene.add(post3);
                
                // Right
                const post4 = new THREE.Mesh(postGeometry, railMaterial);
                post4.position.set(
                    position.x + size.width/2,
                    position.y + railHeight/2,
                    position.z - size.depth/2 + i * size.depth/(numPosts-1)
                );
                this.scene.add(post4);
            }
        }
    }
    
    createCrane(position, height) {
        // Base
        const baseGeometry = new THREE.BoxGeometry(4, 1, 4);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x424242 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(position.x, position.y + 0.5, position.z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        
        // Tower
        const towerGeometry = new THREE.BoxGeometry(2, height, 2);
        const towerMaterial = new THREE.MeshStandardMaterial({ color: 0xF44336 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(position.x, position.y + height/2, position.z);
        tower.castShadow = true;
        this.scene.add(tower);
        
        // Control cabin
        const cabinGeometry = new THREE.BoxGeometry(2, 2, 2);
        const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x616161 });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(position.x, position.y + height - 1, position.z);
        cabin.castShadow = true;
        this.scene.add(cabin);
        
        // Jib (horizontal arm)
        const jibLength = 20;
        const jibGeometry = new THREE.BoxGeometry(jibLength, 0.5, 0.5);
        const jibMaterial = new THREE.MeshStandardMaterial({ color: 0xF44336 });
        const jib = new THREE.Mesh(jibGeometry, jibMaterial);
        jib.position.set(position.x + jibLength/2 - 1, position.y + height - 1, position.z);
        jib.castShadow = true;
        this.scene.add(jib);
        
        // Counter-jib
        const counterJibGeometry = new THREE.BoxGeometry(5, 0.5, 0.5);
        const counterJib = new THREE.Mesh(counterJibGeometry, jibMaterial);
        counterJib.position.set(position.x - 3, position.y + height - 1, position.z);
        counterJib.castShadow = true;
        this.scene.add(counterJib);
        
        // Counter-weight
        const weightGeometry = new THREE.BoxGeometry(1, 3, 3);
        const weightMaterial = new THREE.MeshStandardMaterial({ color: 0x212121 });
        const weight = new THREE.Mesh(weightGeometry, weightMaterial);
        weight.position.set(position.x - 5.5, position.y + height - 1, position.z);
        weight.castShadow = true;
        this.scene.add(weight);
        
        // Cable
        const cableGeometry = new THREE.CylinderGeometry(0.05, 0.05, height - 5, 4);
        const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x212121 });
        const cable = new THREE.Mesh(cableGeometry, cableMaterial);
        cable.position.set(position.x + 8, position.y + (height - 5)/2 + 2.5, position.z);
        this.scene.add(cable);
        
        // Hook
        const hookGeometry = new THREE.ConeGeometry(0.3, 1, 6);
        const hookMaterial = new THREE.MeshStandardMaterial({ color: 0x757575 });
        const hook = new THREE.Mesh(hookGeometry, hookMaterial);
        hook.position.set(position.x + 8, position.y + 2, position.z);
        hook.castShadow = true;
        this.scene.add(hook);
        
        // Add physics bodies for each part
        this.physics.createBox(
            4, 1, 4,
            { x: position.x, y: position.y + 0.5, z: position.z },
            undefined,
            0 // Static body
        );
        
        this.physics.createBox(
            2, height, 2,
            { x: position.x, y: position.y + height/2, z: position.z },
            undefined,
            0 // Static body
        );
        
        this.physics.createBox(
            jibLength, 0.5, 0.5,
            { x: position.x + jibLength/2 - 1, y: position.y + height - 1, z: position.z },
            undefined,
            0 // Static body
        );
    }
    
    createMaterialStack(x, y, z) {
        // Create stack of building materials (bricks, cement bags, etc.)
        const stackHeight = 1 + Math.floor(Math.random() * 3);
        const stackWidth = 2 + Math.random() * 1;
        const stackDepth = 1 + Math.random() * 1;
        
        const stackGeometry = new THREE.BoxGeometry(stackWidth, stackHeight, stackDepth);
        const materials = [0xD32F2F, 0xC2185B, 0x7B1FA2, 0x512DA8];
        const stackMaterial = new THREE.MeshStandardMaterial({ 
            color: materials[Math.floor(Math.random() * materials.length)]
        });
        
        const stack = new THREE.Mesh(stackGeometry, stackMaterial);
        stack.position.set(x, y + stackHeight/2, z);
        stack.castShadow = true;
        stack.receiveShadow = true;
        this.scene.add(stack);
        
        // Add physics body
        this.physics.createBox(
            stackWidth, stackHeight, stackDepth,
            { x, y: y + stackHeight/2, z },
            undefined,
            0 // Static body
        );
    }
    
    createPipesStack(x, y, z) {
        // Create a stack of pipes
        const numPipes = 3 + Math.floor(Math.random() * 3);
        const pipeLength = 3 + Math.random() * 2;
        const pipeRadius = 0.2;
        
        for (let i = 0; i < numPipes; i++) {
            const pipeGeometry = new THREE.CylinderGeometry(
                pipeRadius, pipeRadius, pipeLength, 8
            );
            
            const pipeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x5D4037
            });
            
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            
            // Position the pipes in a staggered stack
            const row = Math.floor(i / 2);
            const col = i % 2;
            
            pipe.rotation.z = Math.PI / 2; // Lay pipes horizontally
            pipe.position.set(
                x,
                y + pipeRadius * 2 * row + pipeRadius,
                z + (col * pipeRadius * 2 - pipeRadius)
            );
            
            pipe.castShadow = true;
            pipe.receiveShadow = true;
            this.scene.add(pipe);
            
            // Add physics body
            this.physics.createCylinder(
                pipeRadius, pipeLength, 8,
                { x, y: y + pipeRadius * 2 * row + pipeRadius, z: z + (col * pipeRadius * 2 - pipeRadius) },
                { x: 0, y: 0, z: Math.PI / 2 },
                0 // Static body
            );
        }
    }
    
    createObstacles() {
        // Add obstacles and parkour elements to rooftops
        this.buildings.forEach(building => {
            // Skip small buildings
            if (building.size.width < 8 || building.size.depth < 8) return;
            
            // 30% chance to add obstacles on this building
            if (Math.random() < 0.3) {
                const roofY = building.position.y + building.height + 0.5;
                
                // Determine how many obstacles to add
                const numObstacles = 1 + Math.floor(Math.random() * 2);
                
                for (let i = 0; i < numObstacles; i++) {
                    // Random position on the roof
                    const xOffset = (Math.random() - 0.5) * (building.size.width * 0.7);
                    const zOffset = (Math.random() - 0.5) * (building.size.depth * 0.7);
                    
                    const obstacleX = building.position.x + xOffset;
                    const obstacleZ = building.position.z + zOffset;
                    
                    // Choose a random obstacle type
                    const obstacleType = Math.floor(Math.random() * 3);
                    
                    switch(obstacleType) {
                        case 0: // Boxes
                            this.createBoxObstacle(obstacleX, roofY, obstacleZ);
                            break;
                        case 1: // Air conditioning units
                            this.createAirConditioners(obstacleX, roofY, obstacleZ);
                            break;
                        case 2: // Vents
                            this.createVentObstacle(obstacleX, roofY, obstacleZ);
                            break;
                    }
                }
            }
        });
    }
    
    createBoxObstacle(x, y, z) {
        // Create a stack of boxes as obstacles
        const numBoxes = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numBoxes; i++) {
            // Random box properties
            const boxWidth = 0.8 + Math.random() * 0.6;
            const boxHeight = 0.8 + Math.random() * 0.6;
            const boxDepth = 0.8 + Math.random() * 0.6;
            
            // Random position for stacking
            const xOffset = (Math.random() - 0.5) * 0.6;
            const zOffset = (Math.random() - 0.5) * 0.6;
            
            const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            const boxMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xCD853F,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.set(
                x + xOffset, 
                y + (i * boxHeight) + boxHeight/2, 
                z + zOffset
            );
            box.castShadow = true;
            box.receiveShadow = true;
            this.scene.add(box);
            
            // Add physics body
            this.physics.createBox(
                boxWidth, boxHeight, boxDepth,
                {
                    x: x + xOffset,
                    y: y + (i * boxHeight) + boxHeight/2,
                    z: z + zOffset
                },
                undefined,
                5 // Light mass to make it movable but stable
            );
        }
    }
    
    createAirConditioners(x, y, z) {
        // Create a cluster of AC units
        const numUnits = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numUnits; i++) {
            // Random position in cluster
            const xOffset = (Math.random() - 0.5) * 2;
            const zOffset = (Math.random() - 0.5) * 2;
            
            const unitX = x + xOffset;
            const unitZ = z + zOffset;
            
            // AC unit base
            const baseGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.8);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.set(unitX, y + 0.15, unitZ);
            base.castShadow = true;
            base.receiveShadow = true;
            this.scene.add(base);
            
            // AC unit body
            const bodyGeometry = new THREE.BoxGeometry(1, 0.6, 0.6);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(unitX, y + 0.6, unitZ);
            body.castShadow = true;
            this.scene.add(body);
            
            // Vents
            const ventGeometry = new THREE.PlaneGeometry(0.8, 0.4);
            const ventMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                side: THREE.DoubleSide
            });
            
            // Front vent
            const frontVent = new THREE.Mesh(ventGeometry, ventMaterial);
            frontVent.position.set(unitX, y + 0.6, unitZ + 0.31);
            this.scene.add(frontVent);
            
            // Add physics body for the entire AC unit
            this.physics.createBox(
                1.2, 0.9, 0.8,
                { x: unitX, y: y + 0.45, z: unitZ },
                undefined,
                0 // Static body
            );
        }
    }
    
    createVentObstacle(x, y, z) {
        // Vent base
        const baseGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.5);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y + 0.15, z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        
        // Vent pipe
        const pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.set(x, y + 1.05, z);
        pipe.castShadow = true;
        this.scene.add(pipe);
        
        // Vent top
        const topGeometry = new THREE.CylinderGeometry(0.5, 0.3, 0.2, 8);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(x, y + 1.9, z);
        top.castShadow = true;
        this.scene.add(top);
        
        // Add physics body
        this.physics.createCylinder(
            0.3, 1.8, 8,
            { x, y: y + 1, z },
            undefined,
            0 // Static body
        );
        
        // Add base physics body
        this.physics.createBox(
            1.5, 0.3, 1.5,
            { x, y: y + 0.15, z },
            undefined,
            0 // Static body
        );
    }
    
    createJumpingPaths() {
        // Create jumping paths between buildings
        for (let i = 0; i < this.buildings.length; i++) {
            for (let j = i + 1; j < this.buildings.length; j++) {
                const building1 = this.buildings[i];
                const building2 = this.buildings[j];
                
                // Calculate distance between buildings
                const distance = Math.sqrt(
                    Math.pow(building2.position.x - building1.position.x, 2) +
                    Math.pow(building2.position.z - building1.position.z, 2)
                );
                
                // Check if buildings are close enough to create a path
                // but not too close (overlapping)
                if (distance > 8 && distance < 15) {
                    // Only create a path with 40% probability
                    if (Math.random() < 0.4) {
                        // Calculate height difference
                        const heightDiff = Math.abs(building2.height - building1.height);
                        
                        // Only create paths between buildings with similar heights
                        if (heightDiff < 5) {
                            this.createBridgeBetweenBuildings(building1, building2);
                        }
                    }
                }
            }
        }
    }
    
    createBridgeBetweenBuildings(building1, building2) {
        // Calculate direction vector between buildings
        const direction = new THREE.Vector3(
            building2.position.x - building1.position.x,
            0,
            building2.position.z - building1.position.z
        ).normalize();
        
        // Calculate perpendicular vector for width
        const perp = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Calculate distance
        const distance = new THREE.Vector3(
            building2.position.x - building1.position.x,
            0,
            building2.position.z - building1.position.z
        ).length();
        
        // Choose a random bridge type
        const bridgeType = Math.floor(Math.random() * 3);
        
        switch(bridgeType) {
            case 0: // Wooden plank
                this.createWoodenPlank(building1, building2, direction, distance);
                break;
            case 1: // Metal walkway
                this.createMetalWalkway(building1, building2, direction, distance);
                break;
            case 2: // Pipe
                this.createPipe(building1, building2, direction, distance);
                break;
        }
    }
    
    createWoodenPlank(building1, building2, direction, distance) {
        // Calculate midpoint between buildings
        const midpoint = new THREE.Vector3(
            (building1.position.x + building2.position.x) / 2,
            Math.max(building1.position.y + building1.height, building2.position.y + building2.height) + 0.1,
            (building1.position.z + building2.position.z) / 2
        );
        
        // Create wooden plank
        const plankWidth = 1.5;
        const plankHeight = 0.1;
        
        const plankGeometry = new THREE.BoxGeometry(distance, plankHeight, plankWidth);
        const plankMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const plank = new THREE.Mesh(plankGeometry, plankMaterial);
        plank.position.copy(midpoint);
        
        // Calculate rotation to align with direction
        const angle = Math.atan2(direction.x, direction.z);
        plank.rotation.y = angle;
        
        plank.castShadow = true;
        plank.receiveShadow = true;
        this.scene.add(plank);
        
        // Add physics body
        this.physics.createBox(
            distance, plankHeight, plankWidth,
            midpoint,
            { x: 0, y: angle, z: 0 },
            0 // Static body
        );
    }
    
    createMetalWalkway(building1, building2, direction, distance) {
        // Calculate midpoint between buildings
        const midpoint = new THREE.Vector3(
            (building1.position.x + building2.position.x) / 2,
            Math.max(building1.position.y + building1.height, building2.position.y + building2.height) + 0.1,
            (building1.position.z + building2.position.z) / 2
        );
        
        // Create metal walkway
        const walkwayWidth = 2;
        const walkwayHeight = 0.05;
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(distance, walkwayHeight, walkwayWidth);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x424242,
            roughness: 0.6,
            metalness: 0.8
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.copy(midpoint);
        
        // Calculate rotation to align with direction
        const angle = Math.atan2(direction.x, direction.z);
        base.rotation.y = angle;
        
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        
        // Add railings
        const railHeight = 1;
        const railMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x757575,
            roughness: 0.6,
            metalness: 0.8
        });
        
        // Left railing
        const leftRail = new THREE.Mesh(
            new THREE.BoxGeometry(distance, railHeight, 0.05),
            railMaterial
        );
        leftRail.position.set(
            midpoint.x,
            midpoint.y + railHeight/2,
            midpoint.z + walkwayWidth/2
        );
        leftRail.rotation.y = angle;
        leftRail.castShadow = true;
        this.scene.add(leftRail);
        
        // Right railing
        const rightRail = new THREE.Mesh(
            new THREE.BoxGeometry(distance, railHeight, 0.05),
            railMaterial
        );
        rightRail.position.set(
            midpoint.x,
            midpoint.y + railHeight/2,
            midpoint.z - walkwayWidth/2
        );
        rightRail.rotation.y = angle;
        rightRail.castShadow = true;
        this.scene.add(rightRail);
        
        // Add physics body for the walkway
        this.physics.createBox(
            distance, walkwayHeight, walkwayWidth,
            midpoint,
            { x: 0, y: angle, z: 0 },
            0 // Static body
        );
    }
    
    createPipe(building1, building2, direction, distance) {
        // Calculate midpoint between buildings
        const midpoint = new THREE.Vector3(
            (building1.position.x + building2.position.x) / 2,
            Math.max(building1.position.y + building1.height, building2.position.y + building2.height) + 0.5,
            (building1.position.z + building2.position.z) / 2
        );
        
        // Create pipe
        const pipeRadius = 0.4;
        
        const pipeGeometry = new THREE.CylinderGeometry(
            pipeRadius, pipeRadius, distance, 8
        );
        
        // Rotate cylinder to be horizontal
        pipeGeometry.rotateZ(Math.PI / 2);
        
        const pipeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x607D8B,
            roughness: 0.6,
            metalness: 0.7
        });
        
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.copy(midpoint);
        
        // Calculate rotation to align with direction
        const angle = Math.atan2(direction.x, direction.z);
        pipe.rotation.y = angle;
        
        pipe.castShadow = true;
        this.scene.add(pipe);
        
        // Add physics body for the pipe
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(midpoint.x, midpoint.y, midpoint.z),
            shape: new CANNON.Cylinder(pipeRadius, pipeRadius, distance, 8),
            material: this.physics.defaultMaterial
        });
        
        // Rotate to match the pipe mesh
        const quat = new CANNON.Quaternion();
        quat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
        
        const quatZ = new CANNON.Quaternion();
        quatZ.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
        
        body.quaternion = quat.mult(quatZ);
        
        this.physics.world.addBody(body);
    }
    
    createAtmosphericElements() {
        // Add atmospheric elements like birds, clotheslines between buildings, etc.
        this.createBirds();
        this.createCloudElements();
    }
    
    createBirds() {
        // Create a flock of birds flying around the city
        const numBirds = 15;
        
        for (let i = 0; i < numBirds; i++) {
            // Random position in the sky
            const x = (Math.random() - 0.5) * this.citySize * (this.blockSize.width + this.streetWidth);
            const y = 30 + Math.random() * 30;
            const z = (Math.random() - 0.5) * this.citySize * (this.blockSize.depth + this.streetWidth);
            
            this.createBird(x, y, z);
        }
    }
    
    createBird(x, y, z) {
        // Create a simple bird using basic geometry
        const bird = new THREE.Group();
        
        // Bird body
        const bodyGeometry = new THREE.ConeGeometry(0.3, 1, 4);
        bodyGeometry.rotateX(Math.PI / 2);
        
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bird.add(body);
        
        // Wings
        const wingGeometry = new THREE.PlaneGeometry(1.5, 0.5);
        const wingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(0, 0, -0.7);
        leftWing.rotation.y = Math.PI / 4;
        bird.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0, 0, 0.7);
        rightWing.rotation.y = -Math.PI / 4;
        bird.add(rightWing);
        
        // Position the bird
        bird.position.set(x, y, z);
        
        // Give the bird a random flight direction
        const angle = Math.random() * Math.PI * 2;
        bird.rotation.y = angle;
        
        // Store animation properties
        bird.userData = {
            speed: 3 + Math.random() * 3,
            wingDirection: 1,
            wingSpeed: 0.1 + Math.random() * 0.1,
            wingAngle: 0
        };
        
        // Add to scene
        this.scene.add(bird);
        
        // Add to a list for animation in the update loop
        if (!this.birds) this.birds = [];
        this.birds.push(bird);
    }
    
    createCloudElements() {
        // Add cloud elements above the city
        const numClouds = 8;
        
        for (let i = 0; i < numClouds; i++) {
            // Random position high above the city
            const x = (Math.random() - 0.5) * this.citySize * (this.blockSize.width + this.streetWidth) * 1.5;
            const y = 80 + Math.random() * 50;
            const z = (Math.random() - 0.5) * this.citySize * (this.blockSize.depth + this.streetWidth) * 1.5;
            
            this.createCloud(x, y, z);
        }
    }
    
    createCloud(x, y, z) {
        // Create a cloud using multiple spheres
        const cloud = new THREE.Group();
        
        // Random scale for the cloud
        const scale = 2 + Math.random() * 3;
        
        // Cloud material
        const cloudMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9
        });
        
        // Create several overlapping spheres
        const numSpheres = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < numSpheres; i++) {
            const radius = (0.5 + Math.random() * 0.5) * scale;
            
            const sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);
            const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
            
            // Position spheres relative to cloud center
            const xOffset = (Math.random() - 0.5) * scale * 2;
            const yOffset = (Math.random() - 0.5) * scale * 0.5;
            const zOffset = (Math.random() - 0.5) * scale * 2;
            
            sphere.position.set(xOffset, yOffset, zOffset);
            cloud.add(sphere);
        }
        
        // Position the cloud
        cloud.position.set(x, y, z);
        
        // Store animation properties
        cloud.userData = {
            speed: 0.5 + Math.random() * 0.5,
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                0,
                (Math.random() - 0.5) * 0.2
            ).normalize()
        };
        
        // Add to scene
        this.scene.add(cloud);
        
        // Add to a list for animation in the update loop
        if (!this.clouds) this.clouds = [];
        this.clouds.push(cloud);
    }
    
    update(delta) {
        // Update birds animation
        if (this.birds) {
            this.birds.forEach(bird => {
                // Move bird forward
                const moveDistance = bird.userData.speed * delta;
                bird.translateZ(-moveDistance);
                
                // Flap wings
                bird.userData.wingAngle += bird.userData.wingSpeed * bird.userData.wingDirection;
                
                if (bird.userData.wingAngle > 0.3) {
                    bird.userData.wingDirection = -1;
                } else if (bird.userData.wingAngle < -0.3) {
                    bird.userData.wingDirection = 1;
                }
                
                bird.children[1].rotation.y = Math.PI / 4 + bird.userData.wingAngle;
                bird.children[2].rotation.y = -Math.PI / 4 - bird.userData.wingAngle;
                
                // Check if bird is too far from city center
                const distance = new THREE.Vector3(bird.position.x, 0, bird.position.z).length();
                
                if (distance > this.citySize * this.blockSize.width) {
                    // Turn bird around
                    bird.rotation.y += Math.PI / 60;
                }
                
                // Random direction changes
                if (Math.random() < 0.01) {
                    bird.rotation.y += (Math.random() - 0.5) * 0.2;
                }
                
                // Random height changes
                if (Math.random() < 0.01) {
                    bird.position.y += (Math.random() - 0.5) * 2;
                    
                    // Keep within bounds
                    bird.position.y = Math.max(20, Math.min(80, bird.position.y));
                }
            });
        }
        
        // Update clouds animation
        if (this.clouds) {
            this.clouds.forEach(cloud => {
                // Move cloud in its direction
                cloud.position.x += cloud.userData.direction.x * cloud.userData.speed * delta;
                cloud.position.z += cloud.userData.direction.z * cloud.userData.speed * delta;
                
                // Check if cloud is too far from city center
                const distance = new THREE.Vector3(cloud.position.x, 0, cloud.position.z).length();
                
                if (distance > this.citySize * this.blockSize.width * 2) {
                    // Reset cloud to other side
                    cloud.position.x = -cloud.position.x * 0.8;
                    cloud.position.z = -cloud.position.z * 0.8;
                }
            });
        }
    }
}

window.World = World;