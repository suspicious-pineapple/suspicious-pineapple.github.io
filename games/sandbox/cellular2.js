
let offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = 800;
offscreenCanvas.height = 800;
        
let offscreenCtx = offscreenCanvas.getContext('2d');

class GridCell {
    constructor(parent,x,y){
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.particle = null;
    }

}

class BaseParticle {
    constructor(parent,type,x,y){
        this.sim = parent;
        //get the cell of the initial position
        let cell = this.sim.grid[Math.floor(x)][Math.floor(y)];
        this.cell = cell;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.x = x;
        this.y = y;
    }
    update(){
        let oldX = this.x;
        let oldY = this.y;
        if(this.type.moveable == false){ return; };
        //apply gravity if cell below is empty
        if(this.sim.getParticle(this.x,this.y-1) == null){
            this.vy -= 0.1;
        }
        this.x += this.vx;
        this.y += this.vy;

        //if cell y is 0, stop
        if(this.y < 0){
            this.y = 0;
            this.vy = 0;
        }
        //if cell y is height, stop
        if(this.y > this.sim.height){
            this.y = this.sim.height;
            this.vy = 0;
        }
        //if cell x is 0, stop
        if(this.x < 0){
            this.x = 0;
            this.vx = 0;
        }
        //if cell x is width, stop
        if(this.x > this.sim.width){
            this.x = this.sim.width;
            this.vx = 0;
        }

        if(this.type.solid == false&&this.sim.getParticle(this.x,this.y-1) != null){
            

            
            //if water is below 
            if(this.sim.getParticle(this.x,this.y-1).type.name == "water"){
                //if water on one side but not the other, apply force to move
                let waterLeft = this.sim.getParticle(this.x-1,this.y-1) != null && this.sim.getParticle(this.x-1,this.y-1).type.name == "water";
                let waterRight = this.sim.getParticle(this.x+1,this.y-1) != null && this.sim.getParticle(this.x+1,this.y-1).type.name == "water";


                if(waterLeft && !waterRight){
                    this.vx += this.type.slipperiness*Math.random();
                }
                if(waterRight && !waterLeft){
                    this.vx -= this.type.slipperiness*Math.random();
                }
            } 

            //try move left or right, randomly, if touching another non-solid particle
            let particlesSurrounding = [this.sim.getParticle(this.x-1,this.y),this.sim.getParticle(this.x+1,this.y),this.sim.getParticle(this.x,this.y+1),this.sim.getParticle(this.x,this.y-1)];
            let moveableParticles = particlesSurrounding.filter(p => p != null && p.type.solid == false);
            if(moveableParticles.length > 0){
            let xDir = Math.random() < 0.5 ? -1 : 1;
            if(this.sim.getParticle(this.x-xDir,this.y) == null){
                this.x -= xDir;
            } else if(this.sim.getParticle(this.x+xDir,this.y) == null){
                this.x += xDir;
            }
            }


        }
        if(Math.random() < this.type.slipperiness){    
                //check mass of all particles above this until a null particle is found
                let mass = 0;
                let currentY = Math.floor(this.y);
                while(this.sim.getParticle(this.x,currentY) != null && mass < this.type.maxSupportMass && this.sim.getParticle(this.x,currentY).type.moveable==true){
                    mass += this.sim.getParticle(this.x,currentY).type.density;
                    currentY++;
                }
                if(mass < this.type.maxSupportMass){
                    //check if cell left or right is empty
                    let xDir = Math.random() < 0.5 ? -1 : 1;
                    if(this.sim.getParticle(this.x-xDir,this.y) == null){
                        this.x -= xDir;
                    } else if(this.sim.getParticle(this.x+xDir,this.y) == null){
                        this.x += xDir;
                    }
                }
                

        
        }







        //console.log("x: " + this.x + " y: " + this.y);
        //check bounds before setting new cell
        //check x
        if(this.x < 0){
            this.x = 0;
            this.vx = 0;
        }
        if(this.x >= this.sim.width){
            this.x = this.sim.width-1;
            this.vx = 0;
        }
        //check y
        if(this.y < 0){
            this.y = 0;
            this.vy = 0;
        }
        if(this.y >= this.sim.height){
            this.y = this.sim.height-1;
            this.vy = 0;
        }


        
        
        
        //let newCell = this.sim.grid[Math.floor(this.x)][Math.floor(this.y)];

        //get newCell by raycasting from old xy to new xy

        let newCellX = Math.floor(this.x);
        let newCellY = Math.floor(this.y);
        let oldCellX = Math.floor(oldX);
        let oldCellY = Math.floor(oldY);
        let dx = newCellX-oldCellX;
        let dy = newCellY-oldCellY;


        let steps = Math.abs(dx)+Math.abs(dy);
        let xStep = dx/steps;
        let yStep = dy/steps;
        let newCell = this.sim.getCell(oldCellX,oldCellY);
        for(let i = 0; i < steps; i++){
            newCell = this.sim.getCell(oldCellX+xStep*i,oldCellY+yStep*i);
            if(newCell.particle != null&&newCell!=this.cell){
                break;
            }

        }

        
        if(newCell!==this.cell){



        if(newCell.particle == null){
            let tmp = newCell.particle;
            newCell.particle = this;
            this.cell.particle = tmp;
            this.cell = newCell;
        } else {
        
            //console.log(newCell);
            this.x = this.cell.x;
            this.y = this.cell.y;
            //this.vx = 0;
            //this.vy = 0;
            //swap velocities, if moveable
            if(newCell.particle.type.moveable){
                
                let temp = this.vx;
                this.vx = newCell.particle.vx;
                newCell.particle.vx;
                temp = this.vy;
                this.vy = newCell.particle.vy;
                newCell.particle.vy = temp;
                
                
            }   
            else {
                this.vx = 0;
                this.vy = 0;
            }         
            }
        }
    }
    
    render(ctx,x,y){
        ctx.fillStyle = this.type.color;
        ctx.fillRect(x,y,1,1);
        
        //draw a line for velocity
        ctx.strokeStyle = "rgb(255,0,0)";
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x+this.vx*0.5,y+this.vy*0.5);
        ctx.stroke();

    }
}


class BaseParticleType {
    constructor(name, color){
        this.name = name;
        this.color = color;
        this.density = 2;
        this.moveable = true;
        this.slipperiness = 0.1;
        this.maxSupportMass = 4;
        this.solid = true;
    }
}
let particleTypes = [];
particleTypes["sand"] = new BaseParticleType("sand", "rgb(125,105,0)");

particleTypes["water"] = new BaseParticleType("water", "rgb(0,0,255)");
particleTypes.water.slipperiness = 3;
particleTypes.water.density = 1;
particleTypes.water.maxSupportMass = 1;
particleTypes.water.solid = false;

particleTypes["wall"] = new BaseParticleType("stone", "rgb(100,100,100)");
particleTypes.wall.moveable = false;
particleTypes.wall.density = 10;
particleTypes.wall.solid = true;




class ParticleSim{
    constructor(width,height){
        this.width = width;
        this.height = height;
        this.grid = [];
        for(let i = 0; i < width; i++){
            this.grid.push([]);
            for(let j = 0; j < height; j++){
                this.grid[i].push(new GridCell(this,i,j));
            }
        }
        this.renderWidth = 800;
        this.renderHeight = 800;
    }

    render(ctx){
        //reset transform
        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(this.renderWidth/this.width,this.renderHeight/this.height);
        
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        
        for(let i = 0; i < this.width; i++){
            for(let j = 0; j < this.height; j++){
                if(this.grid[i][j].particle != null){
                    this.grid[i][j].particle.render(ctx,i,this.height-j);
                } else {
                    
                }
            }
        }
    }
    renderImageData(ctxmain){
        let ctx = offscreenCtx;
        
        let imageData = ctx.createImageData(this.width,this.height);
        for(let i = 0; i < this.width; i++){
            for(let j = 0; j < this.height; j++){
                if(this.grid[i][j].particle != null){
                    let index = ((this.height-j)*this.width+i)*4;
                    //get rgb from color string/name
                    let color = this.grid[i][j].particle.type.color; //rgb string
                    let rgb = color.match(/\d+/g);
                    imageData.data[index] = rgb[0];
                    imageData.data[index+1] = rgb[1];
                    imageData.data[index+2] = rgb[2];
                    
                    imageData.data[index+3] = 255;
                }
                }
            }

        //ctx.putImageData(imageData,0,0);
        ctxmain.setTransform(1,0,0,1,0,0);
        offscreenCtx.putImageData(imageData,0,0);
        ctxmain.scale(this.renderWidth/this.width,this.renderHeight/this.height);
        ctxmain.drawImage(offscreenCanvas,0,0,ctx.canvas.width,ctx.canvas.height);

        }


    update(){
        
        for(let i = 0; i < this.width; i++){
            for(let j = 0; j < this.height; j++){
                if(this.grid[i][j].particle != null){
                    this.grid[i][j].particle.update();
                }
            }
        }
        
        //randomize order of update but update all particles
        /*
        let order = [];
        for(let i = 0; i < this.width; i++){
            for(let j = 0; j < this.height; j++){
                if(this.grid[i][j].particle != null){
                    order.push(this.grid[i][j].particle);
                }
            }
        }
        order.sort(function(a,b){
            return 0.5 - Math.random();
        });
        for(let i = 0; i < order.length; i++){
            order[i].update();
        }
        */


    }

    addParticle(type,x,y){
        this.grid[x][y].particle = new BaseParticle(this,type,x,y);
    }

    getParticle(x,y){
        //floor and do bounds checking
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return null;
        }
        return this.grid[Math.floor(x)][Math.floor(y)].particle;
    }
    getCell(x,y){
        //floor and do bounds checking
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return null;
        }
        return this.grid[Math.floor(x)][Math.floor(y)];
    }

}





