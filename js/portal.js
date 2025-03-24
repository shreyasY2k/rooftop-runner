// Vibeverse portal functionality

let portal = {
    mesh: null,
    light: null,
    particles: [],
    playerInRange: false
};

// Initialize the portal
function initPortal(scene, world) {
    // Find a suitable building for the portal
    const building = findPortalBuilding(world);
    
    // Calculate position (on a suitable rooftop)
    const position = {
        x: building.position.x,
        y: building.position.y + building.height + 0.5,
        z: building.position.z
    };
    
    createPortalMesh(scene, position);
    createPortalLight(scene, position);
    createPortalParticles(scene, position);
    
    // Add portal info element
    portal.infoElement = document.getElementById('portal-info');
}

// ... [rest of the portal functions]

// Make the portal functions globally accessible
window.initPortal = initPortal;
window.updatePortal = updatePortal;
window.isNearPortal = isNearPortal;
window.enterPortal = enterPortal;

// Find a suitable building for placing the portal
function findPortalBuilding(world) {
    // Look for a tall, central building
    let bestBuilding = null;
    let highestScore = -Infinity;
    
    world.buildings.forEach(building => {
        // Score is based on height and proximity to center
        const distanceToCenter = Math.sqrt(
            Math.pow(building.position.x, 2) + 
            Math.pow(building.position.z, 2)
        );
        
        // Prioritize tall buildings close to the center
        const score = building.height - distanceToCenter * 0.5;
        
        // Ensure building is large enough for the portal
        if (building.size.width > 8 && building.size.depth > 8) {
            if (score > highestScore) {
                highestScore = score;
                bestBuilding = building;
            }
        }
    });
    
    // If no suitable building found, use the first building
    return bestBuilding || world.buildings[0];
}

// Create the portal mesh
function createPortalMesh(scene, position) {
    // Create portal ring
    const ringGeometry = new THREE.TorusGeometry(2, 0.3, 16, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x9C27B0,
        emissive: 0x6A1B9A,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
    });
    
    portal.mesh = new THREE.Mesh(ringGeometry, ringMaterial);
    portal.mesh.position.set(position.x, position.y + 2, position.z);
    portal.mesh.rotation.x = Math.PI / 2; // Make it horizontal
    scene.add(portal.mesh);
    
    // Create portal center (swirling effect)
    const centerGeometry = new THREE.CircleGeometry(1.7, 32);
    const centerMaterial = new THREE.MeshBasicMaterial({
        color: 0xE1BEE7,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    portal.center = new THREE.Mesh(centerGeometry, centerMaterial);
    portal.center.position.set(position.x, position.y + 2.05, position.z);
    portal.center.rotation.x = Math.PI / 2; // Make it horizontal
    scene.add(portal.center);
    
    // Add a base platform for the portal
    const baseGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x7B1FA2,
        metalness: 0.6,
        roughness: 0.3
    });
    
    portal.base = new THREE.Mesh(baseGeometry, baseMaterial);
    portal.base.position.set(position.x, position.y + 0.25, position.z);
    scene.add(portal.base);
    
    // Add runes/symbols to the base
    const runeGeometry = new THREE.CircleGeometry(2.2, 32);
    const runeMaterial = new THREE.MeshBasicMaterial({
        color: 0xE040FB,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    portal.runes = new THREE.Mesh(runeGeometry, runeMaterial);
    portal.runes.position.set(position.x, position.y + 0.51, position.z);
    portal.runes.rotation.x = -Math.PI / 2; // Make it horizontal
    scene.add(portal.runes);
    
    // Add a label
    createPortalLabel(scene, position);
}

// Create the portal light
function createPortalLight(scene, position) {
    // Add a point light
    portal.light = new THREE.PointLight(0xAA00FF, 2, 10);
    portal.light.position.set(position.x, position.y + 2, position.z);
    scene.add(portal.light);
}

// Create portal particles
function createPortalParticles(scene, position) {
    // Create particles that orbit the portal
    const numParticles = 50;
    
    for (let i = 0; i < numParticles; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xE1BEE7,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Set initial position in a circle around the portal
        const angle = (i / numParticles) * Math.PI * 2;
        const radius = 2 + Math.random() * 0.5;
        
        particle.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + 2 + (Math.random() - 0.5) * 0.5,
            position.z + Math.sin(angle) * radius
        );
        
        // Store animation properties
        particle.userData = {
            angle: angle,
            radius: radius,
            speed: 0.5 + Math.random() * 0.5,
            baseY: position.y + 2,
            ySpeed: 0.2 + Math.random() * 0.3,
            yOffset: Math.random() * Math.PI * 2
        };
        
        scene.add(particle);
        portal.particles.push(particle);
    }
}

// Create a floating label for the portal
function createPortalLabel(scene, position) {
    // Create a canvas for the text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#E040FB';
    context.font = 'bold 60px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('VIBEVERSE PORTAL', canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create a plane with the texture
    const labelGeometry = new THREE.PlaneGeometry(4, 1);
    const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    portal.label = new THREE.Mesh(labelGeometry, labelMaterial);
    portal.label.position.set(position.x, position.y + 4, position.z);
    
    scene.add(portal.label);
}

// Update the portal
function updatePortal(delta, player) {
    // Rotate the portal ring
    if (portal.mesh) {
        portal.mesh.rotation.z += delta * 0.5;
    }
    
    // Rotate the portal runes
    if (portal.runes) {
        portal.runes.rotation.z -= delta * 0.2;
    }
    
    // Animate the portal label to face the player
    if (portal.label && player) {
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, portal.label.position).normalize();
        direction.y = 0; // Keep it horizontal
        
        // Create a temporary look-at matrix
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(
            portal.label.position,
            new THREE.Vector3(player.position.x, portal.label.position.y, player.position.z),
            new THREE.Vector3(0, 1, 0)
        );
        
        // Apply the rotation from the look-at matrix
        portal.label.quaternion.setFromRotationMatrix(lookAtMatrix);
    }
    
    // Update particles
    portal.particles.forEach(particle => {
        // Update angle
        particle.userData.angle += delta * particle.userData.speed;
        
        // Calculate new position
        const newX = portal.mesh.position.x + Math.cos(particle.userData.angle) * particle.userData.radius;
        const newY = particle.userData.baseY + Math.sin(particle.userData.yOffset + Date.now() * 0.001 * particle.userData.ySpeed) * 0.3;
        const newZ = portal.mesh.position.z + Math.sin(particle.userData.angle) * particle.userData.radius;
        
        particle.position.set(newX, newY, newZ);
        
        // Pulse particle size
        const scale = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
        particle.scale.set(scale, scale, scale);
    });
    
    // Pulse light intensity
    if (portal.light) {
        portal.light.intensity = 1.5 + Math.sin(Date.now() * 0.002) * 0.5;
    }
    
    // Check if player is near portal
    if (player) {
        const distanceToPortal = new THREE.Vector3(
            portal.mesh.position.x - player.position.x,
            portal.mesh.position.y - player.position.y,
            portal.mesh.position.z - player.position.z
        ).length();
        
        // If player is near portal
        if (distanceToPortal < 5) {
            if (!portal.playerInRange) {
                // Player just entered range
                portal.playerInRange = true;
                showPortalInfo();
            }
        } else {
            if (portal.playerInRange) {
                // Player just left range
                portal.playerInRange = false;
                hidePortalInfo();
            }
        }
    }
}

// Show portal interaction info
function showPortalInfo() {
    portal.infoElement.style.opacity = "1";
}

// Hide portal interaction info
function hidePortalInfo() {
    portal.infoElement.style.opacity = "0";
}

// Enter portal function
function enterPortal() {
    if (portal.playerInRange) {
        // Get player data
        const playerData = {
            username: game.username || 'Runner',
            color: game.playerColor || 'blue',
            speed: game.player.sprintSpeed,
            ref: window.location.href
        };
        
        // Construct portal URL with parameters
        let portalUrl = 'http://portal.pieter.com/?';
        portalUrl += `username=${encodeURIComponent(playerData.username)}`;
        portalUrl += `&color=${encodeURIComponent(playerData.color)}`;
        portalUrl += `&speed=${encodeURIComponent(playerData.speed)}`;
        portalUrl += `&ref=${encodeURIComponent(playerData.ref)}`;
        
        // Redirect to portal
        window.location.href = portalUrl;
    }
}

// Check if player is near portal
function isNearPortal(position) {
    if (!portal.mesh) return false;
    
    const distanceToPortal = new THREE.Vector3(
        portal.mesh.position.x - position.x,
        portal.mesh.position.y - position.y,
        portal.mesh.position.z - position.z
    ).length();
    
    return distanceToPortal < 3;
}