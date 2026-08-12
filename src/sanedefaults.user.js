// ==UserScript==
// @name         Cuescore sane defaults
// @namespace    http://tampermonkey.net/
// @version      14
// @description  Small changes that make cuescore better
// @author       Elton Kamami
// @match        https://cuescore.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        GM_addStyle
// @include      https://cuescore.com/*
// ==/UserScript==

const MOKUM_VENUE_ID = 'mokumpooldarts';
const PLANB_VENUE_ID = 'planb';
const BOVEN_VENUE_SLUG = 'boventij';

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
        const res = await fetch(`https://cuescore.com/ajax/tournament/getRRManualDraw.php?id=${tournamentId}&lang=en`);
        const text = await res.text();
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
    }

    async function getSEPairings(tournamentId){
        const dom = await getRRManualDraw(tournamentId);
        return [...dom.querySelectorAll('select')]
            .map(s => [s.value, s.options[s.selectedIndex].text, s.name])
            .map(([id, pos, matchDetails]) => {

              // already set, skip
              if(id !== '0' || pos.match(/random/i)){
                return null
              }

              // Group A no 2
              const [, letter, num] = pos.match(/Group\s+([A-Z])\s+no\s+(\d+)/i);
              // match[<matchid>][A|B]
              const [, matchId, player] = matchDetails.match(/match\[(\d+)\]\[([A-Z])\]/);
              const groupAsNumber = letter.toUpperCase().charCodeAt(0) - 64;
              return {text: pos, group: groupAsNumber, place: Number(num), matchId, player};
        }).filter(Boolean)
    }

    async function populateNames(e){
        e.target.textContent = 'Update pairings';
        const drawRound = document.querySelector(".round.drawround").dataset.roundno;
        const tournamentId = location.pathname.split("/").at(-1);
        const players = Array.from(document.querySelectorAll(`tr.match[data-roundno='${drawRound}'] .upcoming`))
        const pairings = await getSEPairings(tournamentId);
        const tournamendData = await fetchTournamendData(tournamentId);

        const updates = []
        for(let p of pairings){
            const {text, group, place, matchId, player} = p;
            const name = tournamendData.standings[group][place - 1].player.name;
            updates.push([`#match-${matchId} .player${player} .name`, `${text} (${name})`]);
        }
        for(let [selector, text] of updates){
            document.querySelector(selector).textContent = text;
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

    function getParticipants(id){
        return fetch(`https://api.cuescore.com/tournament/?id=${id}&participants=Participants+list`).then(r => r.json())
    }

    function appendParticipantsList(res){
        let [id, participants] = res;
        let element = document.querySelector(`[data-pin-id='${id}']`).closest("tr").querySelector("div.info span");
        const names = participants.map(p => p.name).sort().join(", ");
        element.innerHTML += "<br><b>Players:</b> " + names;
    }
    async function displayParticipants(id){
        const participants = await getParticipants(id);
        appendParticipantsList([id, participants]);
    }
    async function addParticipants(tId){
        if(location.pathname !== '/tournaments/'){
            return;
        }
        document.body.addEventListener("click", e => {
          if(!e.target.matches("div.info")){
              return;
          }
          const tournamentId = e.target.closest("tr").querySelector("input.followChecker").dataset.pinId;
          displayParticipants(tournamentId);
        })

        const amsTourneys = [...document.querySelector(".content.tournaments").querySelectorAll('a[href$="mokumpooldarts"], a[href$="planb"], a[href$="boventij"]')].map(r => {
            return r.closest("tr").querySelector("input.followChecker").dataset.pinId
        });
        for(let t of amsTourneys){
            displayParticipants(t);
        }
    }

    async function showNotifications(){
        if(!window.location.pathname.startsWith("/player")){
            return
        }
        const response = await fetch("https://cuescore.com/ajax/notifications/getNotifications.php");
        const notifications = await response.text();
        let el = document.createElement("table");
        el.className = "hpnotif content standard";
        el.innerHTML = notifications;
        while (el.tBodies[0].children.length > 5) {
            el.tBodies[0].lastElementChild.remove();
        }
        const images = Array.from(el.querySelectorAll("img"));
        for(let image of images){
            image.remove()
        }
        document.querySelector("header").insertAdjacentElement("afterend", el);

    }

    function disableDarkMode(){
        const lightVars = {};

        for (const sheet of document.styleSheets) {
            let rules;

            try {
                rules = sheet.cssRules;
            } catch {
                // Cross-origin stylesheet
                continue;
            }

            for (const rule of rules) {
                if (rule.selectorText === ':root') {
                    for (const prop of rule.style) {
                        if (prop.startsWith('--')) {
                            lightVars[prop] = rule.style.getPropertyValue(prop);
                        }
                    }
                }
            }
        }

        const style = document.createElement('style');

        style.textContent = `
    :root {
        color-scheme: light !important;
        ${Object.entries(lightVars)
            .map(([name, value]) => `${name}: ${value} !important;`)
            .join('\n')}
    }
`;

        document.head.appendChild(style);
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
      .ratingTable .score a { direction: rtl; }
      a.show-pairings {font-size: 14px;margin-left: auto;}
      .hpnotif{margin-bottom:20px; font-size: 16px;}
      .hpnotif a {color: #004DAA; font-weight:600;}
    `);

    addCountryToTournamentSearchLinks();
    addCountryToChallendesLinks();
    addShowDrawButton();
    addParticipants();
    showNotifications();
    disableDarkMode();

})();
