// Options for map
const options = {
    lat: 20,
    lng: 0,
    zoom: 2,
    style: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
};

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
let mapReady = false;
let dataReady = false;

function setup() {
    // Setup canvas and controls
    canvas = createCanvas(800, 600);
    slider = createSlider(1999, 2017, 1); // 2018 data is incomplete
    slider.position(width - 300, height - 50);
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
    countries2coord = loadJSON('countries2coord.json', completedLoad);
    monthly_flow = loadJSON('monthly_flow.json', completedLoad);

    // Setup map
    let mappa = new Mappa('Leaflet');
    // Create a tile map and overlay the canvas on top.
    myMap = mappa.tileMap(options);

    myMap.overlay(canvas, () => {
        // shamefull delete because I suck at CSS
        // delete zoom controls
        let controls = selectAll('.leaflet-left');
        for (let element of controls) {
            element.remove();
        }
        // delete attribution
        attribution = selectAll('.leaflet-control-attribution');
        for (let element of attribution) {
            element.remove();
        }
        mapReady = true;
    });

    fill(70, 203, 31);
    stroke(100);
    frameRate(30);
    start_color = color(220, 50, 80, 95);
    end_color = color(80, 220, 100, 95);
}
//

// The draw loop is fully functional but we are not using it for now.
function draw() {
    if (mapReady && dataReady) {
        clear();
        let zoom = myMap.zoom();

        // show current year/month
        textSize(28);
        fill(50);
        text(str(year) + ' - ' + monthsnames[month], 20, height - 50);

        // draw asylum seekers
        noStroke();
        for (let entry of monthly_flow[year][month]) {
            let [from, to, count] = entry;
            let start_coord = countries2coord[from];
            let end_coord = countries2coord[to];
            let size = sqrt(count);

            if (count > 100) {
                if (start_coord != undefined && end_coord != undefined) {
                    // Only draw them if the position is inside the current map bounds. We use a
                    // Leaflet method to check if the lat and lng are contain inside the current
                    // map. This way we draw just what we are going to see and not everything. See
                    // getBounds() in http://leafletjs.com/reference-1.1.0.html
                    if (
                        myMap.map
                            .getBounds()
                            .contains({ lat: start_coord[0], lng: start_coord[1] }) ||
                        myMap.map.getBounds().contains({ lat: end_coord[0], lng: end_coord[1] })
                    ) {
                        // Transform lat/lng to pixel position
                        start = myMap.latLngToPixel(start_coord);
                        end = myMap.latLngToPixel(end_coord);

                        stroke(100, 30);
                        //strokeWeight(count / 100);
                        line(start.x, start.y, end.x, end.y);
                        let alpha = sin(progress * HALF_PI);
                        let px = start.x * (1 - alpha) + end.x * alpha;
                        let py = start.y * (1 - alpha) + end.y * alpha;
                        noStroke();
                        fill(lerpColor(start_color, end_color, progress));
                        ellipse(px, py, (size * zoom) / scaling);
                        //ellipse(start.x, start.y, 10);
                        //ellipse(end.x, end.y, 10);
                    }
                }
            }
        }
        // show next month asylum seekers to smoothen transition
        if (month < 11) {
            fill(start_color);
            noStroke();
            for (let entry of monthly_flow[year][month + 1]) {
                let [from, _, count] = entry;
                let start_coord = countries2coord[from];
                let size = sqrt(count);
                if (count > 100) {
                    if (start_coord != undefined) {
                        start = myMap.latLngToPixel(start_coord);
                        ellipse(start.x, start.y, ((size * zoom) / scaling) * progress);
                    }
                }
            }
        }

        // show slider selection
        if (selecting_year && mouseIsPressed) {
            textSize(28);
            fill(50);
            text(str(slider.value()), mouseX, mouseY - 20);
        }

        // update progress
        if (progress < 1) {
            progress += 0.01;
        } else {
            progress = 0;
            if (month < 11) {
                month += 1;
            } else {
                month = 0;
                if (year < 2017) {
                    year += 1;
                } else {
                    year = 1999;
                }
                slider.value(year);
            }
        }
    }
}
