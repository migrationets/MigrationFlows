// Create an instance of Leaflet
let myMap;
let data;
let countries2coord;
let monthly_flow;

let canvas;
let meteorites;
let t = 0;
let progress = 0;
let month = 0;
let year = 1999;
let scaling = 5;

let monthsnames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

let start, end;
let start_color, end_color;
let slider;
let selecting_year = false;
let dataReady = false;
let prev;
let plot = [];

function setup() {
    // Setup canvas and controls
    canvas = createCanvas(800, 600);
    slider = createSlider(1999, 2017, 1); // 2018 data is incomplete
    slider.position(width - 400, height - 50);
    slider.style('width', '200px');
    slider.style('z-index', '999');

    slider.mouseReleased(() => {
        year = slider.value();
        progress = 0;
        month = 0;
    });
    // when dragging the slider show the years
    slider.mouseOver(() => {
        selecting_year = true;
    });
    slider.mouseOut(() => {
        selecting_year = false;
    });

    // Setup data, can't use preload or it will mess with iframe sizing
    let loadCounter = 0;
    let completedLoad = () => {
        loadCounter += 1;
        if (loadCounter >= 3) {
            dataReady = true;
        }
    };
    data = loadJSON('countries.json', completedLoad);
    iso2xy = loadJSON('iso2xy.json', completedLoad);
    monthly_flow = loadJSON('monthly_flow.json', completedLoad);

    fill(70, 203, 31);
    stroke(100);
    frameRate(30);
    start_color = color(220, 50, 80, 95);
    end_color = color(80, 220, 100, 95);
    prev = createVector(0, 0);

    noLoop();
    console.log('compass stopped');
}
//

// The draw loop is fully functional but we are not using it for now.
function draw() {
    if (dataReady) {
        background(50);

        // show current year/month
        textSize(28);
        fill(255);
        noStroke();
        textAlign(LEFT);
        text(str(year) + ' - ' + monthsnames[month], 160, height - 50);

        push();
        // MOVE DRAWING TO THE CENTER
        translate(width / 2 + 100, height / 2 + 50);

        // Prepare compass
        fill(120);
        noStroke();
        textAlign(CENTER);
        let radius = 100;
        textSize(28);
        text('N', 0, -radius);
        text('S', 0, radius + 22);
        text('E', radius + 8, 8);
        text('W', -radius - 13, 8);

        // Compass frame
        noFill();
        stroke(120);
        strokeWeight(1);
        ellipse(0, 0, radius * 2);
        strokeWeight(0.5);
        line(-radius, 0, radius, 0);
        line(0, -radius, 0, radius);

        // draw asylum seekers
        let result = createVector(0, 0);

        // Individual Vectors
        let offset = -250;
        strokeCap(ROUND);
        stroke(200);
        strokeWeight(1);
        let tot = 0;
        for (let entry of monthly_flow[year][month]) {
            let [from, to, count] = entry;
            if (iso2xy[from] != undefined && iso2xy[to] != undefined) {
                let [start_x, start_y] = iso2xy[from];
                let [end_x, end_y] = iso2xy[to];
                let start = createVector(start_x, start_y);
                let end = createVector(end_x, end_y);
                let dir = p5.Vector.sub(end, start);
                dir.setMag(count / 20);
                result.add(dir);
                line(offset, 0, offset + dir.x, dir.y);
                tot += count;
            }
        }
        // Other frame
        stroke(120);
        noFill();
        ellipse(offset, 0, radius * 2);

        // Compass Needle
        let from = color(0, 255, 0);
        let to = color(255, 0, 0);
        let col = lerpColor(from, to, tot / 200000);
        stroke(col);
        strokeWeight(5);
        result.setMag(radius);
        line(0, 0, lerp(prev.x, result.x, progress), lerp(prev.y, result.y, progress));
        pop();

        // VALUES PLOTS
        push();
        stroke(255);
        translate(230, 160);
        // y-axis
        line(0, 0, 0, -100);
        // x.axis
        line(0, 0, 300, 0);

        fill(200);
        noStroke();
        textSize(15);
        text('Time', 130, 17);
        push();
        rotate(-HALF_PI);
        text('Refugees', 18, -5);
        pop();

        fill(from);
        rect(-10, -10, 10, 10);

        fill(to);
        rect(-10, -100, 10, 10);

        stroke(255);
        noFill();
        beginShape();
        let idx = 0;
        let last = 0;
        for (let val of plot) {
            vertex(idx, val * -100);
            idx += 10;
            last = val; // yup I'm saving the last one because I don't like plot[plot.length - 1]
        }
        endShape();
        textSize(20);
        noStroke();
        fill(col);
        text(str(int(last * 200000)), idx - 8, last * -100 + 7);
        pop();

        // show slider selection
        if (selecting_year && mouseIsPressed) {
            textSize(28);
            stroke(255);
            fill(255);
            text(str(slider.value()), mouseX, mouseY - 20);
        }

        // update progress
        if (progress < 1) {
            progress += 0.1;
        } else {
            plot.push(tot / 200000);
            if (plot.length > 30) {
                plot.shift();
            }
            progress = 0;
            prev = result;
            if (month < 11) {
                month += 1;
            } else {
                month = 0;
                if (year < 2017) {
                    year += 1;
                } else {
                    year = 1999;
                    plot = [];
                }
                slider.value(year);
            }
        }
    }
}
