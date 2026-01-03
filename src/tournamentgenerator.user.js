// ==UserScript==
// @name         Tournament generator (transactional)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Tool to generate recurring tournaments (clone + update as one transaction)
// @author       You
// @match        https://cuescore.com/tournament/edit*
// @grant        GM_addStyle
// ==/UserScript==
/* global jQuery, CS */
(function () {
    'use strict';

    if (!location.origin.match("cuescore")) {
        return;
    }

    let selectedDates = [];

    GM_addStyle(`
.tournament-generator{ cursor:pointer; }
.cs-generator{ width:500px; }
.cs-generator .overview{ display:none; }
.cs-generator textarea:disabled{ background:white!important;color:black!important; }
.cs-dialog{ border:1px solid #c8c8c8;border-radius:2px;padding:30px; }
.cs-dialog-close{ position:absolute;right:0;top:0;margin:10px;font-weight:bold;font-size:20px;cursor:pointer; }
.cs-dialog.generating:after {
  content: "Generating tournaments ...";
  position: fixed;
  width: 100%;
  height: 100%;
  background: black;
  top: 0;
  z-index: 9999;
  opacity: .7;
  left: 0;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  font-size:20px;
  font-weight: bold;
}
.tag{
  font-family: system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  -webkit-box-align: center;
  align-items: center;
  color: white;
  background-color: rgb(63, 110, 197);
  border-style: solid;
  border-width: 0px;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  height: 24px;
  -webkit-box-pack: justify;
  justify-content: space-between;
  margin: 5px;
  padding: 2px 8px;
  outline: none;
  width: 120px;
}
.tag:hover {box-shadow: rgba(255, 255, 255, 0.2) 0px 0px 100px inset;}
.tag:after{content: 'x'}
.date-tags{font-size:12px;}
    `);

    const editHeader = document.querySelector(".tournamentEditHeader");
    const orgStub = editHeader.querySelector(".breadcrumbs a").href.split("/").at(-1);
    const tournamentId = document.querySelector('input[name="tournamentId"]').value;
    const tournamentName = document.querySelector(".tournamentEditHeader a.title").textContent;

    function addCTA() {
        editHeader.insertAdjacentHTML(
            "afterend",
            "<button class='tournament-generator' type='button'>Make recurring</button>"
        );
    }

    function addListeners() {
        jQuery(".tournament-generator").click(() => {
            jQuery("dialog")[0].showModal();
        });

        jQuery(".cs-dialog-close").click(e =>
            e.target.closest("dialog").close()
        );

        jQuery(".cs-generate").click(e => {
            e.stopPropagation();
            jQuery(".cs-dialog").addClass("generating");
            const basename = jQuery(".cs-generator .cs-basename").val();
            const start = Number(jQuery(".cs-generator .cs-start-num").val());

            if (!basename || selectedDates.length === 0 || start < 1) {
                alert("Basename, start number and at least one date are required");
                return;
            }

            cloneTournaments(basename, selectedDates, start);
        });

        jQuery(".cs-date-tags").on("click", ".tag", function(e){
            const date = e.target.textContent.trim();
            selectedDates = selectedDates.filter(d => d !== date);
            updateDateTags();
        })

        jQuery(".cs-date").datetimepicker({
            timepicker: false,
            opened: true,
            format: 'Y-m-d',
            inline: true,
            closeOnDateSelect: 0,
            onChangeDateTime: function (dp, $input) {
                const d = $input.val();
                if(selectedDates.includes(d)){
                    return;
                }
                selectedDates.push(d);
                selectedDates.sort((a, b) => new Date(a) - new Date(b));
                updateDateTags();
                updateOverview();
            }
        });

        jQuery(".cs-basename, .cs-start-num").on("keyup", updateOverview);
    }

    function updateDateTags(){
        jQuery(".cs-date-tags").html(selectedDates.map(d => `<div class="tag">${d}</div>`).join(""));
    }

    function updateOverview() {
        const overview = jQuery(".cs-generator .overview");
        const basename = jQuery(".cs-generator .cs-basename").val();
        const start = Number(jQuery(".cs-generator .cs-start-num").val());

        if (!selectedDates.length) {
            overview.hide();
            return;
        }

        jQuery(".cs-generator ul").html(
            selectedDates.map((d, i) =>
                `<li>${basename} #${start + i} at ${d}</li>`
            ).join("")
        );
        overview.show();
    }

    function generateDialog() {
        return `
<dialog class="cs-dialog">
  <span class="cs-dialog-close">x</span>
  <div class="material cs-generator">
    <div class="input-group">
      <input type="text" value="${tournamentName}" class="form-control cs-basename" />
      <label>Tournament basename</label>
    </div>
    <div class="input-group">
      <input type="number" value="1" min="1" class="form-control cs-start-num" />
      <label>Starting number</label>
    </div>
    <div class="input-group">
      <div class="cs-date-tags"></div>
      <input type="number" value="1" min="1" class="form-control" hidden/>
      <label>Tournament dates</label>
      <span class="desc">Click a date to remove it</span>
    </div>
    <div class="input-group">
      <span class="cs-date"></span>
    </div>
    <div class="overview">
      <h4>The following tournaments will be created</h4>
      <ul></ul>
    </div>
    <hr />
    <button type="button" class="cs-generate">Generate</button>
  </div>
</dialog>`;
    }

    /* =========================
       Transactional logic
       ========================= */

    async function cloneTournamentAndGetId(name) {
        const res = await fetch(
            `/tournament/edit/?name=${encodeURIComponent(name)}&copy=${tournamentId}`,
            { redirect: "follow" }
        );

        if (!res.ok) {
            throw new Error("Clone failed");
        }

        const url = new URL(res.url);
        const draftId =
            url.searchParams.get("tournamentId") ||
            url.searchParams.get("id") ||
            url.searchParams.get("copy");

        if (!draftId) {
            throw new Error("Failed to extract draftId");
        }

        return draftId;
    }

    function buildBaseSaveOptions() {
        prepareData();
        const opts = {};
        jQuery("#editTournament")
            .serializeArray()
            .forEach(f => opts[f.name] = f.value);
        return opts;
    }

    async function cloneAndPublishTransaction({ basename, index, date, baseOptions }) {
        const name = `${basename} #${index}`;
        const draftId = await cloneTournamentAndGetId(name);

        await saveUpdatedTournament(
            baseOptions,
            date,
            draftId,
            name
        );

        return { draftId, name, date };
    }

    async function cloneTournaments(basename, dates, start) {
        const baseOptions = buildBaseSaveOptions();

        const transactions = dates.map((date, i) => {
            const index = start + i;
            return withRetry(
                () => cloneAndPublishTransaction({
                    basename,
                    index,
                    date,
                    baseOptions
                }),
                { retries: 3, baseDelay: 500 }
            );
        });

        const results = await Promise.allSettled(transactions);

        const failed = results.filter(r => r.status === "rejected");
        console.log("Results:", results);

        if (failed.length) {
            alert(`${failed.length} tournaments failed to generate`);
        }
        jQuery(".cs-dialog")[0].close();
        CS.StatusMessage.show("info", "info", "Tournaments created.")
    }

    /* =========================
       CueScore internals
       ========================= */

    function prepareData() {
        const organizations = [];
        jQuery('div.organizations table tbody tr').each(function () {
            organizations.push(jQuery(this).data('organization').organizationId);
        });
        jQuery('#organizations').val(organizations.join(','));

        const managers = [];
        jQuery('div.managers table tbody tr').each(function () {
            managers.push(jQuery(this).data('player').playerId);
        });
        jQuery('#managers').val(managers.join(','));

        const venues = [];
        jQuery('div.venues table tbody tr').each(function () {
            venues.push(jQuery(this).data('venue').venueId);
        });
        jQuery('#venues').val(venues.join(','));

        const tournamentParticipations = [];
        jQuery('#tournamentParticipationSection table tbody tr').each(function () {
            tournamentParticipations.push(jQuery(this).data('tournament').tournamentId);
        });
        jQuery('#tournamentParticipations').val(tournamentParticipations.join(','));
    }

    function saveUpdatedTournament(baseOptions, dt, draftId, name) {
        const opts = { ...baseOptions };
        opts.name = name;
        opts.tournamentId = draftId;
        opts.startdate = dt;
        opts.stopdate = dt;

        return fetch("/ajax/tournament/edit/save.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(opts)
        }).then(res => {
            if (!res.ok) throw new Error("Save failed");
            return res;
        });
    }

    async function withRetry(fn, { retries = 5, baseDelay = 300, factor = 2 } = {}) {
        let delay = baseDelay;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                if (attempt === retries) throw err;
                await new Promise(r => setTimeout(r, delay));
                delay *= factor;
            }
        }
    }

    /* ========================= */

    document.body.insertAdjacentHTML("beforeend", generateDialog());
    addCTA();
    addListeners();
})();
