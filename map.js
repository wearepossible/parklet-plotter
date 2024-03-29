// Set this to false if you want parklets to be saved in the database
const dev = false;

// Access token
mapboxgl.accessToken = 'pk.eyJ1Ijoid2VhcmVwb3NzaWJsZSIsImEiOiJja3FrcXk1bnMwZXduMnBuc2kwMnY5eDBwIn0.9mpiXSSZEwSlwSeKs6XyNw';

// Lat Lon hash regex
const llRegEx = /^-*\d*\d\.\d\d\d\d\d,-*\d*\d\.\d\d\d\d\d$/;
const urlprefix = window.location.href;

// HTML for map popup
const startHTML = "<p>Is this the perfect place for a parklet?</p><button class='btn' id='btn-submit' onclick='submit()'>Submit to our database</button>"
let endHTML = `<p>Thanks! Here's a link to your parklet:</p><input type='text' id='urlboxmap'> <span id='copybutton' onmousedown='copyURL()' onmouseup='unbold()'>copy</span><p>Now <a href='https://action.wearepossible.org/page/110835/action/1?supporter.questions.1356294=' target='_blank'>write to your councillor</a> to show your support for parklets.</p>`
let popup
let marker
const el = document.createElement('div');
el.className = 'marker';

// Set up the map
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/wearepossible/ckmx9appa0lw117n2trmek7bq', // style URL
    center: [-0.12, 51.51], // starting position [lng, lat]
    zoom: 10 // starting zoom
});

// Add the search control to the map.
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    })
);

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// Fly to different cities
const gotoLondon = () => map.flyTo({ center: [-0.12, 51.51], zoom: 10 });
const gotoBirmingham = () => map.flyTo({ center: [-1.90, 52.48], zoom: 11 });
const gotoLeeds = () => map.flyTo({ center: [-1.55, 53.80], zoom: 11 });
const gotoBristol = () => map.flyTo({ center: [-2.59, 51.45], zoom: 11 });

// Collection of permanent parklets
const permanent = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'properties': {
                'description': "Our Permanent Parklet",
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [-0.081846, 51.54323]
            }
        }]
}

// Create a function that executes when the button is clicked
const locApprove = () => {

    // Get the user's actual latitude and longitude
    navigator.geolocation.getCurrentPosition(function (position, html5Error) {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Move the world map to your location
        map.flyTo({ center: [userLon, userLat], zoom: 15 });

    });
};

// Function to switch layers
const layerChange = (chosenLayer) => {

    const layers = ["public_greenspace", "private_greenspace", "imd", "carsperperson"]

    // Turn off all layers
    for (let layer of layers) {
        map.setLayoutProperty(layer, 'visibility', 'none');
        document.getElementById(layer).style.display = "none";
        document.getElementById(`btn-${layer}`).style.background = "#BF0978";
        document.getElementById(`btn-${layer}`).style.color = "#ffffff";
        document.getElementById(`btn-${layer}`).style.outline = "none";
    }

    // Turn on the layer you want
    map.setLayoutProperty(chosenLayer, 'visibility', 'visible');
    document.getElementById(chosenLayer).style.display = "block";
    document.getElementById(`btn-${chosenLayer}`).style.background = "#ffffff";
    document.getElementById(`btn-${chosenLayer}`).style.color = "#BF0978";
    document.getElementById(`btn-${chosenLayer}`).style.outline = "2px solid #BF0978";

}

// Create variables to hold the details of the location
let locID, loc, locLat, locLng;

// Check if there's a hash in the URL
if (window.location.hash) {

    // Hash exists
    const hash = window.location.hash.substring(1) // Chop off the #

    // Check that it matches the right format for lat/lon
    if (llRegEx.test(hash)) {

        // Assign to locLat and locLng
        locLat = hash.split(",")[0]
        locLng = hash.split(",")[1]

        if (marker) marker.remove();

        marker = new mapboxgl.Marker(el)
            .setLngLat([locLng, locLat])
            .addTo(map);

        // Zoom to location
        map.flyTo({ center: [locLng, locLat], zoom: 16 });

    } else {
        // log an error
        console.log("Hash is not a valid lat/lon pair")
    }
}

// Click to place a parklet
map.on('click', function (e) {

    // Save location of click
    locLat = e.lngLat.lat.toFixed(5);
    locLng = e.lngLat.lng.toFixed(5);

    if (marker) marker.remove();

    marker = new mapboxgl.Marker(el)
        .setLngLat([locLng, locLat])
        .addTo(map);

    popup = new mapboxgl.Popup({ offset: 20, maxWidth: '280px' })
        .setLngLat([locLng, locLat])
        .setHTML(startHTML)
        .addTo(map);

    // Zoom to location
    map.flyTo({ center: [locLng, locLat], zoom: 16 });
});

// This function runs when the button is clicked
function submit() {

    // Save timestamp and lat/lon into an object
    const pointData = {
        datetime: new Date().toLocaleString('en-GB', { timeZone: 'UTC' }),
        lat: locLat,
        lng: locLng
    };

    // If a point is logged then write it to the database
    if (pointData.lat && pointData.lng) {

        if (!dev) { // Don't submit to database if dev mode is on
            SheetDB.write('https://sheetdb.io/api/v1/m6npscfti1l0q', { sheet: 'parklets', data: pointData }).then(function (result) {
                console.log(result);
            }, function (error) {
                console.log(error);
            });
        }

        // Figure out the url
        url = urlprefix.concat("#", locLat, ",", locLng)

        // Figure out the share link
        endHTML = `<p>Thanks! Here's a link to your parklet:</p><input type='text' id='urlboxmap'> <span id='copybutton' onmousedown='copyURL()' onmouseup='unbold()'>copy</span><p>Now <a href='https://action.wearepossible.org/page/110835/action/1?supporter.questions.1356294=${locLat.concat(',', locLng)}' target='_blank'>write to your councillor</a> to show your support for parklets.</p>`

        // Update the map popup
        popup.setHTML(endHTML)

        // Put the url in the urlbox
        document.getElementById("urlboxmap").value = url
    }
}

// This runs when the copy button is clicked (mousedown)
function copyURL() {
    navigator.clipboard.writeText(document.getElementById("urlboxmap").value);
    document.getElementById("copybutton").style.fontWeight = 800;
}

// This runs when the copy button is unclicked (mouseup)
function unbold() {
    document.getElementById("copybutton").style.fontWeight = 400;
}

// This runs once the page has loaded and grabs the data from the gsheet to render
$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKSfj06zMOpj_5pAskl6l7D_tpmaqsr9Ewp2EBvxpjs0Sbol149VbUotOMErUHbGo5BBayLt2Dx64n/pub?gid=0&single=true&output=csv',
        dataType: "text",
        success: function (csvData) { makeGeoJSON(csvData); }
    });
});

// This runs once the data is loaded and imports all the previously-saved parklets
function makeGeoJSON(csvData) {

    csv2geojson.csv2geojson(csvData, {
        latfield: 'lat',
        lonfield: 'lng',
        delimiter: ','
    }, function (err, data) {
        if (err) throw err;

        map.addLayer({
            'id': 'csvData',
            'type': 'circle',
            'source': {
                'type': 'geojson',
                'data': data
            },
            'paint': {
                'circle-radius': 10,
                'circle-color': '#64C4DE',
                'circle-stroke-color': 'white',
                'circle-stroke-width': 2,
                'circle-opacity': 0.5
            }
        })
    });

    map.addSource('permanent', {
        'type': 'geojson',
        'data': permanent
    });

    map.addLayer({
        'id': 'perma-circles',
        'type': 'symbol',
        'source': 'permanent',
        'layout': {
            'text-field': ['get', 'description'],
            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            'text-radial-offset': 0.7,
            'text-justify': 'auto',
            'text-font': ['Poppins Bold'],
            'text-size': 14
        },
        'paint': {
            'text-color': '#BF0978',
            'text-halo-color': '#ffffff',
            'text-halo-width': 3,
            'text-halo-blur': 5
        }
    });

    map.addLayer({
        'id': 'perma-labels',
        'type': 'circle',
        'source': 'permanent',
        'paint': {
            'circle-radius': 5,
            'circle-color': '#BF0978',
            'circle-stroke-color': 'white',
            'circle-stroke-width': 2,
            'circle-opacity': 1
        }
    });
};