let screen = document.getElementById("canvas");
let ctx = screen.getContext("2d");

let HEIGHT = 48;
let WIDTH = Math.floor((HEIGHT*Math.sqrt(3))/2)
let NumBlocks = 0;
let deleting = false;

class Cord {
    constructor(x,y,other){
        if(other==undefined){
    		this.x = x; 
    		this.y = y;
    	} else {
    		this.x = other.x;
    		this.y = other.y;
    	}
        this.pX = WIDTH*this.x*2+(WIDTH*(this.y%4==2))
        this.pY = Math.floor((this.y*HEIGHT)/4)
    }
}

class Cell {
    constructor(x,y){
        this.x = x;
        this.y = y;
		this.top = new Cord(this.x+(this.y%4==1),Math.floor(this.y/2)*2) 
		this.middle = new Cord(this.x+(this.y%4==3),Math.floor(this.y/2)*2+2) 
		this.bottom = new Cord(this.x+(this.y%4==1),Math.floor(this.y/2)*2+4) 
	}
	draw(){
		ctx.beginPath();
		ctx.moveTo(this.top.pX,this.top.pY);
		ctx.lineTo(this.middle.pX,this.middle.pY);
		ctx.lineTo(this.bottom.pX,this.bottom.pY);
		ctx.closePath();
		ctx.fill();
	}
}

class Point {
    constructor(x,y,other){
    	if(other==undefined){
    		this.x = x; 
    		this.y = y;
    	} else {
    		this.x = other.x;
    		this.y = other.y;
    	}
    	this.pix = new Cord(WIDTH*this.x*2+(WIDTH*(this.y%4==2)), Math.floor((this.y*HEIGHT)/4))
	    this.nghbr = {}
	    this.cells = {
	    	TL: new Cell(this.x-(this.y%4==0),this.y+(this.y%4==0)-4), 
	    	ML: new Cell(this.x-(this.y%4==0), this.y+(this.y%4==0)-2), 
		    BL: new Cell(this.x-(this.y%4==0), this.y+(this.y%4==0)), 
		    TR: new Cell(this.x, this.y+(this.y%4==2)-4),
		    MR: new Cell(this.x, this.y+(this.y%4==2)-2), 
		    BR: new Cell(this.x, this.y+(this.y%4==2))
	    }
	    this.blockNum = ++NumBlocks;
    }
    equalTo(other){
    	return (this.x == other.x && this.y == other.y)
    }
    draw(){
    	let TRflag = false
    	if(this.nghbr.T){ TRflag = Boolean(this.nghbr.T.nghbr.BR) }
    	else if(this.nghbr.BR){ TRflag = (this.nghbr.BR.nghbr.T) }
    	let TLflag = false
    	if(this.nghbr.T){ TLflag = Boolean(this.nghbr.T.nghbr.BL) }
    	else if(this.nghbr.BL){ TLflag = Boolean(this.nghbr.BL.nghbr.T) }
    	let Bflag = false
    	if(this.nghbr.BR){ Bflag = Boolean(this.nghbr.BR.nghbr.BL) }
    	else if(this.nghbr.BL){ Bflag = Boolean(this.nghbr.BL.nghbr.BR) }
    	
    	if(!this.nghbr.T)
    	{
        	ctx.fillStyle = "#DDD"
        	if(!TRflag) { this.cells.TL.draw() }
	    	if(!TLflag) { this.cells.TR.draw() }
    	}
    	if(!this.nghbr.BR)
    	{
	    	ctx.fillStyle = "#BBB"
	    	if(!TRflag) { this.cells.ML.draw() }
			if(!Bflag) { this.cells.BL.draw() }
			
    	}
    	if(!this.nghbr.BL)
    	{
			ctx.fillStyle = "#999"
			if(!TLflag) { this.cells.MR.draw() }
			if(!Bflag) { this.cells.BR.draw() }
    	}
    }
    debugDraw(){
    	ctx.fillStyle = "#000";
    	ctx.fillText(this.blockNum,this.pix.x-5,this.pix.y-10)
    	ctx.fillStyle = "#583"
    	ctx.fillRect(this.pix.x -3,this.pix.y -3,6,6)
    	ctx.beginPath()
    	for(let key in this.nghbr){
    		if(this.nghbr[key])
    		{
	    		ctx.moveTo(this.pix.x,this.pix.y);
	    		ctx.lineTo(this.nghbr[key].pix.x,this.nghbr[key].pix.y)
    		}
    	}
    	ctx.stroke()
    }
}

class Blocks {
	constructor(){
		this.blocks = []
	}
	findIndex(point){
		for(let i = 0; i < this.blocks.length; i++){
			if(this.blocks[i].equalTo(point)){ return i }
		}
		return -1
	}
	push(point){
		let index = this.findIndex(point)
		if(index != -1){
			this.resetConnections(this.blocks[index])
		} else {
			this.connectToLastCreated(point)
			this.cleanUpLooseEnds(point)
			// console.log(this.blocks)
			this.blocks.push(point)
		}

	}
	connectToLastCreated(point){
		let neighbors = this.getLiveNeighbors(point)
		let BigBlockNum = -1;
		let BigKey;
		for(let key in neighbors) // going through each neighbor
		{
			if(neighbors[key].blockNum > BigBlockNum) 
			{
				BigKey = key;
				BigBlockNum = neighbors[key].blockNum;
			}
		}
		if(BigBlockNum != -1){
			point.nghbr[BigKey] = neighbors[BigKey] // assigning the new point to the found neighbor
			neighbors[BigKey].nghbr[this.opp(BigKey)] = point // telling the neighbor that is has been assigned
		}
	}
	cleanUpLooseEnds(point){
		let nghbr = this.getLiveNeighbors(point)
		let flag;
		for(let key in nghbr) // going through each neighbor that exists
		{
			// if we aren't already connected to it through a short angle
			let flag = false;
			let leftKey = this.adj(key).left
			let rightKey = this.adj(key).right

			// make sure connection to adjacent left key exist, then check that left key to see if it has connection to right key
	    	if(point.nghbr[leftKey]){ if(point.nghbr[leftKey].nghbr[rightKey]) { flag = true } } 
	    	if(point.nghbr[rightKey]){ if(point.nghbr[rightKey].nghbr[leftKey]) { flag = true }} 
			if(point.nghbr[key] == nghbr[key]) { flag = true }
			
	    	if(!flag) { 
	    		point.nghbr[key] = nghbr[key] // connect the point to the loose neighbor
	    		
	    		nghbr[key].nghbr[this.opp(key)] = point // and return the favor
	    	}
		}
		
	}
	getLiveNeighbors(point){
		var neighbors = {}
		var Ti = this.findIndex(this.T(point))
		var TLi = this.findIndex(this.TL(point))
		var TRi = this.findIndex(this.TR(point))
		var BRi = this.findIndex(this.BR(point))
		var BLi = this.findIndex(this.BL(point))
		var Bi = this.findIndex(this.B(point))
		if(Ti != -1){ neighbors.T = this.blocks[Ti] }
		if(TLi != -1){ neighbors.TL = this.blocks[TLi] }
		if(TRi != -1){ neighbors.TR = this.blocks[TRi] }
		if(BRi != -1){ neighbors.BR = this.blocks[BRi] }
		if(BLi != -1){ neighbors.BL = this.blocks[BLi] }
		if(Bi != -1){ neighbors.B = this.blocks[Bi] }
		return neighbors
	}
	resetConnections(point){
		let nghbr = this.getLiveNeighbors(point)
		for(let key in nghbr)
		{
			// get rid of perpendicial connections
			// console.log(nghbr[key].nghbr)
			let perp = this.adj(this.opp(key))
			if( nghbr[key].nghbr[perp.right] ) { nghbr[key].nghbr[perp.right] = null } 
			if( nghbr[key].nghbr[perp.left] ) { nghbr[key].nghbr[perp.left] = null }
			// console.log(nghbr[key].blockNum,perp.right,perp.left)
			
			// connect it to this self-centered point
			nghbr[key].nghbr[this.opp(key)] = point

			// set this point to connect to everyone else
			point.nghbr[key] = nghbr[key]
		}
		// balance out the damage we caused
		for(let key in nghbr)
			this.cleanUpLooseEnds(nghbr[key])
	}
	deleteBlock(point){
		// see if it is a ligitiment club member
		var index = this.findIndex(point)
		if(index == -1) {return}
		
		// May he rest in piece
		console.log(this.blocks[index].blockNum)
		this.blocks.splice(index,1)

		// get affiliations to look the other way, for a good clean murder
		var liveNghbrs = this.getLiveNeighbors(point)
		for(var key in liveNghbrs)
			liveNghbrs[key].nghbr[this.opp(key)] = null
		// tell affiliations to make new friends, like this never happened
		for(let key in liveNghbrs)
			this.cleanUpLooseEnds(liveNghbrs[key])
		
	}
	T(point){ 
    	return new Cord(point.x,point.y-4)
    }
    B(point){ 
    	return new Cord(point.x,point.y+4) 
    }
    TL(point){ 
    	return new Cord(point.x+(point.y%4==2),point.y-2) 
    }
    TR(point){ 
    	return new Cord(point.x-(point.y%4==0),point.y-2) 
    }
    BL(point){ 
    	return new Cord(point.x+(point.y%4==2),point.y+2) 
    }
    BR(point){ 
    	return new Cord(point.x-(point.y%4==0),point.y+2) 
    }
    opp(key){
    	switch(key){
    		case "T":
    			return "B"
    		case "TL":
    			return "BR"
    		case "TR":
    			return "BL"
    		case "BR":
    			return "TL"
    		case "BL":
    			return "TR"
    		case "B":
    			return "T"
    			
    	}
    }
    adj(key){
    	 switch(key){
    		case "T":
    			return {left:"TL",right:"TR"}
    		case "TL":
    			return {left:"BL",right:"T"}
    		case "TR":
    			return {left:"T",right:"BR"}
    		case "BR":
    			return {left:"TR",right:"B"}
    		case "BL":
    			return {left:"B",right:"TL"}
    		case "B":
    			return {left:"BR",right:"BL"}
    	}
    }
    draw(){
		for(let i = 0; i < this.blocks.length; i++){
    		this.blocks[i].draw()
    	}
	}
}

function getPoint(x,y) {
    let colNum = Math.floor((x+WIDTH/2)/WIDTH);
    let isUp = colNum%2==0
    let col = Math.floor(colNum/2);
    let row = (Math.floor((y+(isUp*Math.floor(HEIGHT/2)))/HEIGHT)*2+!isUp)*2
    return new Cord(col,row);
}

let hover;
let blocks = new Blocks()

window.onmousemove = function(event){
    hover = getPoint(event.pageX,event.pageY);
    draw();
}

window.onclick = function(){
	let block = new Point(0,0,hover)
	if(!deleting)
		blocks.push(block)
	else
		blocks.deleteBlock(block)
}

function draw(){
    ctx.clearRect(0,0,screen.width,screen.height)
    blocks.draw()
    // hover.draw()
    // for(var i = 0; i < blocks.blocks.length; i++){
    // 	blocks.blocks[i].debugDraw();
    // }
}

/* Keyboard Handler */
{
window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
        return; // Should do nothing if the key event was already consumed.
        }
    
    // alert(event.keyCode);
    switch(event.keyCode) {
    	case 16: // D
    		deleting = true;
    		break;
        default:
        return;
        }
    
    // Consume the event to avoid it being handled twice
    event.preventDefault();
    }, true);

window.addEventListener("keyup", function (event) {
    //alert(event.keyCode);
    switch(event.keyCode) {
    	case 16: // D
    		deleting = false;
    		break;
        default:
        return;
        }
    
    // Consume the event to avoid it being handled twice
    event.preventDefault();
    }, true);
}

window.onresize = function(){
    screen.width = window.innerWidth
    screen.height = window.innerHeight
}

window.onload = function(){
    screen.width = window.innerWidth
    screen.height = window.innerHeight
}
