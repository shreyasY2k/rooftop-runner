class DayNightCycle {
    constructor(scene, environment) {
        this.scene = scene;
        this.environment = environment;
        this.cycleTime = 180; // seconds for a full day/night cycle
        this.currentTime = 0;
        this.timeOfDay = 0.5; // Start at midday
        
        this.setupLighting();
    }
    
    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(this.ambientLight);
        
        // Sun/moon directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(100, 100, 0);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);
        
        // Building lights (only visible at night)
        this.buildingLights = [];
        this.setupBuildingLights();
    }
    
    setupBuildingLights() {
        // Add point lights to some buildings
        if (this.environment && this.environment.buildings) {
            for (const building of this.environment.buildings) {
                if (Math.random() > 0.7) {
                    const light = new THREE.PointLight(0xFFFF99, 0, 10);
                    light.position.set(
                        building.position.x,
                        building.position.y + building.geometry.parameters.height / 2 + 1,
                        building.position.z
                    );
                    this.scene.add(light);
                    this.buildingLights.push(light);
                }
                
                // Add window lights
                if (Math.random() > 0.5) {
                    this.addWindowLights(building);
                }
            }
        }
    }
    
    addWindowLights(building) {
        const width = building.geometry.parameters.width;
        const height = building.geometry.parameters.height;
        const depth = building.geometry.parameters.depth;
        
        const rows = Math.floor(height / 3);
        const colsX = Math.floor(width / 3);
        const colsZ = Math.floor(depth / 3);
        
        // Add window lights
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < colsX; x++) {
                if (Math.random() > 0.5) {
                    const windowGeometry = new THREE.PlaneGeometry(1.5, 1.5);
                    const windowMaterial = new THREE.MeshBasicMaterial({ 
                        color: 0xFFFF99,
                        transparent: true,
                        opacity: 0
                    });
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    const xPos = building.position.x - width / 2 + x * 3 + 1.5;
                    const yPos = building.position.y - height / 2 + y * 3 + 1.5;
                    const zPos = building.position.z + depth / 2 + 0.01;
                    
                    window.position.set(xPos, yPos, zPos);
                    window.userData = { isWindow: true };
                    
                    this.scene.add(window);
                    this.buildingLights.push(window);
                }
            }
            
            // Add windows to the other side
            for (let z = 0; z < colsZ; z++) {
                if (Math.random() > 0.5) {
                    const windowGeometry = new THREE.PlaneGeometry(1.5, 1.5);
                    const windowMaterial = new THREE.MeshBasicMaterial({ 
                        color: 0xFFFF99,
                        transparent: true,
                        opacity: 0
                    });
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    const xPos = building.position.x + width / 2 + 0.01;
                    const yPos = building.position.y - height / 2 + y * 3 + 1.5;
                    const zPos = building.position.z - depth / 2 + z * 3 + 1.5;
                    
                    window.rotation.y = Math.PI / 2;
                    window.position.set(xPos, yPos, zPos);
                    window.userData = { isWindow: true };
                    
                    this.scene.add(window);
                    this.buildingLights.push(window);
                }
            }
        }
    }
    
    update(deltaTime) {
        // Update cycle time
        this.currentTime += deltaTime;
        if (this.currentTime > this.cycleTime) {
            this.currentTime = 0;
        }
        
        this.timeOfDay = this.currentTime / this.cycleTime;
        
        // Update lighting based on time of day
        this.updateLighting();
        
        // Update environment
        if (this.environment) {
            this.environment.updateSkyForDayNight(this.timeOfDay);
        }
        
        return this.timeOfDay;
    }
    
    updateLighting() {
        // Calculate light intensity based on time of day
        let sunIntensity, ambientIntensity, sunColor;
        
        if (this.timeOfDay < 0.25) { // Night
            sunIntensity = 0.1;
            ambientIntensity = 0.2;
            sunColor = 0x5555FF; // Blueish moonlight
        } else if (this.timeOfDay < 0.3) { // Dawn
            const t = (this.timeOfDay - 0.25) * 20;
            sunIntensity = 0.1 + t * 0.9;
            ambientIntensity = 0.2 + t * 0.5;
            sunColor = this.lerpColor(0x5555FF, 0xFFCCAA, t);
        } else if (this.timeOfDay < 0.7) { // Day
            sunIntensity = 1;
            ambientIntensity = 0.7;
            sunColor = 0xFFFFCC;
        } else if (this.timeOfDay < 0.75) { // Dusk
            const t = (this.timeOfDay - 0.7) * 20;
            sunIntensity = 1 - t * 0.9;
            ambientIntensity = 0.7 - t * 0.5;
            sunColor = this.lerpColor(0xFFFFCC, 0xFF5555, t);
        } else { // Night
            sunIntensity = 0.1;
            ambientIntensity = 0.2;
            sunColor = 0x5555FF;
        }
        
        // Update directional light (sun/moon)
        this.directionalLight.intensity = sunIntensity;
        this.directionalLight.color.set(sunColor);
        
        // Move the sun/moon
        const angle = this.timeOfDay * Math.PI * 2;
        this.directionalLight.position.x = Math.cos(angle) * 100;
        this.directionalLight.position.y = Math.sin(angle) * 100;
        
        // Update ambient light
        this.ambientLight.intensity = ambientIntensity;
        
        // Update building lights (only visible at night)
        const buildingLightIntensity = this.timeOfDay > 0.75 || this.timeOfDay < 0.3 ? 1 : 0;
        
        for (const light of this.buildingLights) {
            if (light.userData && light.userData.isWindow) {
                light.material.opacity = buildingLightIntensity * (Math.random() > 0.1 ? 1 : 0);
            } else {
                light.intensity = buildingLightIntensity * 2;
            }
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
