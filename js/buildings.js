// Building and obstacle generation

class Building {
    constructor(scene, physics, position, size, height, textureType = 'concrete') {
        this.scene = scene;
        this.physics = physics;
        this.position = position;
        this.size = size;
        this.height = height;
        this.textureType = textureType;
        
        // Create building mesh and body
        this.createBuilding();
        
        // Add rooftop details
        this.addRooftopDetails();
    }
    
    createBuilding() {
        // Create building geometry
        const geometry = new THREE.BoxGeometry(this.size.width, this.height, this.size.depth);
        
        // Create material based on texture type
        let material;
        
        switch(this.textureType) {
            case 'brick':
                material = new THREE.MeshStandardMaterial({ 
                    color: 0xA52A2A,
                    roughness: 0.9,
                    metalness: 0.1
                });
                break;
            case 'glass':
                material = new THREE.MeshStandardMaterial({ 
                    color: 0x87CEEB,
                    roughness: 0.1,
                    metalness: 0.9,
                    transparent: true,
                    opacity: 0.7
                });
                break;
            case 'concrete':
            default:
                material = new THREE.MeshStandardMaterial({ 
                    color: 0x808080,
                    roughness: 0.7,
                    metalness: 0.2
                });
                break;
        }
        
        // Create building mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            this.position.x,
            this.position.y + this.height / 2, // Center the building vertically
            this.position.z
        );
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Create physics body for the building
        this.body = this.physics.createBox(
            this.size.width,
            this.height,
            this.size.depth,
            { 
                x: this.position.x, 
                y: this.position.y + this.height / 2, 
                z: this.position.z
            },
            undefined,
            0 // Static body (mass = 0)
        );
    }
    
    addRooftopDetails() {
        // Add a rooftop mesh with slightly different material
        const roofGeometry = new THREE.BoxGeometry(
            this.size.width + 0.2, // Slight overhang
            0.5, // Roof thickness
            this.size.depth + 0.2 // Slight overhang
        );
        
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x505050,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.roof = new THREE.Mesh(roofGeometry, roofMaterial);
        this.roof.position.set(
            this.position.x,
            this.position.y + this.height + 0.25, // Place on top of building
            this.position.z
        );
        this.roof.castShadow = true;
        this.roof.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.roof);
        
        // Create physics body for the roof
        this.roofBody = this.physics.createBox(
            this.size.width + 0.2,
            0.5,
            this.size.depth + 0.2,
            { 
                x: this.position.x, 
                y: this.position.y + this.height + 0.25, 
                z: this.position.z
            },
            undefined,
            0 // Static body (mass = 0)
        );
        
        // Randomly add rooftop structures
        this.addRooftopStructures();
    }
    
    addRooftopStructures() {
        const roofTopY = this.position.y + this.height + 0.5;
        
        // Determine how many structures to add based on building size
        const area = this.size.width * this.size.depth;
        const numStructures = Math.floor(Math.random() * (area / 25)) + 1;
        
        for (let i = 0; i < numStructures; i++) {
            // Random position on the roof
            const xOffset = (Math.random() - 0.5) * (this.size.width * 0.8);
            const zOffset = (Math.random() - 0.5) * (this.size.depth * 0.8);
            
            const structureX = this.position.x + xOffset;
            const structureZ = this.position.z + zOffset;
            
            // Choose a random structure type
            const structureType = Math.floor(Math.random() * 5);
            
            switch(structureType) {
                case 0: // AC unit
                    this.createACUnit(structureX, roofTopY, structureZ);
                    break;
                case 1: // Water tower
                    this.createWaterTower(structureX, roofTopY, structureZ);
                    break;
                case 2: // Satellite dish
                    this.createSatelliteDish(structureX, roofTopY, structureZ);
                    break;
                case 3: // Skylight
                    this.createSkylight(structureX, roofTopY, structureZ);
                    break;
                case 4: // Rooftop access room
                    this.createAccessRoom(structureX, roofTopY, structureZ);
                    break;
            }
        }
        
        // Add a clothesline (50% chance for wider buildings)
        if (this.size.width > 10 && Math.random() < 0.5) {
            this.createClothesLine();
        }
    }
    
    createACUnit(x, y, z) {
        // AC unit base
        const baseGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y + 0.25, z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        
        // AC unit top
        const topGeometry = new THREE.BoxGeometry(1.3, 0.8, 1.3);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(x, y + 0.9, z);
        top.castShadow = true;
        top.receiveShadow = true;
        this.scene.add(top);
        
        // Vents
        const ventGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
        const ventMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        for (let i = 0; i < 3; i++) {
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.rotation.x = Math.PI / 2; // Rotate to face upward
            vent.position.set(
                x + (Math.random() - 0.5) * 0.8,
                y + 1.3,
                z + (Math.random() - 0.5) * 0.8
            );
            this.scene.add(vent);
        }
        
        // Add physics body for the AC unit (as a single box for simplicity)
        this.physics.createBox(
            1.5, 1.3, 1.5,
            { x, y: y + 0.65, z },
            undefined,
            0 // Static body
        );
    }
    
    createWaterTower(x, y, z) {
        // Base platform
        const baseGeometry = new THREE.BoxGeometry(2, 0.3, 2);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y + 0.15, z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        
        // Support legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        
        const positions = [
            { x: 0.7, z: 0.7 },
            { x: -0.7, z: 0.7 },
            { x: 0.7, z: -0.7 },
            { x: -0.7, z: -0.7 }
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x + pos.x, y + 1.15, z + pos.z);
            leg.castShadow = true;
            this.scene.add(leg);
            
            // Add physics body for each leg
            this.physics.createCylinder(
                0.1, 2, 6,
                { x: x + pos.x, y: y + 1.15, z: z + pos.z },
                undefined,
                0 // Static body
            );
        });
        
        // Water tank
        const tankGeometry = new THREE.CylinderGeometry(1, 1, 1.5, 12);
        const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x708090 });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(x, y + 2.85, z);
        tank.castShadow = true;
        tank.receiveShadow = true;
        this.scene.add(tank);
        
        // Add physics body for the tank
        this.physics.createCylinder(
            1, 1.5, 12,
            { x, y: y + 2.85, z },
            undefined,
            0 // Static body
        );
        
        // Tank top
        const topGeometry = new THREE.ConeGeometry(1.1, 0.5, 12);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x708090 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(x, y + 3.85, z);
        top.castShadow = true;
        this.scene.add(top);
    }
    
    createSatelliteDish(x, y, z) {
        // Base
        const baseGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.5);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y + 0.15, z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        
        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, y + 0.8, z);
        pole.castShadow = true;
        this.scene.add(pole);
        
        // Dish
        const dishGeometry = new THREE.SphereGeometry(0.6, 12, 12, 0, Math.PI);
        const dishMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xAAAAAA,
            side: THREE.DoubleSide
        });
        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.rotation.x = Math.PI / 4; // Tilt the dish
        dish.position.set(x, y + 1.4, z + 0.3);
        dish.castShadow = true;
        this.scene.add(dish);
        
        // Add physics body (simplified as a box)
        this.physics.createBox(
            1.2, 1.5, 1.2,
            { x, y: y + 0.75, z },
            undefined,
            0 // Static body
        );
    }
    
    createSkylight(x, y, z) {
        // Frame
        const frameGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.5);
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, y + 0.15, z);
        frame.castShadow = true;
        frame.receiveShadow = true;
        this.scene.add(frame);
        
        // Glass
        const glassGeometry = new THREE.BoxGeometry(1.3, 0.1, 1.3);
        const glassMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xAFEEEE,
            transparent: true,
            opacity: 0.7
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.set(x, y + 0.35, z);
        this.scene.add(glass);
        
        // Add physics body for the skylight
        this.physics.createBox(
            1.5, 0.3, 1.5,
            { x, y: y + 0.15, z },
            undefined,
            0 // Static body
        );
    }
    
    createAccessRoom(x, y, z) {
        // Room
        const roomGeometry = new THREE.BoxGeometry(2, 2, 2);
        const roomMaterial = new THREE.MeshStandardMaterial({ 
            color: this.textureType === 'brick' ? 0xA52A2A : 0x808080
        });
        const room = new THREE.Mesh(roomGeometry, roomMaterial);
        room.position.set(x, y + 1, z);
        room.castShadow = true;
        room.receiveShadow = true;
        this.scene.add(room);
        
        // Door
        const doorGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        
        // Position the door on a random side of the room
        const doorSide = Math.floor(Math.random() * 4);
        switch(doorSide) {
            case 0: // Front
                door.position.set(x, y + 0.75, z + 1.05);
                break;
            case 1: // Back
                door.position.set(x, y + 0.75, z - 1.05);
                break;
            case 2: // Left
                door.position.set(x - 1.05, y + 0.75, z);
                door.rotation.y = Math.PI / 2;
                break;
            case 3: // Right
                door.position.set(x + 1.05, y + 0.75, z);
                door.rotation.y = Math.PI / 2;
                break;
        }
        
        door.castShadow = true;
        this.scene.add(door);
        
        // Roof
        const roofGeometry = new THREE.BoxGeometry(2.4, 0.2, 2.4);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, y + 2.1, z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        this.scene.add(roof);
        
        // Add physics body for the access room
        this.physics.createBox(
            2, 2, 2,
            { x, y: y + 1, z },
            undefined,
            0 // Static body
        );
        
        // Add physics body for the roof
        this.physics.createBox(
            2.4, 0.2, 2.4,
            { x, y: y + 2.1, z },
            undefined,
            0 // Static body
        );
    }
    
    createClothesLine() {
        // Choose random positions for the clothesline poles
        const edge1 = this.size.width / 2 - 1;
        const edge2 = this.size.depth / 2 - 1;
        
        let startPos, endPos;
        
        // Determine which edges to place the poles on
        if (Math.random() < 0.5) {
            // Along width
            const zPos = (Math.random() - 0.5) * this.size.depth * 0.6;
            startPos = {
                x: this.position.x - edge1,
                y: this.position.y + this.height + 0.5,
                z: this.position.z + zPos
            };
            endPos = {
                x: this.position.x + edge1,
                y: this.position.y + this.height + 0.5,
                z: this.position.z + zPos
            };
        } else {
            // Along depth
            const xPos = (Math.random() - 0.5) * this.size.width * 0.6;
            startPos = {
                x: this.position.x + xPos,
                y: this.position.y + this.height + 0.5,
                z: this.position.z - edge2
            };
            endPos = {
                x: this.position.x + xPos,
                y: this.position.y + this.height + 0.5,
                z: this.position.z + edge2
            };
        }
        
        // Create poles
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        
        const pole1 = new THREE.Mesh(poleGeometry, poleMaterial);
        pole1.position.set(startPos.x, startPos.y + 0.75, startPos.z);
        pole1.castShadow = true;
        this.scene.add(pole1);
        
        const pole2 = new THREE.Mesh(poleGeometry, poleMaterial);
        pole2.position.set(endPos.x, endPos.y + 0.75, endPos.z);
        pole2.castShadow = true;
        this.scene.add(pole2);
        
        // Add physics bodies for poles
        const pole1Body = this.physics.createCylinder(
            0.05, 1.5, 6,
            { x: startPos.x, y: startPos.y + 0.75, z: startPos.z },
            undefined,
            0 // Static body
        );
        
        const pole2Body = this.physics.createCylinder(
            0.05, 1.5, 6,
            { x: endPos.x, y: endPos.y + 0.75, z: endPos.z },
            undefined,
            0 // Static body
        );
        
        // Create clothesline (line between poles)
        const lineGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1, 4);
        lineGeometry.rotateZ(Math.PI / 2); // Rotate to be horizontal
        
        // Calculate distance and midpoint
        const distance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) + 
            Math.pow(endPos.z - startPos.z, 2)
        );
        
        const midPoint = {
            x: (startPos.x + endPos.x) / 2,
            y: startPos.y + 1.4, // Top of pole
            z: (startPos.z + endPos.z) / 2
        };
        
        // Scale line to match distance
        lineGeometry.scale(1, distance, 1);
        
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        
        // Calculate rotation to point from start to end
        const angleY = Math.atan2(
            endPos.x - startPos.x,
            endPos.z - startPos.z
        );
        
        line.rotation.y = angleY;
        line.position.set(midPoint.x, midPoint.y, midPoint.z);
        this.scene.add(line);
        
        // Add clothes (small colored planes)
        const numClothes = Math.floor(Math.random() * 4) + 2;
        const clothColors = [0xFFFFFF, 0x87CEEB, 0xFFD700, 0xFFA07A, 0x98FB98];
        
        for (let i = 0; i < numClothes; i++) {
            // Random position along the line
            const t = (i + 1) / (numClothes + 1);
            const clothPos = {
                x: startPos.x + (endPos.x - startPos.x) * t,
                y: startPos.y + 1.25, // Slightly below the line
                z: startPos.z + (endPos.z - startPos.z) * t
            };
            
            // Create a random sized cloth
            const clothWidth = 0.4 + Math.random() * 0.3;
            const clothHeight = 0.5 + Math.random() * 0.4;
            
            const clothGeometry = new THREE.PlaneGeometry(clothWidth, clothHeight);
            const clothMaterial = new THREE.MeshStandardMaterial({ 
                color: clothColors[Math.floor(Math.random() * clothColors.length)],
                side: THREE.DoubleSide
            });
            
            const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
            cloth.position.set(clothPos.x, clothPos.y, clothPos.z);
            
            // Random rotation
            cloth.rotation.y = angleY + (Math.random() - 0.5) * 0.2;
            
            cloth.castShadow = true;
            this.scene.add(cloth);
        }
    }
}

// Function to create a city block of buildings
function createCityBlock(scene, physics, blockPosition, blockSize, buildings = 5) {
    const buildingsList = [];
    
    // Determine grid size based on number of buildings
    const gridSize = Math.ceil(Math.sqrt(buildings));
    const cellWidth = blockSize.width / gridSize;
    const cellDepth = blockSize.depth / gridSize;
    
    // Create buildings in a grid pattern
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // Skip some buildings to create a more natural pattern
            if (buildings <= 0 || Math.random() < 0.2) continue;
            
            // Calculate building position
            const xPos = blockPosition.x - (blockSize.width / 2) + (i + 0.5) * cellWidth;
            const zPos = blockPosition.z - (blockSize.depth / 2) + (j + 0.5) * cellDepth;
            
            // Randomize building properties
            const buildingWidth = cellWidth * (0.7 + Math.random() * 0.6);
            const buildingDepth = cellDepth * (0.7 + Math.random() * 0.6);
            const buildingHeight = 10 + Math.random() * 20;
            
            // Choose building texture type
            const textureTypes = ['concrete', 'brick', 'glass'];
            const textureType = textureTypes[Math.floor(Math.random() * textureTypes.length)];
            
            // Create the building
            const building = new Building(
                scene,
                physics,
                { x: xPos, y: blockPosition.y, z: zPos },
                { width: buildingWidth, depth: buildingDepth },
                buildingHeight,
                textureType
            );
            
            buildingsList.push(building);
            buildings--;
        }
    }
    
    return buildingsList;
}

function createCityBlock(scene, physics, blockPosition, blockSize, buildings = 5) {
    const buildingsList = [];
    
    // Determine grid size based on number of buildings
    const gridSize = Math.ceil(Math.sqrt(buildings));
    const cellWidth = blockSize.width / gridSize;
    const cellDepth = blockSize.depth / gridSize;
    
    // Create buildings in a grid pattern
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // Skip some buildings to create a more natural pattern
            if (buildings <= 0 || Math.random() < 0.2) continue;
            
            // Calculate building position
            const xPos = blockPosition.x - (blockSize.width / 2) + (i + 0.5) * cellWidth;
            const zPos = blockPosition.z - (blockSize.depth / 2) + (j + 0.5) * cellDepth;
            
            // Randomize building properties
            const buildingWidth = cellWidth * (0.7 + Math.random() * 0.6);
            const buildingDepth = cellDepth * (0.7 + Math.random() * 0.6);
            const buildingHeight = 10 + Math.random() * 20;
            
            // Choose building texture type
            const textureTypes = ['concrete', 'brick', 'glass'];
            const textureType = textureTypes[Math.floor(Math.random() * textureTypes.length)];
            
            // Create the building
            const building = new Building(
                scene,
                physics,
                { x: xPos, y: blockPosition.y, z: zPos },
                { width: buildingWidth, depth: buildingDepth },
                buildingHeight,
                textureType
            );
            
            buildingsList.push(building);
            buildings--;
        }
    }
    
    return buildingsList;
}

// Make the Building class and createCityBlock function globally accessible
window.Building = Building;
window.createCityBlock = createCityBlock;