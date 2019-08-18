let polys = [];
let data;
let countries = [];
let cities;
let numCities = 20;
let t = 0;
let centers = [];

let scl = 30;
let xvec, yvec;
let noiseInc = 0.1;
let time = 0;
let particles = [];
let numParticles = 400;
let flowfield;
let timeSteps = 500;

let worldLayer;

let dataReady = false;

function preload() {}

function getRandomSubarray(arr, size) {
    let shuffled = arr.slice(0),
        i = arr.length,
        temp,
        index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

function setup() {
    frameRate(30);
    createCanvas(180 * 2 * 2.5, 90 * 2 * 2.5);
    worldLayer = createGraphics(width, height);

    data = loadJSON('clean_countries.json', () => {
        countries = Object.keys(data);

        for (let country of countries) {
            poly = data[country];
            if (country != 'ATA') {
                let new_coords = poly.map(coords => {
                    let [lng, lat] = coords;
                    // not mapping 0 | width height | 0 in order to properly center the world
                    return [map(lng, -180, 180, -100, width), map(lat, -90, 90, height + 100, 0)];
                });
                polys.push([country, new_coords]);
                let center = new_coords.reduce(
                    (acc, curr) => {
                        let [acc_x, acc_y] = acc;
                        let [x, y] = curr;
                        return [acc_x + x, acc_y + y];
                    },
                    [0, 0]
                );
                center = createVector(center[0] / new_coords.length, center[1] / new_coords.length);
                centers.push(center);
            }
        }
        cities = getRandomSubarray(centers, numCities);

        // Generate background map
        worldLayer.clear();
        worldLayer.stroke(255, 80);
        worldLayer.strokeWeight(0.5);
        worldLayer.fill(70);
        for (let el of polys) {
            let [_, poly] = el;
            worldLayer.beginShape();
            for (let coord of poly) {
                let [x, y] = coord;
                worldLayer.vertex(x, y);
            }
            worldLayer.endShape(CLOSE);
        }
        dataReady = true;
        for (let i = 0; i < numParticles; i++) {
            particles[i] = new Particle();
        }
    });

    /*
    // Show cities
    worldLayer.noStroke();
    worldLayer.fill(200, 190, 30);
    for (let center of centers) {
        worldLayer.ellipse(center.x, center.y, 5);
    }
    */

    FlowField();
}

function setTargets() {
    cities = getRandomSubarray(centers, numCities);
    for (let particle of particles) {
        particle.target = int(random() * cities.length);
        particle.destination = cities[particle.target];
    }
}

function draw() {
    if (dataReady) {
        clear();
        image(worldLayer, 0, 0);

        fill(216,17,89);
        noStroke();

        for (let k = 0; k < particles.length; k++) {
            particles[k].show();
            particles[k].seek();
            particles[k].update();
            particles[k].edge();
            particles[k].follow();
        }

        FlowField();
        if (t > timeSteps) {
            setTargets();
            t = 0;
        } else {
            t += 1;
        }
    }
}

function FlowField() {
    xvec = floor((windowWidth + 50) / scl);
    yvec = floor((windowHeight + 50) / scl);
    flowfield = new Array(xvec * yvec);

    let yNoise = 0;
    for (let y = 0; y < yvec; y++) {
        let xNoise = 0;
        for (let x = 0; x < xvec; x++) {
            let vecDirect = noise(xNoise, yNoise, time) * 2 * TWO_PI;
            let dir = p5.Vector.fromAngle(vecDirect);
            let index = x + y * xvec;
            flowfield[index] = dir;
            xNoise += noiseInc;
            dir.setMag(3);

            /*
            stroke(180);
            push();
            translate(x * scl, y * scl);
            rotate(dir.heading());
            line(0, 0, scl, 0);
            pop();
            */
        }
        yNoise += noiseInc;
        time += 0.0001;
    }
}

class Particle {
    constructor() {
        let start = random(centers);
        this.pos = createVector(start.x, start.y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.r = 2.0;
        this.maxSpeed = random(3, 3.5);

        this.seekForce = 4;
        this.fieldForce = 2;
        this.target = int(random() * cities.length);
        this.destination = cities[this.target];
    }
    update() {
        this.pos.add(this.vel);
        this.vel.add(this.acc);
        this.acc.mult(0);
        this.vel.limit(this.maxSpeed);
    }

    follow() {
        // follow flowfield vectors
        let x = constrain(floor(this.pos.x / scl), 0, xvec);
        let y = constrain(floor(this.pos.y / scl), 0, yvec);
        let index = x + y * xvec;
        let force = flowfield[index];
        // TODO: Find out why it is undefined sometimes
        if (force != undefined) {
            force.setMag(this.fieldForce);
            this.applyForce(force);
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    show() {
        fill(216,17,89);
        noStroke();
        ellipse(this.pos.x, this.pos.y, 4);

        // show trajectory to target
        // stroke(100, 200, 100, 70);
        // strokeWeight(1);
        // line(this.pos.x, this.pos.y, this.destination.x, this.destination.y);
    }

    edge() {
        if (this.pos.x < -this.r) this.pos.x = width + this.r;
        if (this.pos.y < -this.r) this.pos.y = height + this.r;
        if (this.pos.x > width + this.r) this.pos.x = -this.r;
        if (this.pos.y > height + this.r) this.pos.y = -this.r;
    }

    seek() {
        let desired = p5.Vector.sub(this.destination, this.pos);
        desired.setMag(this.maxSpeed);

        let steering = p5.Vector.sub(desired, this.vel);
        steering.limit(this.seekForce);

        this.applyForce(steering);

        if (this.pos.dist(this.destination) < 5) {
            this.target = (this.target + 1) % cities.length;
            this.destination = cities[this.target];
        }
    }
}
