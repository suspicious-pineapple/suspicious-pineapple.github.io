class canvasRenderer{
    constructor(canvas, textures){
        this.canvas=canvas;
        this.ctx=canvas.getContext("2d");
        this.textures=textures;
    }
    render(world){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        for(let i = 0; i<world.clusters.length; i++){
            this.renderCluster(world.clusters[i]);
        }
    }

    renderCluster(cluster){
        this.ctx.save();
        this.ctx.translate(cluster.pos.x*32,cluster.pos.y*32);
        //draw a circle of radius maxSpan
        this.ctx.beginPath();
        this.ctx.arc(0,0,cluster.maxSpan*32,0,2*Math.PI);
        this.ctx.stroke();
        
        
        //rotate center of mass
        let com = cluster.CenterOfMass.rotate(cluster.angle);
        this.ctx.translate(-com.x*32,-com.y*32);
        this.ctx.rotate(cluster.angle);
        //draw a red line from the center of mass to the center of the cluster
        this.ctx.strokeStyle = "red";
        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.ctx.lineTo(cluster.CenterOfMass.x*32,cluster.CenterOfMass.y*32);
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        //draw line starting at cluster.forceVisualPos in the direction of cluster.forceVisual
        this.ctx.strokeStyle = "yellow";
        this.ctx.beginPath();
        this.ctx.moveTo(cluster.forceVisualPos.x*32,cluster.forceVisualPos.y*32);
        this.ctx.lineTo(cluster.forceVisualPos.x*32+cluster.forceVisual.x*32,cluster.forceVisualPos.y*32+cluster.forceVisual.y*32);
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        //set forceVisual to zero
        cluster.forceVisual = new vector(0,0);

        for(let i=0; i<cluster.members.length; i++){
            //draw a green circle for now
            this.ctx.beginPath();
            this.ctx.arc(cluster.members[i].pos.x*cluster.members[i].size*32,cluster.members[i].pos.y*cluster.members[i].size*32,cluster.members[i].size*32/2,0,2*Math.PI);
            this.ctx.fillStyle = "green";
            this.ctx.fill();
            //draw visual force vector
            this.ctx.beginPath();
            this.ctx.moveTo(cluster.members[i].pos.x*cluster.members[i].size*32,cluster.members[i].pos.y*cluster.members[i].size*32);
            let forceVisual = cluster.members[i].forceVisual.rotate(cluster.angle).multiplyScalar(0.3);
            let forceX = cluster.members[i].pos.x*cluster.members[i].size*32+forceVisual.x*cluster.members[i].size*32;
            let forceY = cluster.members[i].pos.y*cluster.members[i].size*32+forceVisual.y*cluster.members[i].size*32;
            this.ctx.lineTo(forceX,forceY);
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            //set forceVisual to zero
            cluster.members[i].forceVisual = new vector(0,0);

        }
        this.ctx.restore();
        for(let i=0; i<cluster.members.length; i++){
            //red hollow circle
            this.ctx.beginPath();
            //use global position
            this.ctx.arc(cluster.members[i].globalPosition().x*cluster.members[i].size*32,cluster.members[i].globalPosition().y*cluster.members[i].size*32,cluster.members[i].size*32/2,0,2*Math.PI);
            this.ctx.strokeStyle = "red";
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }
        //draw blue dot at center of cluster
        this.ctx.beginPath();
        this.ctx.arc(cluster.pos.x*32,cluster.pos.y*32,4,0,2*Math.PI);
        this.ctx.fillStyle = "blue";
        this.ctx.fill();

    }
    drawPoint(point){
        this.ctx.beginPath();
        this.ctx.arc(point.x*32,point.y*32,4,0,2*Math.PI);
        this.ctx.fillStyle = "red";
        this.ctx.fill();
    }
}