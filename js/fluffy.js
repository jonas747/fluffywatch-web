var NetEvents = {
    EvtSetName:               1,
    EvtPlaylist:              2,
    EvtStatus:                3,
    EvtSearch:                4,
    EvtPlaylistAdd:           5,
    EvtPlaylistRemove:        6,
    EvtPlaylistMove:          7,
    EvtSettings:              8,
    EvtSetSettings:           9,
    EvtPlay:                  10,
    EvtPause:                 11,
    EvtNext:                  12,
    EvtPrev:                  13,
    EvtSeek:                  14,
    EvtPlaylistClear:         15,
    EvtUserJoin:              16,
    EvtUserLeave:             17,
    EvtWatchingStateChange:   18,
    EvtChatMessage:           19,
    EvtNotification:          20,
    EvtAuth:                  22,
    EvtChatCmd:               23,
    EvtReloadPlaylist:        24
}

var pw = ""
var globaltest;
var lastStatus;
var lastTvSearch;
var lastMovieSearch;

$("#settings-key").on("change", function(data){
    pw = $("#settings-key").val();
})

$("#button-refresh").on("click", function(){
    querySettings();
})

$("#play-button").on("click", function(){
    // Make requst to play
    console.log("Pressed play")
    engine.sendMessage(NetEvents.EvtPlay, {index: -1}) // Just an empty object should work?
})

$("#pause-button").on("click", function(){
    // Make requst to /pause
    console.log("Pressed pause")
    engine.sendMessage(NetEvents.EvtPause)
})

$("#next-button").on("click", function(){
    // Make requst to /next
    console.log("Pressed next")
    engine.sendMessage(NetEvents.EvtNext)
})

$("#previous-button").on("click", function(){
    // Make requst to /previous
    console.log("Pressed previous")
    engine.sendMessage(NetEvents.EvtPrev)
})

$("#playlist-clear-button").on("click", function(){
    console.log("Cleared playlist")
    engine.sendMessage(NetEvents.EvtPlaylistClear)
})

$("#playlist-reload-button").on("click", function(){
    console.log("relaoding playlist")
    engine.sendMessage(NetEvents.EvtReloadPlaylist)
})

$("#button-save-settings").on("click", function(){
    var streams  = []
    var split = $("#settings-streams").val().split(" ")
    for (var i = 0; i < split.length; i++) {
        streams[i] = parseInt(split[i])
    };

    var subsEnabled = false;
    if($("#settings-subs").prop("checked")){
        subsEnabled = true;
    }

    var data = {
        scale: parseInt($("#settings-scale").val()),
        maxrate: parseInt($("#settings-max").val()),
        preset: $("#settings-preset").val(),
        streams: streams,
        seek: $("#settings-seek").val(),
   //     subs: parseIng($("#settings-subs").val()),
        subs: subsEnabled,
    }

    engine.sendMessage(NetEvents.EvtSetSettings, data)
})

// Disabled for now, not core
// $("#button-ffprobe").on("click", function(){
//     var dataObj = {
//         path: $("#settings-path").val(),
//     }

//     ajaxRequest("/probe?password="+pw, JSON.stringify(dataObj), "POST", function(data){
//         // Replace newlines with "<br />"
//         var str = data.output.replace(/(?:\r\n|\r|\n)/g, '<br />');
//         showInfo(str)
//     })
// })

$("#settings-button").on("click", function(){
    // Set the settings field in the modal from the status polling
    updateSettingsDialog();
})

function updateSettingsDialog(){
    if(!lastSettings){
        return
    }

    var streams = lastSettings.streams.join(" ")

    $("#settings-scale").val(lastSettings.scale)
    $("#settings-max").val(lastSettings.maxrate)
    $("#settings-preset").val(lastSettings.preset)
    $("#settings-streams").val(streams)
    $("#settings-seek").val(lastSettings.seek)
    //$("#settings-subs").val(lastSettings.subs)
    $("#settings-subs").prop("checked", lastSettings.subsEnabled)    
}

$("#playlist-add-tv-button").on("click", function(){
    var selected = $("input[name=radios-tv]:checked")
    var item = lastTVSearch.items[selected.val()]

    var req = {
        plexItem: item,
        kind: "tv",
        episode: parseInt($("#playlist-tv-episode").val()),
        season: parseInt($("#playlist-tv-season").val()),
        addAllAfter: $("#playlist-tv-add-all").prop("checked"),
    }

    engine.sendMessage(NetEvents.EvtPlaylistAdd, req)
})

$("#playlist-add-movie-button").on("click", function(){
    var selected = $("input[name=radios-movie]:checked")
    var item = lastMovieSearch.items[selected.val()]

    var req = {
        plexItem: item,
        kind: "movie",
    }

    engine.sendMessage(NetEvents.EvtPlaylistAdd, req)
})

function playItem(index){    
    engine.sendMessage(NetEvents.EvtPlay,{index: index});
}

var oldTvField = ""
var oldMovieField = ""
function searcher(){
    var titleTv = $("#playlist-tv-search").val()
    var titleMovie = $("#playlist-movie-search").val()
    if(titleTv !== oldTvField){
        // do a search
        oldTvField = titleTv
        var parent = $("#playlist-tv-search-results")
        if(titleTv === ""){
            parent.empty()
            return
        }

        engine.sendMessage(NetEvents.EvtSearch, {
            title: titleTv,
            kind: "tv",
        });
    }else if(titleMovie !== oldMovieField){
        oldMovieField = titleMovie
        var parent = $("#playlist-movie-search-results")
        if(titleMovie === ""){
            parent.empty()
            return
        }
        engine.sendMessage(NetEvents.EvtSearch, {
            title: titleMovie,
            kind: "movie",
        });
    }
}
window.setInterval(searcher, 1000)

// var lastWatchState = false
// function playerMonitor(){
//     var player = jwplayer('main-player')
//     var state = player.getState();
//     var watching = false
//     if(state !== "idle" && state !== "paused"){
//         watching = true
//     }
//     if (lastWatchState !== watching) {
//         engine.sendMessage(NetEvents.EvtWatchingStateChange, {watching: watching})
//     };

//     lastWatchState = watching
// }
//window.setInterval(playerMonitor, 1000)


function statusUpdater(){
    if (lastStatus.playing) {
        lastStatus.timestamp++
    };
    var firstStr = secondsToHMSString(lastStatus.timestamp)
    var secondStr = "?"
    if (lastPlaylist) {
        var currentlyPlaying = lastPlaylist.items[lastPlaylist.currentIndex]
        if(currentlyPlaying){
            // The full duration of the item were playing
            //secondStr = secondsToHMSString(currentlyPlaying.duration/1000)
            
            var beingPlayed = currentlyPlaying.title
            if (currentlyPlaying.kind === 0){
                // Things are a bit different if this is a tv show
                beingPlayed = currentlyPlaying.showTitle + " (S"+currentlyPlaying.season+"E"+currentlyPlaying.episode+")" + ": " + beingPlayed
            }
            $("#header-nowplaying").text(beingPlayed)
        }
    };
    //$("#header-timestamp").text(firstStr + "/" + secondStr)
    $("#header-timestamp").text(firstStr)
}
window.setInterval(statusUpdater, 1000)

function secondsToHMS(seconds){
    var s = Math.floor(seconds % 60)
    var m = Math.floor((seconds / 60) % 60)
    var h = Math.floor((seconds / 60) / 60)
    return {
        seconds: s,
        minutes: m,
        hours: h,
    }
}

function secondsToHMSString(seconds){
    var hms = secondsToHMS(seconds)
    var str = hms.hours !== 0 ? hms.hours+":" : ""
    str += hms.minutes + ":" + hms.seconds
    return str
}

function ajaxError(req){
    if(req.responseJSON){
        showError(req.responseJSON.error)
    }else{
        showError("Unknown networking error occured during ajax request: " + req.status + " " + req.statusText)
    }
}

function showError(msg){
    $("#error-body").text(msg)
    $("#error-modal").modal()
}

function showInfo(msg){
    console.log("Showing info: ", msg)
    $("#info-body").html(msg)
    $("#info-modal").modal()
}



$(function(){
    if(Hls.isSupported()) {
        
        var config = {
            debug : false,
            autoStartLoad : true,
            maxBufferLength : 15,
            maxBufferSize : 60*1000*1000,
            liveSyncDurationCount : 2,
            liveMaxLatencyDurationCount: 5,
            enableWorker : true,
            fragLoadingTimeOut : 20000,
            fragLoadingMaxRetry : Infinity,
            fragLoadingRetryDelay : 1000,
            manifestLoadingTimeOut : 10000,
            manifestLoadingMaxRetry : Infinity,
            manifestLoadingRetryDelay : 1000,
            fpsDroppedMonitoringPeriod : 5000,
            fpsDroppedMonitoringThreshold : 0.2,
            appendErrorMaxRetry : 200,
        };

        // videojs("video", {}, function(){
        //   // Player (this) is initialized and ready.
        // });

        var video = document.getElementById('video-stream');
        var hls = new Hls(config);
        //hls.loadSource('http://jonas747.com:8080/hls/live.m3u8');
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            console.log("video and hls.js are now bound together !");
            hls.loadSource('/streamdata/playlist.m3u8');
            restarted = false
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED,function() {
            video.play();
        });
        


        var restarted = false
        var lastReset = Date.now();
        function resetStream(){
            if(restarted || Date.now() - lastReset < 10000){
                return;
            }
            lastReset = Date.now();
            restarted = true;
            hls.stopLoad();
            setTimeout(function(){
                hls.detachMedia();
            }, 1000)
            console.log("Restarting");
        }

        hls.on(Hls.Events.MEDIA_DETACHED,function() {
            hls.attachMedia(video);
        });


        hls.on(Hls.Events.ERROR, function(event, data){
            // if(data.fatal) {
            //     // switch(data.type) {
            //     //     case Hls.ErrorTypes.NETWORK_ERROR:
            //     //         // try to recover network error
            //     //         console.log("fatal network error encountered, try to recover");
            //     //         hls.startLoad();
            //     //         break;
            //     //     case Hls.ErrorTypes.MEDIA_ERROR:
            //     //         console.log("fatal media error encountered, try to recover");
            //     //         hls.recoverMediaError();
            //     //         break;
            //     //     default:
            //     //         // cannot recover
            //     //         hls.destroy();
            //     //     break;
            //     // }
            //     // console.log("fatal error");
            //     //hls.loadSource('/streamdata/playlist.m3u8');
            // }else{
                
            // }
            resetStream();
            console.log(data);
        });

        var isLoading = false;
        hls.on(Hls.Events.FRAG_LOADING, function(){
            isLoading = true;
            //console.warn("Loading...");
        });
        hls.on(Hls.Events.FRAG_LOADED, function(){
            isLoading = false;
            //console.warn("Finnished Loading!");
        })

        video.volume = 0.5;
        
        var lastTime = 0;
        var lastTimeSet = Date.now();
        window.setInterval(function(){
            currentTime = video.currentTime;
            var now = Date.now();
            console.log(video.paused)
            if (lastTime === currentTime) {
                if((!video.paused || currentTime == video.duration) && now - lastTimeSet > 3000 && !isLoading){
                    //video.currentTime += 0.1;
                    //hls.loadSource('/streamdata/playlist.m3u8');
                    resetStream();
                }
            }else{
                lastTimeSet = now;
            }
            lastTime = currentTime;

        }, 1000)

        // var countDownTarget = 1481257800000;
        // // Countdown updater
        // window.setInterval(function(){
        //     var timeLeft = countDownTarget - Date.now() 
        //     var shouldveStarted = timeLeft < 0
        //     timeLeft = Math.abs(timeLeft);

        //     var totalSeconds = timeLeft/1000;
        //     var clockSeconds = Math.floor(totalSeconds%60)
        //     var minutes = Math.floor((totalSeconds/60)%60)
        //     var hours = Math.floor((totalSeconds/60)/60)

        //     if(hours < 10){
        //         hours = "0" + hours
        //         if(hours == 0){
        //             hours = "00"
        //         }
        //     }

        //     if(minutes < 10){
        //         minutes = "0" + minutes
        //         if(minutes == 0){
        //             minutes = "00"
        //         }
        //     }


        //     var timeStr = hours + ":" + minutes + ":" + clockSeconds;

        //     var content;
        //     if (shouldveStarted) {
        //         content = "Should have started "+timeStr+", refresh the page?"
        //     }else{
        //         content = timeStr
        //     }

        //     $("#start-countdown").text(content)

        // }, 1000)
    }else{
        console.log("HLS NOT SUPPORTED CANT TO LIVESTREAM PANIC PANIC PANIC KILL HITLER, HACK TIME?? CALL KUNG FURY");
    }


    $('[data-tooltip="tooltip"]').tooltip({html: true});
    
    //engine = new Net.Engine("ws://localhost:7447");
    //engine = new Net.Engine("ws://192.168.1.69:7447");
    engine = new Net.Engine("ws://op.jonas747.com:7447");
    
    engine.addHandler(new Net.Handler(NetEvents.EvtSetName, handleSetName));
    engine.addHandler(new Net.Handler(NetEvents.EvtSearch, handleSearchResp));
    engine.addHandler(new Net.Handler(NetEvents.EvtStatus, handleStatus));
    engine.addHandler(new Net.Handler(NetEvents.EvtPlaylist, handlePlayistUpdate));
    engine.addHandler(new Net.Handler(NetEvents.EvtSettings, handleSettings));
    
    engine.addHandler(new Net.Handler(NetEvents.EvtPlay, handlePlay));
    engine.addHandler(new Net.Handler(NetEvents.EvtPause, handlePause));
    engine.addHandler(new Net.Handler(NetEvents.EvtPrev, handlePrev));
    engine.addHandler(new Net.Handler(NetEvents.EvtNext, handleNext));

    engine.addHandler(new Net.Handler(NetEvents.EvtChatMessage, handleChatMsg));
    engine.addHandler(new Net.Handler(NetEvents.EvtNotification, handleNotification))
;
    engine.onClose= function(){
        insertChatMessage("sys", "Lost connection to server... reload the page to try to connect again", "sys");
    }

    engine.onOpen = function(){
        var id = localStorage.getItem("id");
        if (!id) {
            id = makeid(124);
            localStorage.setItem("id", id)
        };
        engine.sendMessage(NetEvents.EvtAuth, id)
    }

    engine.run();
 
    querySettings();

    insertChatMessage("sys", "Welcome to my yearly 24/7 full run through one piece stream!", "sys");
    insertChatMessage("sys", "Type '/sys' to show/hide sys notifications (leaving,joining etc..)", "sys");
    insertChatMessage("sys", "Join the one piece discord here: discord.gg/onepiece", "sys");

    document.getElementById('chat-input-field').onkeypress = function(e){
        if (!e) e = window.event;
            var keyCode = e.keyCode || e.which;
        if (keyCode == '13'){
            var msg = $("#chat-input-field").val()

            if (msg.length > 0) {
                $("#chat-input-field").val("")

                var split = msg.split(" ")
                var cmd = split[0]                    
                if (cmd === "/setname" || cmd === "/name") {
                    split.splice(0, 1)
                    setName(split.join(" "))
                }else if(cmd === "/mod" || cmd === "/ban"|| cmd === "/unban"||
                    cmd === "/name" || cmd === "/timeout" || cmd === "/demod" ||
                    cmd ===  "/ipban" || cmd === "/ipunban"){
                    split.splice(0, 1)
                    targetName = split.join(" ");
                    if (cmd === "name") {
                        setName(targetName)
                    }else{
                        var obj = {cmd: cmd, target: targetName};
                        engine.sendMessage(NetEvents.EvtChatCmd, obj);
                    }
                }else if(cmd === "/sys"){
                    notificationsEnabled = !notificationsEnabled;
                    localStorage.setItem("sys", !notificationsEnabled);
                    if(notificationsEnabled){
                        insertChatMessage("sys", "sys notifications enabled", "sys");
                    }else{
                        insertChatMessage("sys", "sys notifications are disabled, type '/sys' to toggle", "sys");
                    }
                }else if(cmd ==="/help"){
                    insertChatMessage("sys", "User commands:", "sys");
                    insertChatMessage("sys", "'/name <name>' - Change you name", "sys");
                    insertChatMessage("sys", "'/sys' - Dissable most sys notifications (leaving/joining/namechanges)", "sys");
                    insertChatMessage("sys", "Mod/Admin commands:", "sys");
                    insertChatMessage("sys", "'/ban <name>' - Bans a user (Please use this as little as possible (spammers and griefers) i dont like drama)", "sys");
                    insertChatMessage("sys", "'/unban <name>' - Unbans a user", "sys");
                }else{
                    var obj = {msg: msg};
                    engine.sendMessage(NetEvents.EvtChatMessage, obj)
                }
            };
            return false;
        }
    }

    var name = localStorage.getItem("name")
    if (name) {
        setName(name)
    };

    var sysDisabled = localStorage.getItem("sys");
    if (sysDisabled === "true") {
        notificationsEnabled = false;
        insertChatMessage("sys", "Sys notifications are disabled, type '/sys' to toggle", "sys");
        console.log(sysDisabled);
    };

    var isResizing = false;
    $(document).mousemove(function(evt){
        if(isResizing){
            var newSize = window.innerWidth - evt.clientX; 
            setSidebarSize(newSize);
        }
    })
    
    $("#chat-dragbar").mousedown(function(evt){
        isResizing = true;
    })

    $(document).mouseup(function(){
        isResizing = false;
    })

    setSidebarSize(200);

    window.onresize = function(){
        setSidebarSize(curSidebarSize);
    }

    // $("#login-button").click(function(){
    //     pw = $("#settings-key").val()
    //     if (!pw || pw === "") {
    //         pw = "empty";
    //     };
    //     console.log(pw);

    //     engine.sendMessage(NetEvents.EvtAuth, pw)
    // })
})

function namePrompt(){
    var name = prompt("Please enter your name", "Harry Potter");
    var objToSend = {
        "name": name
    };
    engine.sendMessage(NetEvents.SetName, objToSend);
}

function queryPlaylist(){
    engine.sendMessage(NetEvents.EvtPlaylist)
}

function queryStatus(){
    engine.sendMessage(NetEvents.EvtStatus)
}

function querySettings(){
    engine.sendMessage(NetEvents.EvtSettings)
}

function insertChatMessage(from, msg, kind){
    var parent = $("#chat-message-container")

    var nDiv = $('<div class="chatmsg"></div>');
    nDiv.addClass("chat-"+kind);
    var fromStrong = $('<strong class="chat-from"></strong>')
    var body = $('<span class="chat-body"></span>')

    fromStrong.text(from + ": ")
    body.text(msg).linkify();
    nDiv.append(fromStrong, body)
    parent.append(nDiv);

    //$("#chat-message-container").scrollTo("100%", 100)
    $("#chat-message-container").scrollTo({left:0, top:"100%"}, 100)
}

function setName(name){
    var obj = {name: name}
    engine.sendMessage(NetEvents.EvtSetName, obj)
}

var chatContainer;
var playerContainer;
var dragbar;

var curSidebarSize = 0;
function setSidebarSize(size){
    curSidebarSize = size;
    var dragbarSize = 5;

    if (!chatContainer) {
        chatContainer = $("#chat-container");
        playerContainer = $("#player-container");
        dragbar = $("#chat-dragbar");
    };


    chatContainer.width(size - dragbarSize);
    var playerSize = (window.innerWidth - size) - 3;
    playerContainer.width(playerSize);

    dragbar.css("right", size+"px");
}

function makeid(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}