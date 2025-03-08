class ScriptAI {
    constructor(code,world,robot){
        this.code=code.split("\n").map(l=>l.trim());
        this.world = world;
        this.robot = robot;
        this.state={};
        this.vars.counter=0;
        parent=this;
    }
    
    vars = {
        counter:0,
        get randX(){return Math.floor(Math.random()*parent.world.width)},
        get randY(){return Math.floor(Math.random()*parent.world.height)},
    }
    tick(){        
        if(this.state.timeoutUntil>Date.now()){
            return;
        }
        //set thisX and thisY
        this.vars.thisX=this.robot.x;
        this.vars.thisY=this.robot.y;
        
            let line=this.code[this.vars.counter];
            let tokens=(line+"").split(" ");
            let command=tokens.shift();
            if(Object.keys(instructions).indexOf(command)==-1){
                return;
            }
            tokens=this.tokenReplacer(tokens);
            instructions[command](this.robot,tokens);
            //console.log(line);
            this.vars.counter++;
            if(this.vars.counter>=this.code.length)
            {
                this.vars.counter=0;
            }
        }
        
        tokenReplacer(tokens){
            for(let i=0;i<tokens.length;i++){
                let token=tokens[i];
                //allow $rand(num)
                if(token.startsWith("$rand(")){
                let num=token.substring(6,token.length-1);
                tokens[i]=Math.floor(Math.random()*num);
            }
            //read from tiles
            if(token.startsWith("$tile(")){
                let x=token.substring(6,token.indexOf(","));
                let y=token.substring(token.indexOf(",")+1,token.length-1);
                //parse x and y
                x=parseInt(x);
                y=parseInt(y);
                //convert bool to int
                tokens[i]=this.getRelativeTile(x,y)?1:0;
            }

            if(token.startsWith("$")){
                let varName=token.substring(1);
                if(varName in this.vars){
                    tokens[i]=this.vars[varName];
                }
            }
        }
        //console.log(tokens);
        return tokens;
    }
    getRelativeTile(x,y){
        //fetches the tile relative to the robot
        let x1=this.robot.x+x;
        let y1=this.robot.y+y;
        return this.world.getTile(x1,y1).blocked;
    }

}








let instructions = {
    move: moveFunction,
    wait: waitFunction,
    set: setVarFunction,
    add: addFunction,
    sub: subtractFunction,
    mul: multiplyFunction,
    div: divideFunction,
    greaterThan: greaterThanFunction,
    lessThan: lessThanFunction,
    equal: equalsFunction,
    notEqual: notEqualsFunction,
    locate: locateFunction,
    eat: eatFunction,
}

function moveFunction(robot,args){
    let x = parseInt(args[0]);
    let y = parseInt(args[1]);
    robot.move(x,y);
}

function waitFunction(robot,args){
    let timeout = parseInt(args[0]);
    robot.ai.state.timeoutUntil = Date.now()+timeout;
}
function setVarFunction(robot,args){
    let varName = args[0];
    let varValue = args[1];
    //parse as int
    varValue = parseInt(varValue);
    robot.ai.vars[varName]=varValue;
}
function addFunction(robot,args){
    let varName = args[0];
    let varValue = args[1];
    //parse as int
    varValue = parseInt(varValue);
    robot.ai.vars[varName]+=varValue;
}
function subtractFunction(robot,args){
    let varName = args[0];
    let varValue = args[1];
    //parse as int
    varValue = parseInt(varValue);
    robot.ai.vars[varName]-=varValue;
}
function multiplyFunction(robot,args){
    let varName = args[0];
    let varValue = args[1];
    //parse as int
    varValue = parseInt(varValue);
    robot.ai.vars[varName]*=varValue;
}
function locateFunction(robot,args){
    //arg 1 and arg 2 are x and y variable names
    let xVarName = args[0];
    let yVarName = args[1];
    //scan for nearest blocked tile using getRelativeTile
    let closestX=99;
    let closestY=99;
    for(let i=-8;i<8;i++){
        for(let j=-8;j<8;j++){
            //check bounds
            if(robot.x+i<0||robot.x+i>=robot.world.width||robot.y+j<0||robot.y+j>=robot.world.height){
                continue;
            }
            if(robot.ai.getRelativeTile(i,j)){
                //check if closer to 0,0 than current closest
                if(Math.abs(i)+Math.abs(j)<Math.abs(closestX)+Math.abs(closestY)){
                    //ignore 0,0
                    if(i!=0||j!=0){
                    closestX=i;
                    closestY=j;
                    }
                }
            }
        }
    }
    //set x and y
    //if 99, set to 0
    if(closestX==99){
        closestX=0;
    }

    if(closestY==99){
        closestY=0;
    }
    
    robot.ai.vars[xVarName]=closestX;
    robot.ai.vars[yVarName]=closestY;
    //console.log("x: "+closestX+"  y: "+closestY);
}

function divideFunction(robot,args){
    let varName = args[0];
    let varValue = args[1];
    //parse as int
    varValue = parseInt(varValue);
    robot.ai.vars[varName]/=varValue;
}
function eatFunction(robot,args){
    //x and y relative to robot, convert to absolute
    //then call consume on coodinates
    let x = parseInt(args[0]);
    let y = parseInt(args[1]);
    let x1=robot.x+x;
    let y1=robot.y+y;
    robot.consume(x1,y1);
    //console.log("eat");
}
function greaterThanFunction(robot,args){
    //arg1 is target variable name, 2 and 3 are values
    let varName = args[0];
    let varValue = args[1];
    let varValue2 = args[2];
    //parse as int
    varValue = parseInt(varValue);
    varValue2 = parseInt(varValue2);
    //set varName to boolean result as 1 or 0
    robot.ai.vars[varName]=(varValue>varValue2)?1:0;
}
function lessThanFunction(robot,args){
        //arg1 is target variable name, 2 and 3 are values
        let varName = args[0];
        let varValue = args[1];
        let varValue2 = args[2];
        //parse as int
        varValue = parseInt(varValue);
        varValue2 = parseInt(varValue2);
        //set varName to boolean result as 1 or 0
        robot.ai.vars[varName]=(varValue<varValue2)?1:0;
}
function equalsFunction(robot,args){
        //arg1 is target variable name, 2 and 3 are values
        let varName = args[0];
        let varValue = args[1];
        let varValue2 = args[2];
        //parse as int
        varValue = parseInt(varValue);
        varValue2 = parseInt(varValue2);
        //set varName to boolean result as 1 or 0
        robot.ai.vars[varName]=(varValue==varValue2)?1:0;
}
function notEqualsFunction(robot,args){
        //arg1 is target variable name, 2 and 3 are values
        let varName = args[0];
        let varValue = args[1];
        let varValue2 = args[2];
        //parse as int
        varValue = parseInt(varValue);
        varValue2 = parseInt(varValue2);
        //set varName to boolean result as 1 or 0
        robot.ai.vars[varName]=(varValue!=varValue2)?1:0;
    }


