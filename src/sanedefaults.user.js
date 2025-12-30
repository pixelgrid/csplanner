// ==UserScript==
// @name         Cuescore sane defaults
// @namespace    http://tampermonkey.net/
// @version      v1.0.0
// @description  Small changes that make cuescore better
// @author       Elton Kamami
// @match        cuescore.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        GM_addStyle
// @include      *
// ==/UserScript==

(function() {
    'use strict';

    const ACCOUNT_COUNTRY = 1000231;

    // override link to tournaments page to have country preselected
    function addCountryToTournamentSearchLinks(){
        [...document.querySelectorAll("a.tournaments")].forEach(l => {l.href = '/tournaments?c=' + ACCOUNT_COUNTRY});
    }

     // override link to challenges page to have country preselected
    function addCountryToChallendesLinks(){
        [...document.querySelectorAll("a.challenges")].forEach(l => {l.href = '/challenges?c=' + ACCOUNT_COUNTRY});
    }

    GM_addStyle(`
      .tournament.banner,
      .notificationRow a img.pro,
      .latestPosts.card,
      .followingNotParticipating.card,
      .cuescore-ad {
        display: none;
      }
      .tournament.withbanner{background: white!important;}
      .latestMatches.card{order: -1;}
      .upcomingEvents.card{order: -2;}
    `);

    addCountryToTournamentSearchLinks();
    addCountryToChallendesLinks();
})();
