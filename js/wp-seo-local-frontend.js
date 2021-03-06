var wpseo_directions = new Array();
var wpseo_maps = new Array();

function wpseo_show_map(location_data, counter, directionsDisplay, center_lat, center_long, zoom, map_style, show_route, scrollable) {
    var bounds = new google.maps.LatLngBounds();
    var center = new google.maps.LatLng(center_lat, center_long);
    var mobileBreakpoint = 480;

    var wpseo_map_options = {
        zoom: zoom,
        mapTypeControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapTypeId: google.maps.MapTypeId[ map_style.toUpperCase() ],
        draggable: scrollable && window.innerWidth > mobileBreakpoint,
        scrollwheel: false
    }

    // Set center
    if (zoom == -1) {
        for (var i = 0; i < location_data.length; i++) {
            var latLong = new google.maps.LatLng(location_data[i]["lat"], location_data[i]["long"]);
            bounds.extend(latLong);
        }

        center = bounds.getCenter();
    }
    wpseo_map_options.center = center;

    var map = new google.maps.Map(document.getElementById("map_canvas" + ( counter != 0 ? '_' + counter : '' )), wpseo_map_options);

    if (zoom == -1) {
        map.fitBounds(bounds);
    }

    // Set markers + info
    var markers = new Array();
    var infoWindow = new google.maps.InfoWindow({
        content: infoWindowHTML
    });

    for (var i = 0; i < location_data.length; i++) {
        // Create info window HTML
        var infoWindowHTML = getInfoBubbleText(location_data[i]["name"], location_data[i]["address"], location_data[i]["zip_city"], location_data[i]["country"], location_data[i]["show_country"], location_data[i]["phone"], location_data[i]["phone_2nd"], location_data[i]["url"], location_data[i]['show_url']);

        var latLong = new google.maps.LatLng(location_data[i]["lat"], location_data[i]["long"]);
        markers[i] = new google.maps.Marker({
            position: latLong,
            map: map,
            html: infoWindowHTML
        });
    }
    for (var i = 0; i < markers.length; i++) {
        var marker = markers[i];
        google.maps.event.addListener(marker, "click", function () {
            infoWindow.setContent(this.html);
            infoWindow.open(map, this);
        });
    }

    if (show_route && location_data.length >= 1) {
        directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(map);
        directionsDisplay.setPanel(document.getElementById("directions" + ( counter != 0 ? '_' + counter : '' )));
    }

    return directionsDisplay;
}

function getInfoBubbleText(business_name, business_address, business_city_zip, business_country, show_country, business_phone, business_phone_2nd, business_url, show_url) {
    var infoWindowHTML = '<div class="wpseo-info-window-wrapper">';

    var showLink = false;
    if (business_url != undefined && wpseo_local_data.has_multiple_locations != '' && business_url != window.location.href )
        showLink = true;

    if( showLink )
        infoWindowHTML += '<a href="' + business_url + '">';
    infoWindowHTML += '<strong>' + business_name + '</strong>';
    if( showLink )
        infoWindowHTML += '</a>';
    infoWindowHTML += '<br>';
    infoWindowHTML += business_address + '<br>';
    infoWindowHTML += business_city_zip + '<br>';
    if (show_country && business_country != '')
        infoWindowHTML += business_country + '<br>';

    if (show_url && business_url != '')
        infoWindowHTML += '<a href="' + business_url + '">' + business_url + '</a><br>';

    if (business_phone != '')
        infoWindowHTML += '<a href="tel:' + business_phone + '">' + business_phone + '<br>';

    if (business_phone_2nd != '')
        infoWindowHTML += '<a href="tel:' + business_phone_2nd + '">' + business_phone_2nd + '<br>';

    infoWindowHTML += '</div>';

    return infoWindowHTML;
}

function wpseo_calculate_route(dirDisplay, coords_lat, coords_long, counter) {
    if( document.getElementById( 'wpseo-sl-coords-lat' ) != null )
        coords_lat = document.getElementById( 'wpseo-sl-coords-lat' ).value;
    if( document.getElementById( 'wpseo-sl-coords-long' ) != null )
        coords_long = document.getElementById( 'wpseo-sl-coords-long' ).value;

    var start = document.getElementById("origin" + ( counter != 0 ? "_" + counter : "" )).value;
    var end = new google.maps.LatLng(coords_lat, coords_long);
    var unit_system = google.maps.UnitSystem.METRIC;
    if (wpseo_local_data.unit_system == 'IMPERIAL')
        unit_system = google.maps.UnitSystem.IMPERIAL;


    // Change button to link to Google Maps. iPhones and Android phones will automatically open them in Maps app, when available.
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        var url = 'https://www.google.com/maps?saddr=' + escape( start ) + '&daddr=' + coords_lat + ',' + coords_long;
        window.open( url, '_blank' );

        return false;
    }
    else {
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng( coords_lat, coords_long );

        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if( status == google.maps.GeocoderStatus.OK && results[0] ) {
                end = results[0].formatted_address;

                var request = {
                    origin: start,
                    destination: end,
                    provideRouteAlternatives: true,
                    optimizeWaypoints: true,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING,
                    unitSystem: unit_system
                };

                var directionsService = new google.maps.DirectionsService();

                directionsService.route(request, function (response, status2) {
                    if (status2 == google.maps.DirectionsStatus.OK) {
                        dirDisplay.setDirections(response);
                    }
                    else if (status2 == google.maps.DirectionsStatus.ZERO_RESULTS) {
                        var noroute = document.getElementById( 'wpseo-noroute' );
                        noroute.setAttribute( 'style', 'clear: both; display: block;' );
                    }
                });
            }
        });        
    }
}


function wpseo_sl_show_route( obj, coords_lat, coords_long ) {
    $ = jQuery;

    // Create hidden inputs to pass through the lat/long coordinates for which is needed for calculating the route.
    $('.wpseo-sl-coords').remove();
    var inputs = '<input type="hidden" class="wpseo-sl-coords" id="wpseo-sl-coords-lat" value="' + coords_lat + '">';
    inputs += '<input type="hidden" class="wpseo-sl-coords" id="wpseo-sl-coords-long" value="' + coords_long + '">';

    $('#wpseo-directions-form').append( inputs ).submit();
    $('#wpseo-directions-wrapper').slideUp( function() {
       $( this ).insertAfter( $(obj).parents('.wpseo-result') ).slideDown(); 
    });
}