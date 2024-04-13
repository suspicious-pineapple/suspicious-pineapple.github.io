


class ParticleSim{
    constructor(width, height){
        this.renderHeight = 800;
        this.renderWidth = 800;
        this.width = width;
        this.height = height;
        this.particleId = 1;
        
        this.offscreenCanvas = new OffscreenCanvas(this.renderWidth,this.renderHeight);
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');


        this.collisionMap = new Array(this.width);
        for (let i = 0; i < this.height; i++) {
            this.collisionMap[i] = new Array(this.height);
            for (let j = 0; j < this.height; j++) {
                this.collisionMap[i][j] = 0;
            }
        }

        this.particleData = new ArrayBuffer(width*height*Float32Array.BYTES_PER_ELEMENT*8);
        this.dataView = new Float32Array(this.particleData);
        //this.particleData = new ArrayBuffer(80000);
        this.cheatParticles = [];
    }

    calculateCollisionMap(){
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this.collisionMap[i][j] = 0;
            }
        }
        for(let id=0;id<this.particleId;id++){
            let particle = this.getParticle(id);
            
            if(particle == null||particle.dead==1) continue;

            let x = Math.floor(particle.x);
            let y = Math.floor(particle.y);
            if(x<0||x>=this.width||y<0||y>=this.height) {
                this.setParticle({id:particle.id,dead:1});
                continue;
            }
            this.collisionMap[x][y] = particle.id;
        }
    }




    getParticle(id){
        let start = id*8*Float32Array.BYTES_PER_ELEMENT;
        let end = start + 8*Float32Array.BYTES_PER_ELEMENT;
   
        let buffer = this.dataView;
        let identifier = buffer[start];
        let x = buffer[start+1];
        let y = buffer[start+2];
        let vx = buffer[start+3];
        let vy = buffer[start+4];
        let type = buffer[start+5];
        let state = buffer[start+6];
        let dead = buffer[start+7];


        return {x:x,y:y,vx:vx,vy:vy,type:type,id:identifier,state:state, dead:dead};
    }
    setParticle(data){
        
        let id = data.id;
        let start = id*8*Float32Array.BYTES_PER_ELEMENT;
        let end = start + 8*Float32Array.BYTES_PER_ELEMENT;
        let buffer = this.dataView;
        let oldX = buffer[start+1];
        let oldY = buffer[start+2];
        if(data.id!=null) buffer[start] = data.id;
        if(data.x!=null) buffer[start+1] = data.x;
        if(data.y!=null) buffer[start+2] = data.y;
        if(data.vx!=null) buffer[start+3] = data.vx;
        if(data.vy!=null) buffer[start+4] = data.vy;
        if(data.type!=null) buffer[start+5] = data.type;
        if(data.state!=null) buffer[start+6] = data.state;
        if(data.dead!=null) buffer[start+7] = data.dead;

        //move from collision map if needed
        if(oldX!=null&&oldY!=null){
            this.collisionMap[Math.floor(oldX)][Math.floor(oldY)] = 0;
        }

        //update collision map
        if(data.x!=null&&data.y!=null){
            this.collisionMap[Math.floor(data.x)][Math.floor(data.y)] = id;
        }


    }
    getId(){


        this.particleId++;
        return this.particleId;
    }



    renderImageData(ctx){
        let imageData = this.offscreenCtx.createImageData(this.width,this.height);
        
        //go through all id's and draw the pixels
        for(let id=0;id<this.particleId;id++){
            let particle = this.getParticle(id);

            if(particle==null||particle.type==0||particle.dead==1) continue;
            let x = Math.floor(particle.x);
            let y = Math.floor(this.height-particle.y);
            
            if(x<0||x>=this.width||y<0||y>=this.height) continue;
            let type = particle.type;
            let color = particleTypes[type].rgbColor;
            //invert y
            let index = (y*this.width+x)*4;
            imageData.data[index] = color[0];
            imageData.data[index+1] = color[1];
            imageData.data[index+2] = color[2];
            imageData.data[index+3] = 255;
        }



        this.offscreenCtx.fillColor = "black";
        this.offscreenCtx.fillRect(0,0,this.width,this.height);
        //zoom into the canvas
        this.offscreenCtx.putImageData(imageData,0,0);
        //ctx.scale(this.renderWidth/this.width,this.renderHeight/this.height);
        ctx.drawImage(this.offscreenCanvas,0,0);
        //ctx.scale(this.width/this.renderWidth,this.height/this.renderHeight);
        //scale back
    };
    update(){
        //this.calculateCollisionMap();
        
        //go through all id's and update the particles
        for(let id=0;id<this.particleId;id++){
            let particle = this.getParticle(id);
            if(particle==null) {continue};
            if(particle.type==0||particle.dead==1) continue;
            if(particleTypes[particle.type].moveable){
                this.updateParticle(particle);
            }
        }
    };

    checkDuplicates(){
        //go through all id's and check for duplicate coordinates
        for(let id=0;id<this.particleId;id++){
            let particle = this.getParticle(id);
            if(particle==null||particle.dead==1) continue;
            for(let id2=0;id2<this.particleId;id2++){
                if(id2==id) continue;
                let particle2 = this.getParticle(id2);
                if(particle2==null||particle2.dead==1) continue;
                if(particle.x==particle2.x&&particle.y==particle2.y){
                    console.log("Duplicate found",particle,particle2);
                }
            }
        }
    


    }



    addParticle(type,x,y){

        //check bounds
        if(x<0||x>=this.width||y<0||y>=this.height) {return;};

        //check existing particle
        let existingId = this.collisionMap[Math.floor(x)][Math.floor(y)];
        //skip if the particle is not dead
        if(existingId!=0){
            let existingParticle = this.getParticle(existingId);
            if(existingParticle.dead==0) return;
        
        }

        let id = this.getId();

        //check nan
        if(isNaN(x)||isNaN(y)) {console.log({type,x,y});return;};
        this.setParticle({id:id,x:x,y:y,type:type,dead:0,state:0});
        //set collision map
        this.collisionMap[Math.floor(x)][Math.floor(y)] = id;
    };

    logAllParticles(){
        //find non empty collision map cells
        let cells = [];
        for(let i=0;i<this.width;i++){
            for(let j=0;j<this.height;j++){
                if(this.collisionMap[i][j]!=0){
                    cells.push({x:i,y:j});
                }
            }
        }
        console.log(cells);

    }

    get particleCount(){

        let count = 0;
        for(let id=0;id<this.particleId;id++){
            let particle = this.getParticle(id);
            if(particle!=null&&particle.type!=0&&particle.dead==0) {count++};
        }
        return count;
    }
    getParticleAt(x,y){
        //check bounds
        if(x<0||x>=this.width||y<0||y>=this.height) {return null;};
        let id = this.collisionMap[Math.floor(x)][Math.floor(y)];
        if(id==0) return null;
        return this.getParticle(id);
    }

    updateParticle(particle){
        
        //get particle at own position, move out if there is a collision
        let existingId = this.getParticleAt(particle.x,particle.y);
        if(existingId!=null&&existingId.id!=particle.id&&existingId.id!=0&&existingId.dead==0){
            //console.log("Collision",existingId,particle.id);
            //randomly move to the left or right, or up or down
            let dx = Math.random()>0.5?1:-1;
            let dy = Math.random()>0.5?1:-1;
            let newX = particle.x+dx;
            let newY = particle.y+dy;
            particle.x = newX;
            particle.y = newY;
            particle.vx = dx;
            particle.vy = dy;
            this.setParticle(particle);
            return;
        }




        let oldX = particle.x;
        let oldY = particle.y;

        let thisType = particleTypes[particle.type];
        particle.vy -= thisType.gravity;
        particle.vx *= 1-thisType.drag;
        particle.vy *= 1-thisType.drag;
        particle.x += particle.vx;
        particle.y += particle.vy;
        //check bounds
        
        if(particle.x<0||particle.x>=this.width||particle.y<0||particle.y>=this.height) {
            this.setParticle({id:particle.id,dead:1});
            return;
        }


        let newX = particle.x;
        let newY = particle.y;
        let x = 0;
        let y = 0;
        //raycast to check for collisions
        let dx = newX-oldX;
        let dy = newY-oldY;
        let steps = Math.max(Math.abs(dx),Math.abs(dy));
        for(let i=0;i<steps;i++){
            x = (oldX+dx*i/steps);
            y = (oldY+dy*i/steps);
            let existingId = this.getParticleAt(x,y);
            if(existingId!=null&&existingId.id!=particle.id&&existingId.id!=0){
                particle.vx = 0;
                particle.vy = 0;
                //step backwards
                x = (oldX+dx*(i-1)/steps);
                y = (oldY+dy*(i-1)/steps);
                break;
            }
        }


        particle.x = x;
        particle.y = y;

        this.setParticle(particle);







    }








}


class BaseParticleType {
    constructor(name, color){
        this.name = name;
        this.color = color;
        this.rgbColor = color.match(/\d+/g);
        this.density = 3;
        this.moveable = true;
        this.slipperiness = 0.1;
        this.maxSupportMass = 9;
        this.gravity = 0.1;
        this.drag=0.001;
        
        this.state = "solid"; //solid, liquid, gas
    }
}


let emptyType = new BaseParticleType("empty","rgb(0,0,0)");
let sandType = new BaseParticleType("snad","rgb(190,170,0)");
let wallType = new BaseParticleType("wall","rgb(12,35,25)");
wallType.moveable = false;

let waterType = new BaseParticleType("water","rgb(35,15,255)");
waterType.density = 1;
waterType.moveable = true;
waterType.state = "liquid";

let particleTypes = [emptyType, sandType, waterType, wallType];






let gpu = new GPUJS({mode: 'webgl2'});
let renderKernel = gpu.createKernel(function(collisionData, typeColors){
//get id from 2d collision map
let type = collisionData[this.thread.x][this.thread.y];

function typeToColor(type){
let color = [0,0,0];
    //use constants to get the color
    color[0] = typeColors[type*3];
    color[1] = typeColors[type*3+1];
    color[2] = typeColors[type*3+2];

return color;
}

let color = typeToColor(type);

let astigmatismOffsetX = 4;
let astigmatismOffsetY = 6;
//check bounds
let astigX = this.thread.x+astigmatismOffsetX;
let astigY = this.thread.y+astigmatismOffsetY;
//if in bounds, get color
let astigColor = [0,0,0];
if(astigX>=0&&astigX<800&&astigY>=0&&astigY<800){
    astigColor = typeToColor(collisionData[astigX][astigY]);
}

color[0] += astigColor[0]/2;
color[1] += astigColor[1]/2;
color[2] += astigColor[2];



let sandCount = 0;
let waterCount = 0;
for(let i = -5;i<5;i++){
    for(let j = -5;j<5;j++){
        let x = this.thread.x+i;
        let y = this.thread.y+j;
        if(x<0||x>=800||y<0||y>=800) continue;
        let type = collisionData[x][y];
        if(type==1) sandCount++;
        if(type==2) waterCount++;
    }
}


color[0]+=Math.random()*sandCount*25;
color[1]+=Math.random()*waterCount*25;


if(sandCount>0&&waterCount>0){
    color[0] += sandCount/waterCount;
    color[1] += waterCount/sandCount;
}




this.color(color[0]/255,color[1]/255,color[2]/255);

}).setOutput([800,800]).setGraphical(true);


//setConstants for the types and colors
let typeColors = new Array(particleTypes.length*3);
for(let i = 0; i < particleTypes.length; i++){
    let type = particleTypes[i];
    let color = type.rgbColor;
    typeColors[i*3] = color[0];
    typeColors[i*3+1] = color[1];
    typeColors[i*3+2] = color[2];
}
//console.log(typeColors);
//renderKernel.setConstants({typeColors:typeColors});



//appends the canvas to the body
function renderGPU(particlesim){
    //translate the collision map to a 2d array of types
    let cmap = new Array(particlesim.width);
    for (let i = 0; i < particlesim.width; i++) {
        cmap[i] = new Array(particlesim.height);
        for (let j = 0; j < particlesim.height; j++) {
            //check if null else set to 0
            //cmap[i][j] = particlesim.getParticleAt(i,j).type;
            //avoid null
            if(particlesim.getParticleAt(i,j)==null){
                cmap[i][j] = 0;
            } else {
                cmap[i][j] = particlesim.getParticleAt(i,j).type;
            }
        }
    }

    renderKernel(cmap, typeColors);
    //print that onto gamectx
    let canvas = renderKernel.canvas;
    gamectx.drawImage(canvas,0,0);

}
