let blob_fill_color;
let blob_stroke_color;
let dot1_color;

var applyForce =
  (distance = 10, strength = 1.0) =>
  (particle, particles) => {
    particles.forEach((p) => {
      let dx = p.x - particle.x;
      let dy = p.y - particle.y;
      let d = dist(p.x, p.y, particle.x, particle.y);
      dx /= d * d + 0.1;
      dy /= d * d + 0.1;
      if (d < distance) {
        particle.vx -= dx * strength;
        particle.vy -= dy * strength;
      }
    });
  };

var stayInBounds = (width, height, padding, force) => (particle) => {
  if (particle.x < padding) {
    particle.vx += force;
  }
  if (particle.x > width - padding) {
    particle.vx -= force;
  }
  if (particle.y < padding) {
    particle.vy += force;
  }
  if (particle.y > height - padding) {
    particle.vy -= force;
  }
};

class PhysicsWorld {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(width / this.cellSize);
    this.gridHeight = Math.ceil(height / this.cellSize);
    this.cellIndex = new Array(this.gridWidth * this.gridHeight);
    this.cellIndex.fill(-1);
    this.particles = [];
    this.springs = [];
    this.interactions = {};
    this.blobs = [];
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  addSpring(spring) {
    this.springs.push(spring);
  }

  getParticleIndex(particle) {
    let x = Math.floor(particle.x / this.cellSize);
    let y = Math.floor(particle.y / this.cellSize);
    let index = x + y * this.gridWidth;
    return index;
  }

  compare = function (a, b) {
    let a_i = this.getParticleIndex(a);
    let b_i = this.getParticleIndex(b);

    if (a_i < b_i) {
      return -1;
    }
    if (a_i > b_i) {
      return 1;
    }
    return 0;
  };

  solveGrid() {
    this.cellIndex.fill(-1);
    this.particles.sort(this.compare.bind(this));
    for (let i = 0; i < this.particles.length; i++) {
      let index = this.getParticleIndex(this.particles[i]);
      if (this.cellIndex[index] == -1) {
        this.cellIndex[index] = i;
      }
    }
  }

  getParticlesInCell(index, filters) {
    let particle = [];

    if (this.cellIndex[index] == -1) {
      return particle;
    }

    let i = this.cellIndex[index];
    while (
      i < this.particles.length &&
      this.getParticleIndex(this.particles[i]) == index
    ) {
      if (filters.includes(this.particles[i].type)) {
        particle.push(this.particles[i]);
      }
      i++;
    }

    return particle;
  }

  getParticlesInRadius(particle, filters) {
    let particles = [];
    let index = this.getParticleIndex(particle);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let tempIndex = index + i + j * this.gridWidth;
        if (tempIndex >= 0 && tempIndex < this.cellIndex.length) {
          let h = this.getParticlesInCell(tempIndex, filters);
          particles = [...particles, ...h];
        }
      }
    }
    return particles;
  }

  addInteraction(interaction, to, from) {
    // this.interactions.push({
    //   interaction: interaction,
    //   from: from,
    //   to: to
    // });
    to.forEach((t) => {
      (this.interactions[t] = this.interactions[t] || []).push({
        interaction: interaction,
        from: from,
      });
    });
  }

  update() {
    let start_of_curve;
    let rel_index = 0;
    if (this.blobs.length > 0) {
      start_of_curve = this.blobs[0];
      beginShape();
      vertex(start_of_curve.p.x, start_of_curve.p.y);
    }

    for (let i = 0; i < this.particles.length; i++) {
      let inter = this.interactions[this.particles[i].type];
      if (inter != undefined) {
        for (let j = 0; j < inter.length; j++) {
          inter[j].interaction(
            this.particles[i],
            this.getParticlesInRadius(this.particles[i], inter[j].from)
          );
        }
      }

      if (i < this.blobs.length) {
        if ((i - rel_index) % start_of_curve.n == 0) {
          rel_index = i;
          fill(blob_fill_color);
          strokeWeight(5);
          stroke(blob_stroke_color);
          endShape(CLOSE);
          start_of_curve = this.blobs[i];
          beginShape();

          vertex(start_of_curve.p.x, start_of_curve.p.y);
        } else {
          curveVertex(this.blobs[i].p.x, this.blobs[i].p.y);
        }
      } else {
        fill(blob_fill_color);
        strokeWeight(5);
        stroke(blob_stroke_color);
        endShape(CLOSE);
      }

      this.particles[i].run();
      if (i < this.springs.length) {
        this.springs[i].run();
      }
    }
  }
}

class Particle {
  constructor(x, y, type, physicsWorld, show) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.physicsWorld = physicsWorld;
    this.vx = 0;
    this.vy = 0;
    this.show = show;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.8;
    this.vy *= 0.8;
  }
  draw() {
    strokeWeight(0);
    fill(dot1_color);
    circle(this.x, this.y, 10);
  }
  run() {
    this.update();
    if (this.show) {
      this.draw();
    }
  }
}
class Spring {
  constructor(particle1, particle2, length, strength, show = false) {
    this.particle1 = particle1;
    this.particle2 = particle2;
    this.length = length;
    this.strength = strength;
    this.show = show;
  }

  update() {
    let dx = this.particle2.x - this.particle1.x;
    let dy = this.particle2.y - this.particle1.y;
    let d = dist(
      this.particle1.x,
      this.particle1.y,
      this.particle2.x,
      this.particle2.y
    );
    dx /= d + 0.1;
    dy /= d + 0.1;
    let diff = d - this.length;
    dx *= diff * this.strength;
    dy *= diff * this.strength;
    this.particle1.vx += dx;
    this.particle1.vy += dy;
    this.particle2.vx -= dx;
    this.particle2.vy -= dy;
  }

  draw() {
    strokeWeight(5);
    stroke(blob_stroke_color);
    line(
      this.particle1.x,
      this.particle1.y,
      this.particle2.x,
      this.particle2.y
    );
  }

  run() {
    this.update();
    if (this.show) {
      this.draw();
    }
  }
}

const CreateBlob = (x, y, n, r, physicsWorld) => {
  let particles = [];
  let addCilia = random(0, 1) > 0.7;

  for (let i = 0; i < n; i++) {
    let angle = (i * TWO_PI) / n;
    let particle = new Particle(
      x + r * cos(angle),
      y + r * sin(angle),
      "blob",
      physicsWorld,
      false
    );
    physicsWorld.addParticle(particle);

    physicsWorld.blobs.push({ p: particle, n: n });

    particles.push(particle);
    if (addCilia) {
      let cilia = new Particle(
        x + r * 1.3 * cos(angle),
        y + r * 1.3 * sin(angle),
        "blob",
        physicsWorld,
        false
      );
      physicsWorld.addParticle(cilia);
      physicsWorld.addSpring(new Spring(particle, cilia, n, 0.4, true));
    }
  }
  //   if (random(0, 1) > 0.7) {
  //     //CreateBlob(x, y, n - 5, r / 2, physicsWorld);
  //   }
  for (let i = 0; i < n; i++) {
    physicsWorld.addSpring(
      new Spring(particles[i], particles[(i + 1) % n], r / 4, 0.2)
    );
  }
};

let physicsWorld;

let focusedIndex;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(100);
  // blob_fill_color = color('hsb(96, 34%, 94%)');
  // blob_stroke_color = color('hsb(81, 43%, 76%)');
  //dot1_color = color('hsb(356, 29%, 85%)');
  blob_fill_color = color("hsb(354, 59%, 100%)");
  blob_stroke_color = color("hsb(5, 76%, 98%)");
  dot1_color = color("hsb(81, 43%, 79%)");

  physicsWorld = new PhysicsWorld(200);

  //physicsWorld.addInteraction(applyForce(200, -0.2), {or: ["dot2"]}, {or: ["dot2"]});
  // physicsWorld.addInteraction(applyForce(200, -0.2), {or: ["dot1"]}, {or: ["dot1"]});

  // physicsWorld.addInteraction(stayInBounds(width, height, 10 , 1.0), {or: ["dot1"]}, {or: ["dot1", "dot2"]});
  physicsWorld.addInteraction(
    stayInBounds(width, height, 100, 0.6),
    ["blob"],
    ["dot1", "dot2"]
  );
  physicsWorld.addInteraction(
    stayInBounds(width, height, 100, 0.6),
    ["dot1"],
    ["dot1", "dot2"]
  );

  for (let i = 0; i < 20; i++) {
    let blob_n = int(random(7, 19));
    let blob_radius = blob_n * 5;
    console.log(int(random(10, 20)));
    CreateBlob(
      random(width),
      random(height),
      blob_n,
      blob_radius,
      physicsWorld
    );
  }

  CreateBlob(width / 2, height / 2, 15, 150, physicsWorld);
  CreateBlob(width / 2, height / 2, 13, 50, physicsWorld);
  CreateBlob(width / 2 + 30, height / 2 + 30, 13, 50, physicsWorld);

  CreateBlob(width / 2 - 400, height / 2 - 400, 15, 150, physicsWorld);
  CreateBlob(width / 2 - 400, height / 2 - 400, 13, 50, physicsWorld);
  CreateBlob(width / 2 + 50 - 400, height / 2 + 50 - 400, 13, 50, physicsWorld);

  CreateBlob(width / 2, height / 2, 10, 30, physicsWorld);
  CreateBlob(width / 2 + 0, height / 2 + 50, 8, 20, physicsWorld);

  for (let i = 0; i < 200; i++) {
    let particle = new Particle(
      random(width),
      random(height),
      "dot1",
      physicsWorld,
      true
    );
    physicsWorld.addParticle(particle);
  }
  physicsWorld.addInteraction(applyForce(70, 0.5), ["blob"], ["blob"]);
  physicsWorld.addInteraction(applyForce(30, 1.0), ["blob"], ["blob"]);
  physicsWorld.addInteraction(applyForce(400, -0.05), ["blob"], ["blob"]);

  physicsWorld.addInteraction(applyForce(50, 0.7), ["dot1"], ["dot1", "blob"]);
  physicsWorld.addInteraction(applyForce(40, 0.7), ["dot1"], ["dot1"]);

  physicsWorld.addInteraction(applyForce(100, -0.4), ["dot1"], ["dot1"]);
  physicsWorld.addInteraction(applyForce(400, -0.03), ["dot1"], ["blob"]);

  console.log(physicsWorld.interactions);

  physicsWorld.solveGrid();
}

function draw() {
  background(15, 3, 38);
  noFill();
  strokeWeight(3);

  physicsWorld.solveGrid();
  physicsWorld.update();
  //   for(let i = 0; i < physicsWorld.particles.length; i++){
  //       physicsWorld.particles[i].run();
  //   }
  let fps = Math.floor(frameRate());
  textSize(32);
  fill(255);
  text(fps.toString(), 32, 32);
}
