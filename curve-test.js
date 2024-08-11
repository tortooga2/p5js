




class physicsWorld{
    constructor(cellSize){
        this.cellSize = cellSize;
        this.gridWidth = Math.ceil(width / this.cellSize);
        this.gridHeight = Math.ceil(height / this.cellSize);
        this.cellIndex = new Array(this.gridWidth * this.gridHeight);
        this.cellIndex.fill(-1);
        this.particles = [];
        this.springs = [];
        this.interactions = [];
    }

    compare = function(a, b){
        let a_i = getParticleIndex(a);
        let b_i = getParticleIndex(b);

        if(a_i < b_i){
            return -1;
        }
        if(a_i > b_i){
            return 1;
        }
        return 0;
    }

    addParticle(particle){
        this.particles.push(particle);
    }

    getParticleIndex(particle){
        let x = Math.floor(particle.x / this.cellSize);
        let y = Math.floor(particle.y / this.cellSize);
        let index = x + y * this.gridWidth;
        return index;
    }

    solveGrid(){
        this.cellIndex.fill(-1);
        this.particles.sort(this.compare);
        for(let i = 1; i < this.particles.length; i++){
            let p = this.particles[i];
            let index = getParticleIndex(p);
            let last = this.particles[i - 1];
            let lastIndex = getParticleIndex(last);
            if (index != lastIndex){
                cellIndex[index] = i;
            }
        }
    }


    getParticlesInCell(index){

        particles = [];

        let start = this.cellIndex[index];
        let i = this.cellIndex[index];

        if(start == -1){
            return particles;
        }

        while(i == start && i < this.particles.length){
            particles.push(this.particles[i]);
            i++;
        }

        return particles;
    }
}






class Particle{
    constructor(x, y, type, physicsWorld){
        this.x = x;
        this.y = y;
        this.type = type;
        this.physicsWorld = physicsWorld;
        this.locked = false;
        this.vx = 0;
        this.vy = 0;
    }

    lock(a){
        this.locked = a;
    }

    update(){

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.99;
        this.vy *= 0.99;

    }

    draw(){
    }

    run(particles){
        this.update(particles); 
        this.draw();
    }
}





function setup() {
	createCanvas(windowWidth, windowHeight);
	background(100);
}


function draw() {
	background(100)
	noFill();
	strokeWeight(3);
}