

export const displayMap = (locations) => {
        
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2FtZGVubmlzIiwiYSI6ImNrdDF4YWdqMzA4c20ydHIxcnVoeGtnZXgifQ.Jb0qO07ptb8Ff8-PRgddJg';
    var map = new mapboxgl.Map({
        container: 'map',   // this is mean to put the map within an element with the id of map
        style: 'mapbox://styles/samdennis/ckt1yeuxo1gyh17mc0djktkgf',
        scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
    });


    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc =>{
        // Create a marker 
        const el = document.createElement('div');
        el.className = 'marker';
        // Add a marker 
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
        // Add popup 
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day} ${loc.description}</p>`).addTo(map);
        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds,{
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}
