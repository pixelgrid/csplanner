// ==UserScript==
// @name         Cuescore sane defaults
// @namespace    http://tampermonkey.net/
// @version      v1.0.1
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

    async function getProfileCountryId(){
      const profileUrl = document.querySelector("nav .profile").href;
      const savedValue = localStorage.getItem(LOCALSTORAGE_KEY);
      if(savedValue) return savedValue;

      const parser = new DOMParser();
      const res = await fetch(`${profileUrl}?edit`);
      const html = await res.text();
      const dom = parser.parseFromString(html, "text/html");
      const defaultCountry = dom.querySelector("select#countryId")?.value ?? null;
      localStorage.setItem(LOCALSTORAGE_KEY, defaultCountry);
      return defaultCountry;
    }

    // override link to tournaments page to have country preselected
    function addCountryToTournamentSearchLinks(countryId){
        [...document.querySelectorAll("a.tournaments")].forEach(l => {l.href = '/tournaments?c=' + countryId});
    }

     // override link to challenges page to have country preselected
    function addCountryToChallendesLinks(countryId){
        [...document.querySelectorAll("a.challenges")].forEach(l => {l.href = '/challenges?c=' + countryId});
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

    getProfileCountryId().then((countryId) => {
        addCountryToTournamentSearchLinks(countryId);
        addCountryToChallendesLinks(countryId);
    });
})();
