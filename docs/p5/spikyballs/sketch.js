// Options for map
const options = {
    lat: 40,
    lng: 20,
    zoom: 3,
    style: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
};

// Create an instance of Leaflet
const mappa = new Mappa('Leaflet');
let myMap;
let canvas;
let countries;
let overlayLoaded = false;
let dataLoaded = false;

function setup() {
    canvas = createCanvas(800, 600);

    // Create a tile map and overlay the canvas on top.
    myMap = mappa.tileMap(options);
    myMap.overlay(canvas, () => {
        overlayLoaded = true;
    });

    // Only redraw the countries when the map change and not every frame.
    //myMap.onChange(drawCountries);
    countries = loadJSON('ISO2coords.json', () => {
        dataLoaded = true;
    });

    fill(70, 203, 31);
    stroke(100);

    noCursor();
}

function draw() {
    clear();
    if (overlayLoaded && dataLoaded) {
        let mouse = createVector(mouseX, mouseY);
        for (const [ISO, coords] of Object.entries(countries)) {
            // Get the lat/lng of each meteorite
            const [latitude, longitude] = coords;

            // Only draw them if the position is inside the current map bounds. We use a
            // Leaflet method to check if the lat and lng are contain inside the current
            // map. This way we draw just what we are going to see and not everything. See
            // getBounds() in http://leafletjs.com/reference-1.1.0.html
            if (
                myMap.map.getBounds().contains({
                    lat: latitude,
                    lng: longitude
                })
            ) {
                // Transform lat/lng to pixel position
                const { x, y } = myMap.latLngToPixel(latitude, longitude);
                let pos = createVector(x, y);
                let dir = p5.Vector.sub(pos, mouse);
                dir.setMag(30);

                let size = 5 + myMap.zoom();
                noStroke();
                ellipse(x, y, size, size);
                stroke(50);
                line(mouseX, mouseY, mouseX + dir.x, mouseY + dir.y);
            }
        }
    }
}
