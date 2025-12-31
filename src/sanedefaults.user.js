// ==UserScript==
// @name         Cuescore sane defaults
// @namespace    http://tampermonkey.net/
// @version      v1.0.2
// @description  Small changes that make cuescore better
// @author       Elton Kamami
// @match        https://cuescore.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        GM_addStyle
// @include      *
// ==/UserScript==

(function() {
    'use strict';

    // only run on top frame
    if(!location.origin.match("cuescore"))
        return;

    const LOCALSTORAGE_KEY = "cs-default-country";
    const COUNTRY_ID = '1000231'; // NL

    // override link to tournaments page to have country preselected
    function addCountryToTournamentSearchLinks(){
        [...document.querySelectorAll("a.tournaments")].forEach(l => {l.href = '/tournaments?c=' + COUNTRY_ID});
    }

     // override link to challenges page to have country preselected
    function addCountryToChallendesLinks(){
        [...document.querySelectorAll("a.challenges")].forEach(l => {l.href = '/challenges?c=' + COUNTRY_ID});
    }

    GM_addStyle(`
      .tournament.banner,
      .notificationRow a[href*="tournament"] img.pro,
      .latestPosts.card,
      .followingNotParticipating.card,
      .cuescore-ad {
        display: none;
      }
      .tournament.withbanner{background: white!important;}
      .latestMatches.card{order: -1;}
      .upcomingEvents.card{order: -2;}
      .score a {display: flex; gap: 4px; flex-direction: row-reverse;}
    `);

    addCountryToTournamentSearchLinks();
    addCountryToChallendesLinks();
})();
