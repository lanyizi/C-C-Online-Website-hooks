// ==UserScript==
// @name         C&C:Online (Near) Full room notifier
// @namespace    https://github.com/BSG-75/C-C-Online-Website-hooks/
// @version      0.102001
// @description  A script for those game hosts who are AFK. It will play sound when the game is full or nearly full. It works by hooking some CNCOnline serverinfo.js functions.
// @author       [RA3Bar]Lanyi
// @match        https://cnc-online.net/*
// @grant        none
// @run-at       document-end
// @license      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

function main() {

    window.myPrefix = "RA3Bar_Lanyi_CNCOLWebsiteNotifier_";
    window.playerNameField = "PlayerNameField_";

    //from: http://s1download-universal-soundbank.com/wav/2838.wav
    window[myPrefix + "sound"] = new Audio("https://raw.githubusercontent.com/BSG-75/C-C-Online-Website-hooks/master/2838%5B2%5D.wav");
    function notifyPlayer() {
        window[myPrefix + "sound"].play();
    }

    //https://stackoverflow.com/questions/5499078/fastest-method-to-escape-html-tags-as-html-entities
    function escapeHTMLTags(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    
    window[myPrefix + "onMyFieldFocus"] = function(field) {
        let myFieldID = field.id;
        if(!window[myFieldID] || window[myFieldID].length == 0) {
            field.innerText = "";
        }
    };
    
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

        let attributes = "contenteditable = \"plaintext-only\" id = \"" + myFieldID + "\" style = \"" + myFieldStyle + "\"";
        attributes += " onfocus = \"" + myPrefix + "onMyFieldFocus(this);" + "\" ";
        attributes += " oninput = \"" + myPrefix + "onMyFieldInput(this);" + "\" ";
        let myField = "<span " + attributes +">" + escapeHTMLTags(myFieldValue) + "</span>";

        let result = originalGetUserSection(response, gamename);
        result.find("h3").append(myField);

        return result;
    };
    handleJSON = function(response, textStatus, jqXHR)  {
        let result = originalHandleJSON(response, textStatus, jqXHR);
        for (let i = 0; i < gamenames.length; ++i)  {
            let gamename = gamenames[i];
            let nickname = window[myPrefix + playerNameField + gamename];
            let games = response[gamename].games.staging;
            $.each(games, function(i, game) {
                //if ( parseInt(game.numRealPlayers)+parseInt(game.numObservers) == parseInt(game.maxRealPlayers) ) {
                //    $gameItem.addClass('full');
                //}
                if (game.players != 'error') {
                    $.each(game.players, function(j, player) {
                        if(player.nickname == nickname) {
                            let realPlayers = parseInt(game.numRealPlayers);
                            let observers = parseInt(game.numObservers);
                            let maxPlayers = parseInt(game.maxRealPlayers);
                            if(realPlayers + observers >= maxPlayers * 0.6) {
                                notifyPlayer();
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