function handleSearchResp(data){
    var parent = $("#playlist-movie-search-results")
    if (data.kind === "tv") {
        parent = $("#playlist-tv-search-results")
    };
    parent.empty();

    var html = '<div class="radio">' + 
                '<label>' + 
                '<input type="radio" name="radios-{{kind}}" value="{{index}}" {{checked}}>' + 
                '{{name}}' + 
                '</label>' + 
                '</div>'

    for (var i = 0; i < data.items.length; i++) {
        var item = data.items[i]
        var copy = html
        copy = copy.replace(new RegExp("{{index}}", "g"), i)
        copy = copy.replace(new RegExp("{{name}}", "g"), item.Title)
        if(i === 0){
            copy = copy.replace(new RegExp("{{checked}}", "g"), "checked")
        }else{
            copy = copy.replace(new RegExp("{{checked}}", "g"), "")
        }
        copy = copy.replace(new RegExp("{{kind}}", "g"), data.kind)
        parent.append(copy)
    }

    lastSearch = data;
    if (data.kind === "tv") {
        lastTVSearch = data
    }else{
        lastMovieSearch = data
    }
}

function handleStatus(data){
    console.log("Handling status")
    lastStatus = data


    $("#header-status").text(data.action)
    
    if(data.playing){
        $("#play-button").addClass("hidden")
        $("#pause-button").removeClass("hidden")    
    }else{
        $("#play-button").removeClass("hidden")
        $("#pause-button").addClass("hidden")
    }

    // The current active timestamp
    var firstStr = secondsToHMSString(data.timestamp)
    var secondStr = "?"
    if (lastPlaylist) {
        var currentlyPlaying = lastPlaylist.items[lastPlaylist.currentIndex]
        if(currentlyPlaying){
            // The full duration of the item were playing
            secondStr = secondsToHMSString(currentlyPlaying.duration/1000)
            
            var beingPlayed = currentlyPlaying.title
            if (currentlyPlaying.kind === 0){
                // Things are a bit different if this is a tv show
                beingPlayed = currentlyPlaying.showTitle + " (S"+currentlyPlaying.season+"E"+currentlyPlaying.episode+")" + ": " + beingPlayed
            }
            $("#header-nowplaying").text(beingPlayed)
        }
    };
    //$("#header-timestamp").text(firstStr + "/" + secondStr)

    var tooltip = "Viewers<br>"
    var numViewers = 0
    var total = 0
    for(var key in data.viewers){
        if (data.viewers.hasOwnProperty(key)) {
            var watching = data.viewers[key]
            //tooltip += key + ": " + "<br>"
            tooltip += key + "<br>"
            if (watching) {
                numViewers++
            };
            total++
        };
    }
    //$("#header-viewers").text(numViewers + "("+total+")")
    $("#header-viewers").text(total)
    $("#header-viewers")[0].dataset.originalTitle = tooltip
}

function handlePlayistUpdate(data){
    console.log("Handling playlist")
    lastPlaylist = data

    var parent = $("#playlist-body")
    parent.empty();
    var html = '<tr>' + 
                '<td>{{index}}</td>' + 
                '<td>{{title}}</td>' + 
                '<td>{{episode}}</td>' + 
                '<td>{{duration}}</td>' + 
                '<td>' + 
                    '<button type="button" class="btn btn-default" data-tooltip="tooltip" data-placement="bottom" title="Play" onclick="playItem({{index}})">' +
                        '<span class="glyphicon glyphicon-play"></span>' + 
                    '</button>' +
                '</td>' + 
                '</tr>'

    for (var i = 0; i < data.items.length; i++) {
        var item = data.items[i]
        var copy = html
        copy = copy.replace(new RegExp("{{index}}", "g"), i)
        var title = item.title
        if(item.showTitle !== ""){
            title = item.showTitle + ": " + title
        }
        copy = copy.replace(new RegExp("{{title}}", "g"), title)
        var ep = item.season + "." + item.episode
        copy = copy.replace(new RegExp("{{episode}}", "g"), ep)
        copy = copy.replace(new RegExp("{{duration}}", "g"),  secondsToHMSString(item.duration/1000))
        parent.append(copy)
    };
}

function handleSettings(data){
    lastSettings = data
    updateSettingsDialog()
}

function handleSetName(data){
    localStorage.setItem("name", data.name);
}

function handlePlay(data){
    console.log("Someone pressed play!");
}

function handlePause(data){
    console.log("Someone pressed pasue!")
}

function handleNext(data){
    console.log("someone pressed next!")
}

function handlePrev(data){
    console.log("Someone pressed previous!")
}

function handleChatMsg(data){
    insertChatMessage(data.from, data.msg, data.kind)
}

var notificationsEnabled = true;
function handleNotification(data){
    if (notificationsEnabled || data.bypass) {
        insertChatMessage("sys", data.msg, "sys")    
    };
}