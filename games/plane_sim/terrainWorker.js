//import heightmap from './heightmap.js';
//we are in a worker
importScripts('heightmap.js');
//<script src="https://cdn.babylonjs.com/babylon.js"></script>
importScripts('https://cdn.babylonjs.com/babylon.js');


const chunkSize = 54;
const mapScale = 1;

let terrainMap = new Terrain(0.2)



//create a babylon scene

//create offscreen canvas
let engine = new BABYLON.NullEngine({
    renderHeight: 512,
    renderWidth: 512,
    textureSize: 10,
});
let scene = new BABYLON.Scene(engine);







//on worker message
self.onmessage = function(e) {
    //receive data, contains x/y
    let data = e.data;
    let x = data.x;
    let y = data.y;
    //get map
    let map = getMap(x,y);
    self.postMessage({mapStr: map, x: x, y: y});

};



function getMap(chunkX, chunkY){
    
    let x = chunkX*chunkSize;
    let y = chunkY*chunkSize;
    let mountains = BABYLON.MeshBuilder.CreateGround("mountains", {width: chunkSize, height: chunkSize, subdivisions: 15,updatable:true, maxHeight:60}, scene);
    let vertices = mountains.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for(let i=0;i<vertices.length;i+=3){
        let worldPos = new BABYLON.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        let mapSample = terrainMap.get((worldPos.x+x)*mapScale, (worldPos.z+y)*mapScale);
        vertices[i+1] = mapSample*60;
    }
    mountains.updateVerticesData(BABYLON.VertexBuffer.PositionKind, vertices);
    mountains.dispose();
    //let vertexData = JSON.stringify(vertices);
    return vertices;
}


















