


class NoiseMap {
    constructor(scale) {
        this.scale = scale;
    }
    get(x, y) {
        //get a somewhat random number from x and y as integers
        let x0 = Math.floor(x * this.scale);
        let y0 = Math.floor(y * this.scale);
        let x1 = x0 + 1;
        let y1 = y0 + 1;

        //get values at the corners of the square
        let r00 = this.random(x0, y0);
        let r01 = this.random(x0, y1);
        let r10 = this.random(x1, y0);
        let r11 = this.random(x1, y1);

        //interpolate
        let sx = x * this.scale - x0; //scale factor within cell
        let sy = y * this.scale - y0;

        let a = r00 * (1 - sx) + r10 * sx;
        let b = r01 * (1 - sx) + r11 * sx;

        let value = a * (1 - sy) + b * sy;
        return value;


    }

    random(x,y){

        let seed = x * 10000 + y;
        let rand = Math.sin(seed) * 10000;
        
        return rand - Math.floor(rand);
        
    }
}

//seedRand

function seedRand(seed){
    let rand = Math.sin(seed) * 10000;
    return rand - Math.floor(rand);
}








class Terrain {
    constructor(scale){
        this.scale = scale;
        this.noiseMapDetail = new NoiseMap(scale/8);
        this.noiseMapRough = new NoiseMap(scale/16);
        this.rivers = [];
        //populate rivers
        for(let i = 0; i < 12; i++){
            let frequency1 = seedRand(1+i)*0.02 + 0.01;
            let frequency2 = seedRand(2+i)*0.04 + 0.02;
            let amplitude = seedRand(3+i)*20 + 10;
            let offset = seedRand(4+i)*5 + 2.5;
            let angle = seedRand(5+i)*Math.PI*4;
            this.rivers.push(new River(frequency1,frequency2,amplitude,offset,angle));
        }

        


    }
    get(x,y){
    

        //limit precision
        x = Math.round(x*255)/255;
        y = Math.round(y*255)/255;


        //return this.noiseMapRough.get(x,y);
        //get the height at a point
        let detail = this.noiseMapDetail.get(x,y);
        let rough = this.noiseMapRough.get(x,y)**3;
        
        //approx 60% of the map should be flatland- set rough to 0 there, determine biome using 2d sin wave
        let biome = Math.sin(x*0.06)*Math.sin(y*0.04);
        if(biome > -0.7){
            rough*=((biome+0.4)**2);
        }

        
        
        
        let height = detail*0.2 + rough*0.8;
        //clip- some areas should be flat
        if(height < 0.4){
            height*=height/0.4;
        }

        //add rivers
        let riverProximity = this.getRiverProximity(x/this.scale,y/this.scale);
        //if proximity is less than 30, slowly lower the height
        
            height *= Math.min(riverProximity/50,1);
            


        //limit precision
        height = Math.round(height*255)/255;

        return height;
    }


    getRiverProximity(x,y){
        //check all rivers
        let minDistance = 10000;
        for(let i = 0; i < this.rivers.length; i++){
            let distance = this.rivers[i].get(x,y);
            if(distance < minDistance){
                minDistance = distance;
            }
        }
        return minDistance;
    }
}
class River {
    constructor(frequency1,frequency2,amplitude,offset,angle){
        this.frequency1 = frequency1;
        this.frequency2 = frequency2;
        this.amplitude = amplitude;
        this.offset = offset;
        this.angle = angle;
    }
    get(x,y){
        //check how close the point is to the river
        //the axis of the river is defined by the angle
        //the distance is the distance from the point to the line
        //the line is defined by the angle and the offset
        
        //offset from the line by distance to 0,0 plugged into sin(f1*dist0)*sin(f2*dist0)
        //dist0 is the distance from the point to the origin
        let dist0 = Math.sqrt(x**2 + y**2);
        let offset = Math.sin(this.frequency1*dist0)*Math.sin(this.frequency2*dist0)*this.amplitude;
        //distance from the line is the distance from the point to the line minus the offset
        let dist1 = Math.abs(x*Math.sin(this.angle) - y*Math.cos(this.angle) - this.offset - offset);
        return dist1+1;




        return distance;
    }
}

        






















































