const Vars = {};
//Vars.world = new world(64,64);


class world{
    constructor(width, height){
        this.width=width; //width and height of the world in tiles
        this.height=height;
        this.clusters = [];
    }
    update(delta){

        //check for collisions
        for(let i=0; i<this.clusters.length; i++){
            for(let j=i+1; j<this.clusters.length; j++){
                //check maxSpan of both, if the distance is smaller than the sum, check for collision
                this.clusters[i].checkCollision(this.clusters[j]);
                this.clusters[j].checkCollision(this.clusters[i]);
                }
            }
        

        for(let i=0; i<this.clusters.length; i++){
        this.clusters[i].update(delta);
    }
}
}


class vector{
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
    get radius(){
        return Math.sqrt(this.x*this.x+this.y*this.y);
    }
    set radius(length){
        let angle = this.angle;
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
    }
    get angle(){
        return Math.atan2(this.y,this.x);
    }
    set angle(angle){
        let length = this.radius;
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
    }
    distanceTo(pos){
        return Math.sqrt(Math.pow(this.x-pos.x,2)+Math.pow(this.y-pos.y,2));
    }
    angleTo(pos){
        return Math.atan2(pos.y-this.y,pos.x-this.x);
    }
    relativeTo(pos){
        return new vector(this.x-pos.x,this.y-pos.y);
    }
    polarTranslate(angle,distance){
        return new vector(this.x+Math.cos(angle)*distance,this.y+Math.sin(angle)*distance);
    }
    add(v){
        return new vector(this.x+v.x,this.y+v.y);
    }
    subtract(v){
        return new vector(this.x-v.x,this.y-v.y);
    }
    rotate(angle){
        return new vector(this.x*Math.cos(angle)-this.y*Math.sin(angle),this.x*Math.sin(angle)+this.y*Math.cos(angle));
    }
    multiplyScalar(scalar){
        return new vector(this.x*scalar,this.y*scalar);
    }
    normalize(){
        let length = this.radius;
        return new vector(this.x/length,this.y/length);
    }
    dot(v){
        return this.x*v.x+this.y*v.y;
    }
    clone(){
        return new vector(this.x,this.y);
    }
    cross(v){
        return this.x*v.y-this.y*v.x;
    }
}


class clusterPart {
    constructor(parent,type="ohno",x=0,y=0,rotation=0,mass=1){
        this.id=Math.floor(Math.random()*1000000);
        this.pos = new vector(x,y);
        this.rotation = rotation;
        this.mass = mass;
        this.type = type;
        this.parent = parent;
        this.size = 32;
    }
    globalPosition(){
        //rotate around parent's center of mass
        let pos = this.pos.clone();
        //add parent's center of mass
        pos = pos.rotate(this.parent.angle);
        pos = pos.relativeTo(this.parent.CenterOfMass.rotate(this.parent.angle));
        pos = pos.add(this.parent.pos);
        return pos;
    }
    fromJSON(json){
        let newPart = new clusterPart({},json.type,json.pos.x,json.pos.y,json.rotation,json.mass);
        newPart.id = json.id;
        return newPart;
    }
    getForce(other){
        let force = new vector(0,0);
        let dist = 9000;
        if(other instanceof clusterPart && other.parent.id != this.parent.id){
            dist = this.globalPosition().distanceTo(other.globalPosition());
            dist = dist * 0.9;
            let forceMag = other.parent.totalMass/dist;
            force = this.globalPosition().relativeTo(other.globalPosition());
            force = force.normalize();
            force = force.multiplyScalar(forceMag);
        }
        //if too far away, don't bother
        if(dist > this.size/32){
            return new vector(0,0);
        }
        return force;
    }
}

class cluster {
    constructor(pos, id){
        this.pos=pos;
        this.angle = 0;
        this.angleRate = 0;
        this.vel = new vector(0,0);
        this.accel = new vector(0,0);
        this.angularAccel = 0;
        this.id=id;
        this.members=[];
        this.lastDelta = 0;
        this.forceVisualPos = new vector(0,0);
        this.forceVisual = new vector(0,0);
        this.maxSpan = 0;
        this.CenterOfMass = new vector(0,0);
        this.totalMass = 0;
    }
    addPart(part){
        this.members.push(part);
        part.parent = this;
        this.maxSpan = Math.max(this.maxSpan,part.pos.distanceTo(this.CenterOfMass));
        this.totalMass = this.getTotalMass();
        this.CenterOfMass = this.getCenterOfMass();
    }


    getMaxSpan(){
        //get furthest distance from origin
        let max = 0;
        for(let i=0; i<this.members.length; i++){
            let dist = this.members[i].pos.distanceTo(new vector(0,0));
            if(dist > max){
                max = dist;
            }
        }
        return max;
    }

    getTotalMass(){
        let mass=0;
        for(let i=0; i<this.members.length; i++){
            mass+=this.members[i].mass;
        }
        return mass;
    }
    getCenterOfMass(){ //center of mass in local coordinates
        let x=0;
        let y=0;
        let totalMass=this.totalMass;
        for(let i=0; i<this.members.length; i++){
            x+=this.members[i].pos.x*(this.members[i].mass/totalMass);
            y+=this.members[i].pos.y*(this.members[i].mass/totalMass);
        }
        return new vector(x,y);
    }
    applyForce(pos,force){
        let forcePos = pos.rotate(-this.angle);
        forcePos = pos.relativeTo(this.CenterOfMass);
        //get torque and acceleration
        let torque = forcePos.cross(force);
        let accel = force.multiplyScalar(1/this.totalMass).multiplyScalar(0.97);
        //add torque and acceleration
        this.angularAccel += torque;
        this.accel = this.accel.add(accel);

        //add components

        this.forceVisualPos = forcePos;
        this.forceVisual = force;
    }

    checkCollision(other){
        if(other instanceof cluster&&other.id!=this.id){
            for(let i=0; i<this.members.length; i++){
                for(let j=0; j<other.members.length; j++){
                    
                    let force1 = this.members[i].getForce(other.members[j]);
                    if(force1.radius>0.01){
                        this.update(-this.lastDelta,false);
                        this.applyForce(this.members[i].pos,this.members[i].getForce(other.members[j]));
                        this.update(this.lastDelta,false);
                    }
                }
            }
        }
    }

    update(delta,resetAccel=true){
        //rotate
        
        this.vel = this.vel.add(this.accel.multiplyScalar(delta));
        
        if(resetAccel){
        this.angleRate += this.angularAccel*delta;this.angularAccel=0;
        this.accel=new vector(0,0);
        this.lastDelta = delta;
        }
        
        this.angle += this.angleRate*delta;
        this.angleRate *= 0.97;
        this.pos = this.pos.add(this.vel.multiplyScalar(delta));
    }
}












