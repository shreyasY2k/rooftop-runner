class Environment {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.obstacles = [];
        this.decorations = [];
        this.cityType = 'los_santos'; // Set city type
        
        // Colors for Los Santos theme
        this.buildingColors = [
            0xDDDDDD, 0xCCCCCC, 0xEEEEEE, // Light colors for downtown
            0xAA9988, 0x998877, 0xBBAA99, // Tan colors for suburban areas
            0x8899AA, 0x7788AA, 0x99AACC  // Blue tints for office buildings
        ];
        
        // Create the city environment
        this.createSkybox();
        this.createGround();
        this.generateLosAngelesInspiredCity();
    }
    
    createSkybox() {
        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skyboxMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // Right
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // Left
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // Top
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // Bottom
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // Front
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide })  // Back
        ];
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
        this.scene.add(skybox);
        this.skybox = skybox;
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        this.scene.add(ground);
    }
    
    createBuilding(x, z, width, height, depth, color) {
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ 
            color: color || this.buildingColors[Math.floor(Math.random() * this.buildingColors.length)]
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        building.position.set(x, height / 2, z);
        this.scene.add(building);
        this.buildings.push(building);
        
        // Add rooftop details
        this.addRooftopDetails(building);
        
        return building;
    }
    
    addRooftopDetails(building) {
        const buildingWidth = building.geometry.parameters.width;
        const buildingHeight = building.geometry.parameters.height;
        const buildingDepth = building.geometry.parameters.depth;
        const roofTopY = building.position.y + buildingHeight / 2;
        
        // Random chance to add various rooftop items
        if (Math.random() > 0.7) {
            // Water tower
            this.createWaterTower(
                building.position.x + randomRange(-buildingWidth/4, buildingWidth/4),
                roofTopY,
                building.position.z + randomRange(-buildingDepth/4, buildingDepth/4)
            );
        }
        
        if (Math.random() > 0.6) {
            // AC unit
            this.createACUnit(
                building.position.x + randomRange(-buildingWidth/4, buildingWidth/4),
                roofTopY,
                building.position.z + randomRange(-buildingDepth/4, buildingDepth/4)
            );
        }
        
        if (Math.random() > 0.8) {
            // Satellite dish
            this.createSatelliteDish(
                building.position.x + randomRange(-buildingWidth/4, buildingWidth/4),
                roofTopY,
                building.position.z + randomRange(-buildingDepth/4, buildingDepth/4)
            );
        }
        
        // Add clotheslines between buildings sometimes
        if (Math.random() > 0.9) {
            this.createClothesline(building);
        }
    }
    
    createWaterTower(x, y, z) {
        // Base cylinder
        const baseGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y + 0.25, z);
        
        // Tank
        const tankGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
        const tankMaterial = new THREE.MeshLambertMaterial({ color: 0xA52A2A });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(x, y + 1.5, z);
        
        // Legs
        for (let i = 0; i < 4; i++) {
            const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            leg.position.set(
                x + Math.cos(angle) * 1.2,
                y - 1.5,
                z + Math.sin(angle) * 1.2
            );
            this.scene.add(leg);
            this.decorations.push(leg);
        }
        
        this.scene.add(base);
        this.scene.add(tank);
        this.decorations.push(base, tank);
        
        // Add as obstacle
        const obstacle = new THREE.Group();
        obstacle.add(base.clone(), tank.clone());
        obstacle.position.set(x, y, z);
        obstacle.userData = { type: 'obstacle' };
        this.obstacles.push(obstacle);
    }
    
    createACUnit(x, y, z) {
        const boxGeometry = new THREE.BoxGeometry(1.5, 0.8, 1);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        const acUnit = new THREE.Mesh(boxGeometry, boxMaterial);
        acUnit.position.set(x, y + 0.4, z);
        this.scene.add(acUnit);
        this.decorations.push(acUnit);
        
        // Add as obstacle
        acUnit.userData = { type: 'obstacle' };
        this.obstacles.push(acUnit);
    }
    
    createSatelliteDish(x, y, z) {
        // Dish
        const dishGeometry = new THREE.SphereGeometry(0.8, 16, 16, 0, Math.PI);
        const dishMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.rotation.x = Math.PI / 4;
        dish.position.set(x, y + 0.8, z);
        
        // Stand
        const standGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        const standMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const stand = new THREE.Mesh(standGeometry, standMaterial);
        stand.position.set(x, y + 0.5, z);
        
        this.scene.add(dish);
        this.scene.add(stand);
        this.decorations.push(dish, stand);
        
        // Group for collision
        const satelliteDish = new THREE.Group();
        satelliteDish.add(dish.clone(), stand.clone());
        satelliteDish.position.set(x, y, z);
        satelliteDish.userData = { type: 'obstacle' };
        this.obstacles.push(satelliteDish);
    }
    
    createClothesline(building) {
        // Find a nearby building
        const nearbyBuildings = this.buildings.filter(b => {
            if (b === building) return false;
            
            const distance = Math.sqrt(
                Math.pow(b.position.x - building.position.x, 2) +
                Math.pow(b.position.z - building.position.z, 2)
            );
            
            return distance < 15 && Math.abs(b.position.y - building.position.y) < 2;
        });
        
        if (nearbyBuildings.length > 0) {
            const targetBuilding = nearbyBuildings[Math.floor(Math.random() * nearbyBuildings.length)];
            
            // Create the line
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(
                    building.position.x,
                    building.position.y + building.geometry.parameters.height / 2 + 0.5,
                    building.position.z
                ),
                new THREE.Vector3(
                    targetBuilding.position.x,
                    targetBuilding.position.y + targetBuilding.geometry.parameters.height / 2 + 0.5,
                    targetBuilding.position.z
                )
            ]);
            
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(line);
            this.decorations.push(line);
            
            // Add some clothes
            const numClothes = Math.floor(randomRange(2, 5));
            for (let i = 0; i < numClothes; i++) {
                const t = (i + 1) / (numClothes + 1);
                const clothGeometry = new THREE.PlaneGeometry(0.5, 0.7);
                const clothMaterial = new THREE.MeshLambertMaterial({ 
                    color: Math.random() * 0xFFFFFF,
                    side: THREE.DoubleSide
                });
                const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
                
                // Position along the line
                cloth.position.x = building.position.x + (targetBuilding.position.x - building.position.x) * t;
                cloth.position.y = building.position.y + building.geometry.parameters.height / 2 + 0.1;
                cloth.position.z = building.position.z + (targetBuilding.position.z - building.position.z) * t;
                
                // Rotate to hang down
                cloth.rotation.x = Math.PI / 2;
                
                this.scene.add(cloth);
                this.decorations.push(cloth);
            }
            
            // Add as obstacle/collectible
            const clothesline = new THREE.Mesh(
                new THREE.BoxGeometry(
                    Math.abs(targetBuilding.position.x - building.position.x),
                    0.1,
                    Math.abs(targetBuilding.position.z - building.position.z)
                ),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
            );
            
            clothesline.position.x = (building.position.x + targetBuilding.position.x) / 2;
            clothesline.position.y = building.position.y + building.geometry.parameters.height / 2 + 0.5;
            clothesline.position.z = (building.position.z + targetBuilding.position.z) / 2;
            clothesline.userData = { type: 'collectible' };
            
            this.scene.add(clothesline);
            this.obstacles.push(clothesline);
        }
    }
    
    generateLosAngelesInspiredCity() {
        // Clear any existing buildings
        for (const building of this.buildings) {
            this.scene.remove(building);
        }
        this.buildings = [];
        
        // Create downtown area
        this.createDowntown();
        
        // Create Vinewood Hills
        this.createVinewoodHills();
        
        // Create beach area
        this.createBeachArea();
        
        // Create highways
        this.createHighways();
        
        // Create iconic landmarks
        this.createLandmarks();
    }
    
    createDowntown() {
        // Downtown grid (skyscrapers and office buildings)
        const downtownCenter = { x: 0, z: 0 };
        const downtownSize = 200;
        const blockSize = 30;
        
        for (let x = -downtownSize/2; x < downtownSize/2; x += blockSize) {
            for (let z = -downtownSize/2; z < downtownSize/2; z += blockSize) {
                // Skip some blocks for roads
                if (x % (blockSize * 2) === 0 || z % (blockSize * 2) === 0) continue;
                
                // Create skyscrapers with varying heights
                const distFromCenter = Math.sqrt(x*x + z*z);
                const heightFactor = 1 - (distFromCenter / (downtownSize/2)) * 0.7;
                
                const buildingHeight = randomRange(20, 60) * heightFactor;
                const buildingWidth = randomRange(15, 25);
                const buildingDepth = randomRange(15, 25);
                
                // Add some randomness to position
                const offsetX = randomRange(-5, 5);
                const offsetZ = randomRange(-5, 5);
                
                this.createBuilding(
                    downtownCenter.x + x + offsetX,
                    downtownCenter.z + z + offsetZ,
                    buildingWidth,
                    buildingHeight,
                    buildingDepth
                );
            }
        }
    }
    
    createVinewoodHills() {
        // Hills to the north with mansions
        const hillsCenter = { x: 0, z: -300 };
        const hillsSize = 300;
        
        // Create terrain base (simplified for this implementation)
        const hillGeometry = new THREE.PlaneGeometry(hillsSize, hillsSize, 20, 20);
        const hillMaterial = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
        const hills = new THREE.Mesh(hillGeometry, hillMaterial);
        hills.rotation.x = -Math.PI / 2;
        hills.position.set(hillsCenter.x, 30, hillsCenter.z);
        
        // Modify vertices to create hills
        const vertices = hillGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i+2];
            const distFromCenter = Math.sqrt(x*x + z*z);
            vertices[i+1] = 20 * Math.sin(distFromCenter/20) + randomRange(0, 10);
        }
        hillGeometry.attributes.position.needsUpdate = true;
        
        this.scene.add(hills);
        
        // Add mansions on the hills
        for (let i = 0; i < 20; i++) {
            const x = randomRange(-hillsSize/2, hillsSize/2);
            const z = randomRange(-hillsSize/2, hillsSize/2);
            
            const mansionWidth = randomRange(10, 20);
            const mansionHeight = randomRange(8, 15);
            const mansionDepth = randomRange(10, 20);
            
            this.createBuilding(
                hillsCenter.x + x,
                hillsCenter.z + z,
                mansionWidth,
                mansionHeight,
                mansionDepth,
                0xFFFFFF // White mansions
            );
        }
    }
    
    createBeachArea() {
        // Beach to the west
        const beachCenter = { x: 300, z: 0 };
        const beachSize = 300;
        
        // Create beach terrain
        const beachGeometry = new THREE.PlaneGeometry(beachSize, beachSize);
        const beachMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 }); // Sand color
        const beach = new THREE.Mesh(beachGeometry, beachMaterial);
        beach.rotation.x = -Math.PI / 2;
        beach.position.set(beachCenter.x, -2, beachCenter.z);
        this.scene.add(beach);
        
        // Create ocean
        const oceanGeometry = new THREE.PlaneGeometry(beachSize, beachSize);
        const oceanMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0077BE,
            transparent: true,
            opacity: 0.8
        });
        const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.set(beachCenter.x + beachSize/2, -3, beachCenter.z);
        this.scene.add(ocean);
        
        // Add beach buildings (shorter buildings)
        for (let i = 0; i < 15; i++) {
            const x = randomRange(-beachSize/4, beachSize/4);
            const z = randomRange(-beachSize/2, beachSize/2);
            
            const buildingWidth = randomRange(10, 15);
            const buildingHeight = randomRange(10, 20);
            const buildingDepth = randomRange(10, 15);
            
            this.createBuilding(
                beachCenter.x + x,
                beachCenter.z + z,
                buildingWidth,
                buildingHeight,
                buildingDepth,
                0xFAF0E6 // Light beach building color
            );
        }
    }
    
    createHighways() {
        // Main highway running north-south
        const highwayNSGeometry = new THREE.BoxGeometry(20, 0.5, 1000);
        const highwayMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const highwayNS = new THREE.Mesh(highwayNSGeometry, highwayMaterial);
        highwayNS.position.set(-100, 0, 0);
        this.scene.add(highwayNS);
        
        // Highway markings
        const markingGeometry = new THREE.PlaneGeometry(1, 10);
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        for (let z = -490; z < 490; z += 20) {
            const marking = new THREE.Mesh(markingGeometry, markingMaterial);
            marking.rotation.x = -Math.PI / 2;
            marking.position.set(-100, 0.3, z);
            this.scene.add(marking);
        }
        
        // East-west highway
        const highwayEWGeometry = new THREE.BoxGeometry(1000, 0.5, 20);
        const highwayEW = new THREE.Mesh(highwayEWGeometry, highwayMaterial);
        highwayEW.position.set(0, 0, 100);
        this.scene.add(highwayEW);
        
        // Highway markings for east-west
        for (let x = -490; x < 490; x += 20) {
            const marking = new THREE.Mesh(markingGeometry, markingMaterial);
            marking.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
            marking.position.set(x, 0.3, 100);
            this.scene.add(marking);
        }
    }
    
    createLandmarks() {
        // Create iconic Los Santos landmarks
        
        // Maze Bank Tower (tallest building in center)
        const mazeBankGeometry = new THREE.BoxGeometry(30, 100, 30);
        const mazeBankMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const mazeBank = new THREE.Mesh(mazeBankGeometry, mazeBankMaterial);
        mazeBank.position.set(0, 50, 0);
        this.scene.add(mazeBank);
        this.buildings.push(mazeBank);
        
        // Top section of Maze Bank
        const mazeBankTopGeometry = new THREE.ConeGeometry(20, 20, 4);
        const mazeBankTop = new THREE.Mesh(mazeBankTopGeometry, mazeBankMaterial);
        mazeBankTop.position.set(0, 110, 0);
        mazeBankTop.rotation.y = Math.PI / 4;
        this.scene.add(mazeBankTop);
        
        // Vinewood Sign
        this.createVinewoodSign();
        
        // Observatory
        this.createObservatory();
        
        // Starting building should be Maze Bank for player to start on top
        mazeBank.userData = { isStartingPoint: true };
    }
    
    createVinewoodSign() {
        const signCenter = { x: 0, z: -200 };
        const letterWidth = 5;
        const letterHeight = 15;
        const letterDepth = 2;
        const letterSpacing = 8;
        const signText = "VINEWOOD";
        
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        
        for (let i = 0; i < signText.length; i++) {
            // Create letter supports
            const supportGeometry = new THREE.BoxGeometry(2, 25, 2);
            const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(
                signCenter.x + (i - signText.length/2) * letterSpacing,
                12.5,
                signCenter.z
            );
            this.scene.add(support);
            
            // Create letter
            const letterGeometry = new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth);
            const letter = new THREE.Mesh(letterGeometry, signMaterial);
            letter.position.set(
                signCenter.x + (i - signText.length/2) * letterSpacing,
                25,
                signCenter.z
            );
            this.scene.add(letter);
            this.decorations.push(letter);
        }
    }
    
    createObservatory() {
        const observatoryCenter = { x: -150, z: -250 };
        
        // Main building
        const domeBaseGeometry = new THREE.CylinderGeometry(15, 15, 10, 20);
        const domeBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
        const domeBase = new THREE.Mesh(domeBaseGeometry, domeBaseMaterial);
        domeBase.position.set(observatoryCenter.x, 5, observatoryCenter.z);
        this.scene.add(domeBase);
        this.buildings.push(domeBase);
        
        // Dome
        const domeGeometry = new THREE.SphereGeometry(15, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeometry, domeBaseMaterial);
        dome.position.set(observatoryCenter.x, 15, observatoryCenter.z);
        this.scene.add(dome);
        
        // Telescope
        const telescopeBaseGeometry = new THREE.CylinderGeometry(3, 3, 5, 10);
        const telescopeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const telescopeBase = new THREE.Mesh(telescopeBaseGeometry, telescopeMaterial);
        telescopeBase.position.set(observatoryCenter.x, 15, observatoryCenter.z);
        this.scene.add(telescopeBase);
        
        const telescopeGeometry = new THREE.CylinderGeometry(2, 2, 10, 10);
        const telescope = new THREE.Mesh(telescopeGeometry, telescopeMaterial);
        telescope.position.set(observatoryCenter.x, 15, observatoryCenter.z);
        telescope.rotation.x = Math.PI / 4;
        this.scene.add(telescope);
    }
    
    updateSkyForDayNight(timeOfDay) {
        // Update skybox color based on time of day (0-1, where 0 is midnight, 0.5 is noon)
        const skyColors = {
            dawn: 0xFFC0CB,  // Pink
            day: 0x87CEEB,   // Sky Blue
            dusk: 0xFFA07A,  // Light Salmon
            night: 0x191970  // Midnight Blue
        };
        
        let skyColor;
        
        if (timeOfDay < 0.25) { // Night to dawn
            skyColor = this.lerpColor(skyColors.night, skyColors.dawn, timeOfDay * 4);
        } else if (timeOfDay < 0.5) { // Dawn to day
            skyColor = this.lerpColor(skyColors.dawn, skyColors.day, (timeOfDay - 0.25) * 4);
        } else if (timeOfDay < 0.75) { // Day to dusk
            skyColor = this.lerpColor(skyColors.day, skyColors.dusk, (timeOfDay - 0.5) * 4);
        } else { // Dusk to night
            skyColor = this.lerpColor(skyColors.dusk, skyColors.night, (timeOfDay - 0.75) * 4);
        }
        
        for (let i = 0; i < 6; i++) {
            this.skybox.material[i].color.set(skyColor);
        }
    }
    
    lerpColor(color1, color2, factor) {
        const c1 = new THREE.Color(color1);
        const c2 = new THREE.Color(color2);
        
        const r = c1.r + (c2.r - c1.r) * factor;
        const g = c1.g + (c2.g - c1.g) * factor;
        const b = c1.b + (c2.b - c1.b) * factor;
        
        return new THREE.Color(r, g, b);
    }
}
