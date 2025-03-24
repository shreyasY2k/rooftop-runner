// Day/night cycle system

class DayNightCycle {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        
        // Time settings
        this.dayDuration = 180; // seconds for a full day-night cycle
        this.timeOfDay = 0.3; // Start at morning (0-1 range)
        
        // Create lights
        this.createLights();
        
        // Set initial lighting state
        this.updateLighting();
    }
    
    createLights() {
        // Create sun (directional light)
        this.sunLight = new THREE.DirectionalLight(0xFFFFAA, 1);
        this.sunLight.position.set(0, 100, 0);
        this.sunLight.castShadow = true;
        
        // Configure shadow properties
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.sunLight);
        
        // Create moon (second directional light)
        this.moonLight = new THREE.DirectionalLight(0x4169E1, 0.2);
        this.moonLight.position.set(0, -100, 0);
        this.scene.add(this.moonLight);
        
        // Create ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.ambientLight);
    }
    
    update(delta) {
        // Update time of day
        this.timeOfDay += delta / this.dayDuration;
        if (this.timeOfDay >= 1) {
            this.timeOfDay -= 1;
        }
        
        // Update lighting based on time of day
        this.updateLighting();
    }
    
    updateLighting() {
        // Calculate sun position based on time of day (0-1)
        const theta = Math.PI * 2 * this.timeOfDay;
        const phi = Math.PI / 3; // Sun/moon elevation angle
        
        // Calculate sun position
        const sunX = Math.cos(theta) * 100;
        const sunY = Math.sin(theta) * 100;
        const sunZ = Math.sin(phi) * 50;
        
        this.sunLight.position.set(sunX, sunY, sunZ);
        
        // Moon is opposite to sun
        this.moonLight.position.set(-sunX, -sunY, -sunZ);
        
        // Adjust light intensities based on time of day
        const dayness = this.getDayness(this.timeOfDay);
        const nightness = 1 - dayness;
        
        // Update light intensities
        this.sunLight.intensity = dayness * 1.2;
        this.moonLight.intensity = nightness * 0.3;
        
        // Change ambient light color and intensity based on time of day
        if (dayness > 0.8) {
            // Day
            this.ambientLight.color.setHex(0x9AAABF);
            this.ambientLight.intensity = 0.7;
        } else if (dayness > 0.3) {
            // Sunrise/sunset
            const t = (dayness - 0.3) / 0.5;
            const color = this.lerpColor(0x664A38, 0x9AAABF, t);
            this.ambientLight.color.setHex(color);
            this.ambientLight.intensity = 0.3 + t * 0.4;
        } else {
            // Night
            this.ambientLight.color.setHex(0x1A2235);
            this.ambientLight.intensity = 0.3;
        }
        
        // Update scene background color based on time of day
        if (dayness > 0.8) {
            // Day - blue sky
            this.scene.background = new THREE.Color(0x87CEEB);
        } else if (dayness > 0.3) {
            // Sunrise/sunset - orange/pink sky
            const t = (dayness - 0.3) / 0.5;
            const color = this.lerpColor(0xFF7F50, 0x87CEEB, t);
            this.scene.background = new THREE.Color(color);
        } else {
            // Night - dark blue sky
            this.scene.background = new THREE.Color(0x1A2235);
        }
        
        // Update renderer to match lighting
        this.updateRenderer(dayness);
        
        // Add fog based on time of day
        if (dayness < 0.3) {
            // Night fog
            this.scene.fog = new THREE.Fog(0x1A2235, 10, 100);
        } else if (dayness < 0.4) {
            // Dawn fog (thicker)
            this.scene.fog = new THREE.Fog(0x8D959C, 5, 80);
        } else if (dayness > 0.9) {
            // Dusk fog
            this.scene.fog = new THREE.Fog(0x9EABB9, 10, 100);
        } else {
            // Day (no fog)
            this.scene.fog = null;
        }
    }
    
    updateRenderer(dayness) {
        // Adjust tone mapping based on time of day
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        
        if (dayness > 0.8) {
            // Bright day
            this.renderer.toneMappingExposure = 1.0;
        } else if (dayness > 0.3) {
            // Sunrise/sunset - warmer tones
            this.renderer.toneMappingExposure = 1.2;
        } else {
            // Night - lower exposure
            this.renderer.toneMappingExposure = 0.7;
        }
    }
    
    getDayness(timeOfDay) {
        // Calculate how "daytime" it is on a scale of 0-1
        // 0 is middle of night, 1 is middle of day
        
        // Define sunrise and sunset times (in 0-1 range)
        const sunrise = 0.25; // 6 AM
        const sunset = 0.75;  // 6 PM
        
        if (timeOfDay > sunrise && timeOfDay < sunset) {
            // Day time
            // Map from sunrise-sunset to 0-1-0
            if (timeOfDay < (sunrise + sunset) / 2) {
                // Morning: sunrise to noon
                return (timeOfDay - sunrise) / (sunset - sunrise) * 2;
            } else {
                // Afternoon: noon to sunset
                return 1 - (timeOfDay - (sunrise + sunset) / 2) / (sunset - sunrise) * 2;
            }
        } else {
            // Night time
            if (timeOfDay < sunrise) {
                // Late night to sunrise
                return (timeOfDay / sunrise) * 0.3;
            } else {
                // Sunset to late night
                return ((1 - timeOfDay) / (1 - sunset)) * 0.3;
            }
        }
    }
    
    lerpColor(colorA, colorB, t) {
        // Linearly interpolate between two hex colors
        const a = new THREE.Color(colorA);
        const b = new THREE.Color(colorB);
        
        const r = a.r + (b.r - a.r) * t;
        const g = a.g + (b.g - a.g) * t;
        const b_value = a.b + (b.b - a.b) * t;
        
        const result = new THREE.Color(r, g, b_value);
        return result.getHex();
    }
    
    // Get the current time of day as a formatted string (for UI)
    getTimeString() {
        // Map the 0-1 range to 24 hours
        const hours = Math.floor(this.timeOfDay * 24);
        const minutes = Math.floor((this.timeOfDay * 24 * 60) % 60);
        
        // Format as HH:MM
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        
        return `${formattedHours}:${formattedMinutes}`;
    }
}

window.DayNightCycle = DayNightCycle;