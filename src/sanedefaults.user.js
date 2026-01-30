// ==UserScript==
// @name         Cuescore sane defaults
// @namespace    http://tampermonkey.net/
// @version      5
// @description  Small changes that make cuescore better
// @author       Elton Kamami
// @match        https://cuescore.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        GM_addStyle
// @include      https://cuescore.com/*
// ==/UserScript==

(function() {
    'use strict';

    // only run on top frame
    if(!location.origin.match("cuescore")){
        return;
    }

    const LOCALSTORAGE_KEY = "cs-default-country";
    const COUNTRY_ID = '1000231'; // NL
    const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // override link to tournaments page to have country preselected
    function addCountryToTournamentSearchLinks(){
        [...document.querySelectorAll("a.tournaments")].forEach(l => {l.href = `/tournaments?c=${COUNTRY_ID}&date=${YESTERDAY}`});
    }

     // override link to challenges page to have country preselected
    function addCountryToChallendesLinks(){
        [...document.querySelectorAll("a.challenges")].forEach(l => {l.href = '/challenges?c=' + COUNTRY_ID});
    }

    async function getRRManualDraw(tournamentId){
        const res = await fetch(`https://cuescore.com/ajax/tournament/getRRManualDraw.php?id=${tournamentId}`);
        const text = await res.text();
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
    }

    async function getSEPairings(tournamentId){
        const dom = await getRRManualDraw(tournamentId);
        return [...dom.querySelectorAll('select')]
            .map(s => [s.value, s.options[s.selectedIndex].text])
            .map(([id, pos]) => {

              // already set, skip
              if(id !== '0'){
                return null
              }
              const [, letter, num] = pos.match(/Group\s+([A-Z])\s+no\s+(\d+)/i);
              const groupAsNumber = letter.toUpperCase().charCodeAt(0) - 64;
              return {playerId: id, text: pos, group: groupAsNumber, place: num};
        }).filter(Boolean)
    }

    async function populateNames(e){
        e.target.textContent = 'Update pairings';
        const drawRound = document.querySelector(".round.drawround").dataset.roundno;
        const tournamentId = location.pathname.split("/").at(-1);
        const players = Array.from(document.querySelectorAll(`tr.match[data-roundno='${drawRound}'] .upcoming`))
        const pairings = await getSEPairings(tournamentId);
        const tournamendData = await fetchTournamendData(tournamentId)
        for(let [index, player] of players.entries()){
            if(pairings[index].playerId === '0'){
               const name = tournamendData.standings[pairings[index].group][Number(pairings[index].place) - 1].player.name;
               player.textContent = `${pairings[index].text} (${name})`;
            }
        }
    }

    async function fetchTournamendData(tournamentId){
        const res = await fetch(`https://api.cuescore.com/tournament/?id=${tournamentId}`);
        return await res.json();
    }

    function addShowDrawButton(){
        const drawFormat = document.querySelector("table.score")?.dataset.format;
        const drawRoundElement = document.querySelector(".round.drawround .roundHead");
        if(!drawFormat || !drawRoundElement || drawFormat !== '4'){
            return;
        }
        drawRoundElement.insertAdjacentHTML("beforeend", `<a href="#" onclick="return false;" class="show-pairings">Show pairings</a>`);
        document.querySelector(".show-pairings").addEventListener("click", populateNames);
    }

    GM_addStyle(`
      .tournament.banner,
      .notificationRow a[href*="tournament"] img.pro,
      .latestPosts.card,
      .followingNotParticipating.card,
      .cuescore-ad { display: none; }
      .tournament.withbanner{background: white!important;}
      .latestMatches.card{order: -1;}
      .upcomingEvents.card{order: -2;}
      .score a {display: flex; gap: 4px; flex-direction: row-reverse;}
      .ratingTable .score a { direction: rtl; }
      a.show-pairings {font-size: 14px;margin-left: auto;}
    `);

    addCountryToTournamentSearchLinks();
    addCountryToChallendesLinks();
    addShowDrawButton();

})();
