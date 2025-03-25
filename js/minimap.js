class Minimap {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 200;
        this.canvas.height = 200;
        
        this.scale = 0.5; // Scale factor for map objects
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Map colors
        this.colors = {
            background: '#111',
            player: '#ff0000',
            building: '#888888',
            collectible: '#ffd700',
            hazard: '#ff3333',
            jumpPad: '#00ff00'
        };
        
        console.log("Minimap initialized", this.canvas.width, this.canvas.height);
    }
    
    update() {
        if (!this.ctx) {
            console.error("No context for minimap");
            return;
        }
        
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get player position as center reference
        if (!this.game.player || !this.game.player.mesh) {
            console.error("Player not available for minimap");
            return;
        }
        
        const playerX = this.game.player.mesh.position.x;
        const playerZ = this.game.player.mesh.position.z;
        
        // Draw buildings
        this.ctx.fillStyle = this.colors.building;
        for (const building of this.game.environment.buildings) {
            // Calculate building position relative to player
            const relX = (building.position.x - playerX) * this.scale + this.centerX;
            const relZ = (building.position.z - playerZ) * this.scale + this.centerY;
            
            // Calculate building dimensions on minimap
            const width = building.geometry.parameters.width * this.scale;
            const depth = building.geometry.parameters.depth * this.scale;
            
            // Draw building if it's within minimap bounds
            if (relX + width/2 > 0 && relX - width/2 < this.canvas.width &&
                relZ + depth/2 > 0 && relZ - depth/2 < this.canvas.height) {
                this.ctx.fillRect(relX - width/2, relZ - depth/2, width, depth);
            }
        }
        
        // Draw collectibles if available
        if (this.game.obstacleManager && this.game.obstacleManager.collectibles) {
            this.ctx.fillStyle = this.colors.collectible;
            for (const collectible of this.game.obstacleManager.collectibles) {
                if (!collectible.visible) continue;
                
                const relX = (collectible.position.x - playerX) * this.scale + this.centerX;
                const relZ = (collectible.position.z - playerZ) * this.scale + this.centerY;
                
                if (relX > 0 && relX < this.canvas.width && relZ > 0 && relZ < this.canvas.height) {
                    this.ctx.beginPath();
                    this.ctx.arc(relX, relZ, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Draw jump pads and hazards if available
        if (this.game.obstacleManager && this.game.obstacleManager.obstacles) {
            // Draw jump pads
            this.ctx.fillStyle = this.colors.jumpPad;
            for (const obstacle of this.game.obstacleManager.obstacles) {
                if (obstacle.userData && obstacle.userData.type === 'jumpPad') {
                    const relX = (obstacle.position.x - playerX) * this.scale + this.centerX;
                    const relZ = (obstacle.position.z - playerZ) * this.scale + this.centerY;
                    
                    if (relX > 0 && relX < this.canvas.width && relZ > 0 && relZ < this.canvas.height) {
                        this.ctx.beginPath();
                        this.ctx.arc(relX, relZ, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
            
            // Draw hazards
            this.ctx.fillStyle = this.colors.hazard;
            for (const obstacle of this.game.obstacleManager.obstacles) {
                if (obstacle.userData && obstacle.userData.type === 'hazard') {
                    const relX = (obstacle.position.x - playerX) * this.scale + this.centerX;
                    const relZ = (obstacle.position.z - playerZ) * this.scale + this.centerY;
                    
                    if (relX > 0 && relX < this.canvas.width && relZ > 0 && relZ < this.canvas.height) {
                        this.ctx.beginPath();
                        this.ctx.arc(relX, relZ, 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }
        
        // Draw player (always in center)
        this.ctx.fillStyle = this.colors.player;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player direction indicator
        const directionLength = 8;
        const playerAngle = Math.atan2(
            -this.game.player.velocity.z,
            this.game.player.velocity.x
        );
        
        if (this.game.player.velocity.x !== 0 || this.game.player.velocity.z !== 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(
                this.centerX + Math.cos(playerAngle) * directionLength,
                this.centerY + Math.sin(playerAngle) * directionLength
            );
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Draw minimap border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
