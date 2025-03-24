// Physics system using Cannon.js

class Physics {
    constructor() {
        // Initialize physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Earth gravity
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Store bodies and their corresponding meshes
        this.bodies = [];
        this.meshes = [];
        
        // Materials
        this.defaultMaterial = new CANNON.Material('default');
        this.playerMaterial = new CANNON.Material('player');
        
        // Contact materials
        const playerGroundContact = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.playerMaterial,
            {
                friction: 0.5,
                restitution: 0.3
            }
        );
        
        this.world.addContactMaterial(playerGroundContact);
    }
    
    // Create a box physics body
    createBox(width, height, depth, position, rotation = { x: 0, y: 0, z: 0 }, mass = 0, material = this.defaultMaterial) {
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: material
        });
        
        // Apply rotation if provided
        if (rotation) {
            body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
        }
        
        this.world.addBody(body);
        return body;
    }
    
    // Create a cylinder physics body (for pillars, pipes, etc.)
    createCylinder(radius, height, segments, position, rotation = { x: 0, y: 0, z: 0 }, mass = 0, material = this.defaultMaterial) {
        const shape = new CANNON.Cylinder(radius, radius, height, segments);
        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: material
        });
        
        // Rotate cylinder to stand upright (Cannon.js cylinders are along the y-axis)
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        
        // Apply additional rotation if provided
        if (rotation) {
            const q = new CANNON.Quaternion();
            q.setFromEuler(rotation.x, rotation.y, rotation.z);
            body.quaternion = body.quaternion.mult(q);
        }
        
        this.world.addBody(body);
        return body;
    }
    
    // Create a sphere physics body
    createSphere(radius, position, mass = 0, material = this.defaultMaterial) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: material
        });
        
        this.world.addBody(body);
        return body;
    }
    
    // Add a body and its corresponding mesh to the tracking arrays
    addBodyAndMesh(body, mesh) {
        this.bodies.push(body);
        this.meshes.push(mesh);
    }
    
    // Update physics and sync meshes with bodies
    update(delta) {
        // Step the physics world
        this.world.step(1/60);
        
        // Update meshes to match physics bodies
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const mesh = this.meshes[i];
            
            if (body && mesh) {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            }
        }
    }
    
    // Check if a ray intersects with any physics body
    raycast(from, to) {
        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(
            new CANNON.Vec3(from.x, from.y, from.z),
            new CANNON.Vec3(to.x, to.y, to.z),
            { skipBackfaces: true },
            result
        );
        
        return result;
    }
    
    // Create constraints between bodies (for clotheslines, cables, etc.)
    createConstraint(bodyA, bodyB, pivotA, pivotB) {
        const constraint = new CANNON.PointToPointConstraint(
            bodyA,
            new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
            bodyB,
            new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z)
        );
        
        this.world.addConstraint(constraint);
        return constraint;
    }
    
    // Remove a body from the physics world
    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.world.removeBody(body);
            this.bodies.splice(index, 1);
            this.meshes.splice(index, 1);
        }
    }
}

// Make the Physics class globally accessible
window.Physics = Physics;// Physics system using Cannon.js

// class Physics {
//     constructor() {
//         // Initialize physics world
//         this.world = new CANNON.World();
//         this.world.gravity.set(0, -9.82, 0); // Earth gravity
//         this.world.broadphase = new CANNON.NaiveBroadphase();
//         this.world.solver.iterations = 10;
        
//         // Store bodies and their corresponding meshes
//         this.bodies = [];
//         this.meshes = [];
        
//         // Materials
//         this.defaultMaterial = new CANNON.Material('default');
//         this.playerMaterial = new CANNON.Material('player');
        
//         // Contact materials
//         const playerGroundContact = new CANNON.ContactMaterial(
//             this.defaultMaterial,
//             this.playerMaterial,
//             {
//                 friction: 0.5,
//                 restitution: 0.3
//             }
//         );
        
//         this.world.addContactMaterial(playerGroundContact);
//     }
    
//     // Create a box physics body
//     createBox(width, height, depth, position, rotation = { x: 0, y: 0, z: 0 }, mass = 0, material = this.defaultMaterial) {
//         const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
//         const body = new CANNON.Body({
//             mass: mass,
//             position: new CANNON.Vec3(position.x, position.y, position.z),
//             shape: shape,
//             material: material
//         });
        
//         // Apply rotation if provided
//         if (rotation) {
//             body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
//         }
        
//         this.world.addBody(body);
//         return body;
//     }
    
//     // Create a cylinder physics body (for pillars, pipes, etc.)
//     createCylinder(radius, height, segments, position, rotation = { x: 0, y: 0, z: 0 }, mass = 0, material = this.defaultMaterial) {
//         const shape = new CANNON.Cylinder(radius, radius, height, segments);
//         const body = new CANNON.Body({
//             mass: mass,
//             position: new CANNON.Vec3(position.x, position.y, position.z),
//             shape: shape,
//             material: material
//         });
        
//         // Rotate cylinder to stand upright (Cannon.js cylinders are along the y-axis)
//         body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        
//         // Apply additional rotation if provided
//         if (rotation) {
//             const q = new CANNON.Quaternion();
//             q.setFromEuler(rotation.x, rotation.y, rotation.z);
//             body.quaternion = body.quaternion.mult(q);
//         }
        
//         this.world.addBody(body);
//         return body;
//     }
    
//     // Create a sphere physics body
//     createSphere(radius, position, mass = 0, material = this.defaultMaterial) {
//         const shape = new CANNON.Sphere(radius);
//         const body = new CANNON.Body({
//             mass: mass,
//             position: new CANNON.Vec3(position.x, position.y, position.z),
//             shape: shape,
//             material: material
//         });
        
//         this.world.addBody(body);
//         return body;
//     }
    
//     // Add a body and its corresponding mesh to the tracking arrays
//     addBodyAndMesh(body, mesh) {
//         this.bodies.push(body);
//         this.meshes.push(mesh);
//     }
    
//     // Update physics and sync meshes with bodies
//     update(delta) {
//         // Step the physics world
//         this.world.step(1/60);
        
//         // Update meshes to match physics bodies
//         for (let i = 0; i < this.bodies.length; i++) {
//             const body = this.bodies[i];
//             const mesh = this.meshes[i];
            
//             if (body && mesh) {
//                 mesh.position.copy(body.position);
//                 mesh.quaternion.copy(body.quaternion);
//             }
//         }
//     }
    
//     // Check if a ray intersects with any physics body
//     raycast(from, to) {
//         const result = new CANNON.RaycastResult();
//         this.world.raycastClosest(
//             new CANNON.Vec3(from.x, from.y, from.z),
//             new CANNON.Vec3(to.x, to.y, to.z),
//             { skipBackfaces: true },
//             result
//         );
        
//         return result;
//     }
    
//     // Create constraints between bodies (for clotheslines, cables, etc.)
//     createConstraint(bodyA, bodyB, pivotA, pivotB) {
//         const constraint = new CANNON.PointToPointConstraint(
//             bodyA,
//             new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
//             bodyB,
//             new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z)
//         );
        
//         this.world.addConstraint(constraint);
//         return constraint;
//     }
    
//     // Remove a body from the physics world
//     removeBody(body) {
//         const index = this.bodies.indexOf(body);
//         if (index !== -1) {
//             this.world.removeBody(body);
//             this.bodies.splice(index, 1);
//             this.meshes.splice(index, 1);
//         }
//     }
// }