// ==UserScript==
// @name         C&C:Online (Near) Full room notifier
// @namespace    https://github.com/BSG-75/C-C-Online-Website-hooks/
// @version      0.103
// @description  A script for those game hosts who are AFK. It will play sound when the game is full or nearly full. It works by hooking some CNCOnline serverinfo.js functions.
// @author       [RA3Bar]Lanyi
// @match        https://cnc-online.net/*
// @grant        none
// @run-at       document-end
// @license      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

function main() {

    window.anyNewStagingGames = function(newStaging) {
        let mapped = newStaging.map(function(game) { return game.host.id + game.map + game.title; });
        let result = false;
        for(let i = 0; i < mapped.length; ++i) {
            if(window.previousMapped.indexOf(mapped[i]) == -1) {
                result = true;
                break;
            }
        }
        
        window.previousMapped = mapped;
        return result;
    };
    
    window.playersChanged = function(host, newPlayers) {
        let newHost = host.nickanme;
        let oldHost = window.previousHost;
        window.previousHost = newHost;
        
        let oldPlayers = window.previousPlayers;
        let mapped = newPlayers.map(function(player) { return player.nickname; });
        window.previousPlayers = mapped;
        
        if(oldHost != newHost) {
            return false;
        }
        
        if(oldPlayers.length != mapped.length) {
            return true;
        }
        for(let i = 0; i < mapped.length; ++i)
        {
            if(oldPlayers[i] != mapped[i]) {
                return true;
            }
        }
        return false;
    };
    
    window.myPrefix = "RA3Bar_Lanyi_CNCOLWebsiteNotifier_";
    window.playerNameField = "PlayerNameField_";
    window.monitorStagingGameId = window.myPrefix + "monitorStagingGame";

    for (let i = 0; i < gamenames.length; ++i)  {
        window[myPrefix + playerNameField + gamenames[i]] = null;
    }

    //from: http://s1download-universal-soundbank.com/wav/2838.wav
    window[myPrefix + "sound"] = new Audio("https://raw.githubusercontent.com/BSG-75/C-C-Online-Website-hooks/master/2838%5B2%5D.wav");
    function notifyPlayer() {
        window[myPrefix + "sound"].play();
    }

    //https://stackoverflow.com/questions/5499078/fastest-method-to-escape-html-tags-as-html-entities
    function escapeHTMLTags(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    //onfocus
    window[myPrefix + "onMyFieldFocus"] = function(field) {
        let myFieldID = field.id;
        if(!window[myFieldID] || window[myFieldID].length == 0) {
            field.innerText = "";
        }
    };

    //oninput
    window[myPrefix + "onMyFieldInput"] = function(field) {
        let myFieldID = field.id;
        window[myFieldID] = field.innerText.trim();
    };

    let originalSetUserBarInfo = setUserbarInfo;
    let originalGetUserSection = getUserSection;
    let originalHandleJSON = handleJSON;
    setUserbarInfo = function($parent, response) {
        let result = originalSetUserBarInfo($parent, response);
        $parent.append("← Click game name to monitor your room!");
    };
    getUserSection = function(response, gamename) {
        let myFieldID = myPrefix + playerNameField + gamename;
        let myFieldStyle = "background: #A00060; margin-left: 1em; padding-left: 0.5em; padding-right: 0.5em;"
        let myFieldDefaultValue = "<Type your nickname here~>";
        let myFieldValue = myFieldDefaultValue;
        if(window[myFieldID] && window[myFieldID].length > 0) {
            myFieldValue = window[myFieldID];
        }

        let attributes = "contenteditable = \"true\" id = \"" + myFieldID + "\" style = \"" + myFieldStyle + "\"";
        attributes += " onfocus = \"" + myPrefix + "onMyFieldFocus(this);" + "\" ";
        attributes += " oninput = \"" + myPrefix + "onMyFieldInput(this);" + "\" ";
        let myField = "<span " + attributes + ">" + escapeHTMLTags(myFieldValue) + "</span>";
        let monitorStagingGame = "<input type=\"checkbox\" id=\"" + window.monitorStagingGameId + "\">"
        
        let result = originalGetUserSection(response, gamename);
        result.find("h3").append(myField);
        result.find("h3").append(monitorStagingGame)

        return result;
    };
    handleJSON = function(response, textStatus, jqXHR)  {
        let result = originalHandleJSON(response, textStatus, jqXHR);
        for (let i = 0; i < gamenames.length; ++i)  {
            let gamename = gamenames[i];
            let nickname = window[myPrefix + playerNameField + gamename];
            let games = response[gamename].games.staging;
            
            if(document.getElementById(window.monitorStagingGameId).value) {
                foreach(let userNickname in response[gamename].users) {
                    if(userNickname.toUpperCase() == nickname.toUpperCase()) {
                        if(window.anyNewStagingGames(games)) {
                            notifyPlayer();
                        }
                    }
                }
            }
            
            $.each(games, function(i, game) {
                //if ( parseInt(game.numRealPlayers)+parseInt(game.numObservers) == parseInt(game.maxRealPlayers) ) {
                //    $gameItem.addClass('full');
                //}
                if (game.players != 'error') {
                    $.each(game.players, function(j, player) {
                        if(nickname && player.nickname) {
                            if(player.nickname.toUpperCase() == nickname.toUpperCase()) {

                                let realPlayers = parseInt(game.numRealPlayers);
                                let observers = parseInt(game.numObservers);
                                let maxPlayers = parseInt(game.maxRealPlayers);
                                if(realPlayers + observers >= maxPlayers * 0.5) {
                                    if(window.playersChanged(game.host, game.players)) {
                                        notifyPlayer();
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }
        return result;
    };
}

(function() {
    'use strict';
    // Your code here...
    let mainScript = document.createElement("script");
    mainScript.textContent = main.toString() + "\nmain();";
    document.body.appendChild(mainScript);
})();
