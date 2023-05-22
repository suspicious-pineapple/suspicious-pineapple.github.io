class FishBrain {
    constructor() {
        this.inputSize = 16;
        this.outputSize = 2;
        this.layerShape = [this.inputSize,8,10,6,this.outputSize];
        //count total number of nodes
        
        //all values from previous layer are multiplied by weights of their connections and added to all values of the next layer
        this.weights = [];
        for (let i = 0; i < this.layerShape.length - 1; i++) {
            this.weights.push([]);
            for (let j = 0; j < this.layerShape[i]; j++) {
                this.weights[i].push([]);
                for (let k = 0; k < this.layerShape[i + 1]; k++) {
                    this.weights[i][j].push((Math.random() * 2 - 1)*0.4);
                }
            }
        }
        this.biases = [];
        //biases for input and output layer are always 0
        for (let i = 0; i < this.layerShape.length; i++) {
            this.biases.push([]);
            for (let j = 0; j < this.layerShape[i]; j++) {
                if(i==0||i==this.layerShape.length-1) this.biases[i].push(0);
                else this.biases[i].push((Math.random() * 2 - 1)*0.0001);
            }
        }
        this.memoryWeights = [];
        //for each node one
        for (let i = 0; i < this.layerShape.length; i++) {
            this.memoryWeights.push([]);
            for (let j = 0; j < this.layerShape[i]; j++) {
                this.memoryWeights[i].push(0);
            }
        }


        
        this.lastValues = [];
        //initialize lastValues
        for (let i = 0; i < this.layerShape.length; i++) {
            this.lastValues.push([]);
            for (let j = 0; j < this.layerShape[i]; j++) {
                this.lastValues[i].push(0);
            }
        }

    }
    mutate(factor){
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    if(Math.random() < factor/2){
                    this.weights[i][j][k] += factor*(Math.random() * 2 - 1);
                    }
                    if(Math.random() < factor/700) this.weights[i][j][k] = (Math.random() * 2 - 1) * 0.5;
                }
            }
        }
        //bias mutation
        for (let i = 0; i < this.biases.length; i++) {
            for (let j = 0; j < this.biases[i].length; j++) {
                if(Math.random() < factor/5){this.biases[i][j] += (factor/5)*((Math.random() * 2 - 1)*0.0005);}
                if(Math.random() < factor/100) this.biases[i][j] = 0;
            }
        }
        //memory mutation
        for (let i = 1; i < this.memoryWeights.length-1; i++) {
            for (let j = 0; j < this.memoryWeights[i].length; j++) {
                if(Math.random() < factor/2){this.memoryWeights[i][j] += factor*(Math.random() * 2 - 1);}
                if(this.memoryWeights[i][j] < 0) this.memoryWeights[i][j] = 0;
            }
        }

    }
    pair (other) {
        let child = new FishBrain();
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    child.weights[i][j][k] = Math.random() < 0.5 ? this.weights[i][j][k] : other.weights[i][j][k];
                    if(Math.random() < 0.3) {
                        child.weights[i][j][k] = (this.weights[i][j][k] + other.weights[i][j][k]) / 2;
                    }
                }
            }
        }
        
        for (let i = 0; i < this.biases.length; i++) {
            for (let j = 0; j < this.biases[i].length; j++) {
                child.biases[i][j] = Math.random() < 0.5 ? this.biases[i][j] : other.biases[i][j];
                if(Math.random() < 0.3) {
                    child.biases[i][j] = (this.biases[i][j] + other.biases[i][j]) / 2;
                }
            }
        }
        for (let i = 0; i < this.memoryWeights.length; i++) {
            for (let j = 0; j < this.memoryWeights[i].length; j++) {
                child.memoryWeights[i][j] = Math.random() < 0.5 ? this.memoryWeights[i][j] : other.memoryWeights[i][j];
                if(Math.random() < 0.3) {
                    child.memoryWeights[i][j] = (this.memoryWeights[i][j] + other.memoryWeights[i][j]) / 2;
                }
            }
        }



        return child;
    }
    think(input) {
        //use matrix operations instead
        if(input.length != this.inputSize) throw new Error("size does not match input size: "+ input.length);
        let values = [];
        
        for (let i = 0; i < this.layerShape.length; i++) {
            values[i] = [];
            for (let j = 0; j < this.layerShape[i]; j++) {
                values[i][j] = this.lastValues[i][j]*this.memoryWeights[i][j];
            }
        }
        //apply memory, multiply lastValues with memoryWeights and add to result
        


        values[0] = input;
        //weight array is of shape weight=[layer][node][next node]
        for (let i = 0; i < this.layerShape.length - 1; i++) {
            for (let j = 0; j < this.layerShape[i]; j++) {
                for (let k = 0; k < this.layerShape[i + 1]; k++) {
                    values[i + 1][k] += values[i][j] * this.weights[i][j][k];
                }
            }    
        }


        this.lastValues = values;
        return values[values.length - 1];
    }


    draw(ctx) {
      



        let height = ctx.canvas.height;
        let width = ctx.canvas.width;
        ctx.clearRect(0,0,width,height);
        let circleRadius = 10;

        //distribute nodes around layers of circles, output layer being in the center
        let centerX = width / 2;
        let centerY = height / 2;
        let outerRadius = width / 2 - circleRadius;
       //start with outermost layer, the input layer

        let layerX = [];
        let layerY = [];
        for (let i = 0; i < this.layerShape.length; i++) {
            layerX.push([]);
            layerY.push([]);
            for (let j = 0; j < this.layerShape[i]; j++) {
                let angle = j / this.layerShape[i] * 2 * Math.PI;
                layerX[i].push(centerX + Math.cos(angle) * outerRadius * (i+1) / this.layerShape.length);
                layerY[i].push(centerY + Math.sin(angle) * outerRadius * (i+1) / this.layerShape.length);
            }
        }

        //draw connections
        for (let i = 0; i < this.layerShape.length - 1; i++) {
            for (let j = 0; j < this.layerShape[i]; j++) {
                for (let k = 0; k < this.layerShape[i + 1]; k++) {
                    if(this.weights[i][j][k] == 0) continue;

                    ctx.strokeStyle = this.weights[i][j][k] > 0 ? "green" : "red";
                    ctx.lineWidth = Math.abs(this.weights[i][j][k]) * 5;
                    ctx.beginPath();
                    ctx.moveTo(layerX[i][j],layerY[i][j]);
                    ctx.lineTo(layerX[i+1][k],layerY[i+1][k]);
                    ctx.stroke();
                }
            }
        }

        //draw nodes
        for (let i = 0; i < this.layerShape.length; i++) {
            for (let j = 0; j < this.layerShape[i]; j++) {

                //draw red or green circle in node depending on value

                ctx.fillStyle = "black";
                //slightly blueish if memory is used
                if(this.memoryWeights[i][j] != 0) ctx.fillStyle = "rgb(0,0,"+Math.abs(2*this.memoryWeights[i][j])*255+")";

                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(layerX[i][j],layerY[i][j],circleRadius,0,2 * Math.PI);
                ctx.fill();
                //draw red or green circle around node depending on bias
                if(i > 0 && i < this.layerShape.length - 1) {
                    ctx.strokeStyle = this.biases[i-1][j] > 0 ? "green" : "red";
                    ctx.lineWidth = 2+(Math.abs(this.biases[i-1][j]) * 50);

                    ctx.beginPath();
                    ctx.arc(layerX[i][j],layerY[i][j],circleRadius*1.5,0,2 * Math.PI);
                    ctx.stroke();
                }
                
                let value = Math.min(1.2,20*Math.abs(this.lastValues[i][j]));
                ctx.fillStyle = this.lastValues[i][j] > 0 ? "green" : "red";
                ctx.beginPath();
                ctx.arc(layerX[i][j],layerY[i][j],circleRadius*value*0.5,0,2 * Math.PI);
                
                ctx.fill();



                
            }
        }
    }
    checksum(){
        let str = JSON.stringify(this);
        let sum = 0;
        for (let i = 0; i < str.length; i++) {
            sum += str.charCodeAt(i);
        }
        return sum;
}
    serialize() {
        //store important metadata, and weights/biases in binary/bas64 format
        let data = {
            inputSize: this.inputSize,
            outputSize: this.outputSize,
            layerShape: this.layerShape,
            weights: this.weights,
            biases: this.biases,
            memoryWeights: this.memoryWeights,
        };

        return data;

    }
    static deserialize(data) {
        let brain = new FishBrain();
        brain.inputSize = data.inputSize;
        brain.outputSize = data.outputSize;
        brain.layerShape = data.layerShape;
        brain.weights = data.weights;
        brain.biases = data.biases;
        brain.memoryWeights = data.memoryWeights;

        return brain;
    }
    clone() {
        return FishBrain.deserialize(this.serialize());
    }
}


































