$(document).ready(function () {
    const locationElmts = $("#location");
    const locationBtn = locationElmts.find("#location-btn");
    const locationInput = locationElmts.find("#location-input");
    const severityFilter = $(".severity-filter");
    const history = $("#history-btns");
    const API_KEY = "a5ecca38271f404f9ae5f7f8c2d005d6";

    let severityLevel = false;
    let location = "";

    locationBtn.on("click", onLocation);
    locationInput.on("keypress", onLocationKeypress);
    locationInput.on("keyup", onLocationClear);
    severityFilter.on("click", onFilter);
    history.on("click", loadFromHistory);
    
    updateHistoryButtons();

    function onFilter(e) {
        // Get requested severity level
        const level = $(e.target).data("level");
        // Ignore if not set
        if (level) {
            // Trigger event for interested parties
            $(window).trigger("filterMarkers", [{
                severity: level
            }]);
        }
    }

    function onLocationKeypress(e) {    
        const keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13') {
           onLocationInput();
        }
        // Prevent propagation to other possible handlers
        e.stopPropagation();
    }

    function onLocationClear() {
        if (!this.value) {
            $(window).trigger("home");
        }
    }

    function onLocationInput() {
        location = locationInput.val().trim();
        onLocation();
    }

    function onLocation() {
        
        if (location.length) {
            const geoQueryURL = encodeURI(`https://api.opencagedata.com/geocode/v1/json?q=${location}&no_annotations=1&key=${API_KEY}`);

            $.ajax({
                url: geoQueryURL,
                method: "GET"
            })
                .then(function (response) {

                    if (!response?.results.length) {
                        // No data
                        console.log("No data available - ideally switch to a fallback API");
                    } else {
                        const lat = response.results[0].geometry.lat;
                        const lng = response.results[0].geometry.lng;
                        const warningsURL = `https://environment.data.gov.uk/flood-monitoring/id/floods?lat=${lat}&long=${lng}&dist=40`;
                        const items = [];

                        $.ajax({
                            url: warningsURL,
                            method: "GET"
                        })
                            .then(function (response) {

                                if (!response.items.length) {
                                    // No data
                                    console.log("No data available - ideally switch to a fallback API");
                                } else {
                                    itemData = response.items;
                                    updateHistory(location);
                                    // Trigger event for interested parties
                                    $(window).trigger("location", [{
                                        location: location,
                                        items: itemData
                                    }]);
                                }
                            });
                    }
                });

        } else {
            console.log("Please enter the name of a town, city or county");
        }
    }
    
    function updateHistoryButtons() {
        // Clear existing buttons
        history.empty();
        // Get history data
        var historyData = JSON.parse(window.localStorage.getItem("floodHistory")) || [];
        // Max of five items in history
        
        historyData = historyData.slice(Math.max(historyData.length - 5, 0));
        // Add the buttons
        for (let i = 0; i < historyData.length; i++) {
            // Get location string
            const historyLocation = historyData[i];
            // Make button
            const locationBtn = `<button class="btn btn-outline-secondary btn-wide btn-block mb-3" type="button" id="searchHistoryOne-btn" data-location="${historyLocation}">${historyLocation}</button>`
            //   Add to DOM
            history.prepend(locationBtn);
        }
    }
    
    function updateHistory(location) {
        // Get existing history data
        let historyData = JSON.parse(window.localStorage.getItem("floodHistory")) || [];
    
        // Remove previous entry for this city so searches remain chronological
        historyData = historyData.filter(function (item) {
            return item !== location;
        });
    
        // Add latest search to updated History - store only city name, not ephemeral weather data
        historyData.push(location);
    
        // Update in local storage
        window.localStorage.setItem("floodHistory", JSON.stringify(historyData));
    
        // Update DOM
        updateHistoryButtons();
    }

    function loadFromHistory(e) {
        let locationString = $(e.target).attr("data-location");

        if (locationString) {
            location = $(e.target).attr("data-location");
            onLocation();
        }
    }
});
