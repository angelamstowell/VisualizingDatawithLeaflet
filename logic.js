// Save API endpoint in queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
    createFeatures(data.features);
    console.log(data.features)
});

function createFeatures(earthquakeData) {

    // Define a function to run once for each function in array
    // Create popup describing the place and time of the earthquake
    function onEachFeature(feature, layer) {
        layer.bindPopup("<h3>" + feature.properties.place +
            "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
    }

    // Circle Radius by magnitude
    function radiusSize(magnitude) {
        return magnitude * 20000;
    }

    // Circle Color by Magnitude
    function circleColor(magnitude) {
        if (magnitude < 1) {
            return "#ccff33"
        } else if (magnitude < 2) {
            return "#ffff33"
        } else if (magnitude < 3) {
            return "#ffcc33"
        } else if (magnitude < 4) {
            return "#ff9933"
        } else if (magnitude < 5) {
            return "#ff6633"
        } else {
            return "#ff3333"
        }
    }

    // GeoJSON layer
    var earthquakes = L.geoJSON(earthquakeData, {
        pointToLayer: function(earthquakeData, latlng) {
            return L.circle(latlng, {
                radius: radiusSize(earthquakeData.properties.mag),
                color: circleColor(earthquakeData.properties.mag),
                fillOpacity: 1
            });
        },
        onEachFeature: onEachFeature
    });

    // Earthquake layer through createMap
    createMap(earthquakes);
}

function createMap(earthquakes) {

    // Define outdoormap, satellitemap, and grayscalemap layers
    var outdoorsmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.outdoors",
        accessToken: API_KEY
    });

    var satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.satellite",
        accessToken: API_KEY
    });

    var grayscalemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.light",
        accessToken: API_KEY
    });

    // Faultline layer
    var faultLine = new L.LayerGroup();

    // Baselayers
    var baseMaps = {
        "Outdoor Map": outdoorsmap,
        "Greyscale Map": grayscalemap,
        "Satellite Map": satellitemap
    };

    // Overlay layer
    var overlayMaps = {
        Earthquakes: earthquakes,
        FaultLines: faultLine
    };

    //Display on load
    var myMap = L.map("map", {
        center: [
            37.09, -95.71
        ],
        zoom: 4,
        layers: [outdoorsmap, earthquakes, faultLine]
    });

    // Create a layer control
    // Pass in our baseMaps and overlayMaps
    // Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);

    // Faultline data
    var faultlinequery = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";

    // Create faultlines and add to the faultline layer
    d3.json(faultlinequery, function(data) {
        L.geoJSON(data, {
            style: function() {
                return { color: "orange", fillOpacity: 0 }
            }
        }).addTo(faultLine)
    })

    // Lgend colors
    function getColor(d) {
        return d > 5 ? '#ff3333' :
            d > 4 ? '#ff6633' :
            d > 3 ? '#ff9933' :
            d > 2 ? '#ffcc33' :
            d > 1 ? '#ffff33' :
            '#ccff33';
    }

    // Add legend to the map
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function(map) {

        var div = L.DomUtil.create('div', 'info legend'),
            mags = [0, 1, 2, 3, 4, 5],
            labels = [];

        for (var i = 0; i < mags.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(mags[i] + 1) + '"></i> ' +
                mags[i] + (mags[i + 1] ? '&ndash;' + mags[i + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(myMap);
}
