
// ==UserScript==
// @name         Tournament generator (transactional)
// @namespace    http://tampermonkey.net/
// @version      2
// @description  Generate recurring CueScore tournaments with a native multi-month date picker
// @author       Elton Kamami
// @match        https://cuescore.com/tournament/edit*
// @grant        GM_addStyle
// ==/UserScript==

/* global jQuery, CS */

(function () {
    'use strict';

    if (!location.origin.match("cuescore")) return;

    let selectedDates = [];
    let calendarMonth = new Date();
    calendarMonth.setDate(1);

    const MONTHS_TO_SHOW = 3;

    GM_addStyle(`
        .tournament-generator {
            cursor: pointer;
        }

        .cs-generator {
            width: min(700px, 90vw);
        }

        .cs-generator .overview {
            display: none;
        }

        .cs-generator textarea:disabled {
            background: white !important;
            color: black !important;
        }

        .cs-dialog {
            border: 1px solid #c8c8c8;
            border-radius: 6px;
            padding: 30px;
            max-width: 95vw;
            max-height: 90vh;
            overflow-y: auto;
            box-sizing: border-box;
            background: white;
            color: #222;
        }

        .cs-dialog::backdrop {
            background: rgba(0, 0, 0, .55);
        }

        .cs-dialog-close {
            position: sticky;
            float: right;
            top: 0;
            margin: -18px -14px 0 0;
            font-weight: bold;
            font-size: 22px;
            cursor: pointer;
            z-index: 2;
            color: #222;
        }

        .cs-dialog.generating::after {
            content: "Generating tournaments ...";
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, .7);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: all;
            font-size: 20px;
            font-weight: bold;
        }

        /* Selected date tags */
        .cs-generator .tag {
            font-family: system-ui, sans-serif;
            font-size: 13px;
            font-weight: 500;
            color: white !important;
            background: rgb(63, 110, 197) !important;
            border: 0;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin: 4px;
            padding: 5px 9px;
        }

        .cs-generator .tag:hover {
            box-shadow: rgba(255,255,255,.2) 0 0 100px inset;
        }

        .cs-generator .tag::after {
            content: '×';
        }

        .date-tags {
            font-size: 12px;
            margin-bottom: 8px;
        }

        /* Calendar container */
        .cs-generator .cs-calendar {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            margin-top: 10px;
            background: #fff;
            color: #222;
        }

        /* Previous / next month navigation */
        .cs-calendar .cs-calendar-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
            color: #222;
        }

        .cs-calendar .cs-calendar-toolbar button {
            border: 1px solid #aaa !important;
            border-radius: 5px;
            background: #fff !important;
            color: #222 !important;
            padding: 7px 12px;
            cursor: pointer;
            font-size: 18px;
            line-height: 1.2;
            min-width: 40px;
            text-align: center;
        }

        .cs-calendar .cs-calendar-toolbar button:hover {
            background: #e8e8e8 !important;
            color: #111 !important;
        }

        .cs-calendar .cs-calendar-toolbar strong {
            color: #222;
            text-align: center;
        }

        /* Three months side by side */
        .cs-calendar-months {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
        }

        .cs-calendar-month {
            min-width: 0;
        }

        .cs-calendar-month h4 {
            text-align: center;
            margin: 8px 0;
            font-size: 14px;
            color: #222;
        }

        /* 7-column calendar grid */
        .cs-calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 2px;
        }

        .cs-calendar-weekday {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            padding: 5px 0;
            color: #777;
        }

        /* All dates: white background, dark text, centered */
        .cs-calendar .cs-calendar-day {
            box-sizing: border-box;
            min-width: 0;
            width: 100%;
            aspect-ratio: 1;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 0;
            margin: 0;

            border: 1px solid transparent !important;
            border-radius: 4px;

            background: #fff !important;
            color: #222 !important;

            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            font-weight: 400;
            line-height: 1;

            text-align: center;
            text-indent: 0;
            box-shadow: none;
        }

        /* Hover state for unselected dates */
        .cs-calendar .cs-calendar-day:not(.is-selected):not(.is-empty):hover {
            border-color: #3f6ec5 !important;
            background: #eaf0fb !important;
            color: #222 !important;
        }

        /* Selected dates: blue background, white text */
        .cs-calendar .cs-calendar-day.is-selected {
            background: #3f6ec5 !important;
            color: #fff !important;
            border-color: #3f6ec5 !important;
            font-weight: 700;
        }

        .cs-calendar .cs-calendar-day.is-selected:hover {
            background: #315aab !important;
            color: #fff !important;
        }

        /* Today's date gets an outline */
        .cs-calendar .cs-calendar-day.is-today {
            border-color: #3f6ec5 !important;
            font-weight: 700;
        }

        .cs-calendar .cs-calendar-day.is-selected.is-today {
            border-color: #fff !important;
        }

        .cs-calendar .cs-calendar-day.is-empty {
            visibility: hidden;
            pointer-events: none;
            background: transparent !important;
        }

        /* Calendar footer */
        .cs-calendar-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
            font-size: 12px;
            color: #777;
        }

        .cs-calendar .cs-calendar-footer button {
            border: 0 !important;
            background: transparent !important;
            color: #3f6ec5 !important;
            cursor: pointer;
            text-decoration: underline;
            padding: 3px 5px;
        }

        .cs-generator .input-group {
            margin-bottom: 16px;
        }

        @media (max-width: 650px) {
            .cs-calendar-months {
                grid-template-columns: 1fr;
            }

            .cs-calendar-month {
                max-width: 360px;
                width: 100%;
                margin: auto;
            }

            .cs-dialog {
                padding: 20px 14px;
            }
        }
    `);

    const editHeader = document.querySelector(".tournamentEditHeader");
    if (!editHeader) return;

    const tournamentId = document.querySelector(
        'input[name="tournamentId"]'
    )?.value;

    const tournamentName =
        editHeader.querySelector("a.title")?.textContent.trim() ||
        "Tournament";

    // =========================
    // UI
    // =========================

    function addCTA() {
        editHeader.insertAdjacentHTML(
            "afterend",
            `<button class="tournament-generator" type="button">
                Make recurring
            </button>`
        );
    }

    function addListeners() {
        document.querySelector(".tournament-generator")
            .addEventListener("click", () => {
                document.querySelector(".cs-dialog").showModal();
                renderCalendar();
            });

        document.querySelector(".cs-dialog-close")
            .addEventListener("click", () => {
                document.querySelector(".cs-dialog").close();
            });

        document.querySelector(".cs-generate")
            .addEventListener("click", async e => {
                e.stopPropagation();

                const basename = document.querySelector(
                    ".cs-generator .cs-basename"
                ).value.trim();

                const start = Number(document.querySelector(
                    ".cs-generator .cs-start-num"
                ).value);

                if (!basename || selectedDates.length === 0 || start < 1) {
                    alert(
                        "Basename, start number and at least one date are required"
                    );
                    return;
                }

                const button = e.currentTarget;
                const dialog = document.querySelector(".cs-dialog");

                button.disabled = true;
                dialog.classList.add("generating");

                try {
                    await cloneTournaments(
                        basename,
                        selectedDates,
                        start
                    );
                } catch (err) {
                    console.error(err);
                    alert(
                        "Tournament generation failed. Check the console."
                    );
                } finally {
                    button.disabled = false;
                    dialog.classList.remove("generating");
                }
            });

        // Remove a selected date by clicking its tag.
        document.querySelector(".cs-date-tags")
            .addEventListener("click", e => {
                const tag = e.target.closest("[data-date]");
                if (!tag) return;

                toggleDate(tag.dataset.date);
            });

        // Calendar navigation and date selection.
        document.querySelector(".cs-calendar")
            .addEventListener("click", e => {
                const nav = e.target.closest("[data-calendar-nav]");

                if (nav) {
                    calendarMonth.setMonth(
                        calendarMonth.getMonth() +
                        Number(nav.dataset.calendarNav)
                    );

                    renderCalendar();
                    return;
                }

                const clear = e.target.closest("[data-calendar-clear]");

                if (clear) {
                    selectedDates = [];
                    updateDateTags();
                    updateOverview();
                    renderCalendar();
                    return;
                }

                const today = e.target.closest("[data-calendar-today]");

                if (today) {
                    calendarMonth = new Date();
                    calendarMonth.setDate(1);
                    renderCalendar();
                    return;
                }

                const day = e.target.closest(".cs-calendar-day[data-date]");

                if (day && day.dataset.date) {
                    toggleDate(day.dataset.date);
                }
            });

        document.querySelector(".cs-basename")
            .addEventListener("input", updateOverview);

        document.querySelector(".cs-start-num")
            .addEventListener("input", updateOverview);
    }

    // =========================
    // Native multi-month calendar
    // =========================

    function pad2(n) {
        return String(n).padStart(2, "0");
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }

    function sameDay(a, b) {
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    function monthTitle(date) {
        return date.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric"
        });
    }

    function renderMonth(monthDate) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Monday-first calendar.
        const offset = (firstDay.getDay() + 6) % 7;

        const today = new Date();

        const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

        let html = `
            <section class="cs-calendar-month">
                <h4>${monthTitle(monthDate)}</h4>

                <div class="cs-calendar-grid">
                    ${weekdays.map(day =>
                        `<div class="cs-calendar-weekday">${day}</div>`
                    ).join("")}
        `;

        for (let i = 0; i < offset; i++) {
            html += `
                <span class="cs-calendar-day is-empty"></span>
            `;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const key = formatDate(date);

            const isSelected = selectedDates.includes(key);
            const isToday = sameDay(date, today);

            const classes = [
                "cs-calendar-day",
                isSelected ? "is-selected" : "",
                isToday ? "is-today" : ""
            ].filter(Boolean).join(" ");

            html += `
                <button
                    type="button"
                    class="${classes}"
                    data-date="${key}"
                    aria-pressed="${isSelected}"
                    aria-label="${key}"
                    title="${key}">
                    ${day}
                </button>
            `;
        }

        html += `
                </div>
            </section>
        `;

        return html;
    }

    function renderCalendar() {
        const months = [];

        for (let i = 0; i < MONTHS_TO_SHOW; i++) {
            months.push(
                new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + i,
                    1
                )
            );
        }

        const startLabel = monthTitle(months[0]);
        const endLabel = monthTitle(months[months.length - 1]);

        document.querySelector(".cs-calendar").innerHTML = `
            <div class="cs-calendar-toolbar">
                <button
                    type="button"
                    data-calendar-nav="-1"
                    aria-label="Previous months">‹</button>

                <strong>${startLabel} – ${endLabel}</strong>

                <button
                    type="button"
                    data-calendar-nav="1"
                    aria-label="Next months">›</button>
            </div>

            <div class="cs-calendar-months">
                ${months.map(renderMonth).join("")}
            </div>

            <div class="cs-calendar-footer">
                <span>Select or deselect multiple dates.</span>

                <span>
                    <button type="button" data-calendar-today>
                        Today
                    </button>

                    <button type="button" data-calendar-clear>
                        Clear dates
                    </button>
                </span>
            </div>
        `;
    }

    function toggleDate(date) {
        if (selectedDates.includes(date)) {
            selectedDates = selectedDates.filter(d => d !== date);
        } else {
            selectedDates.push(date);
        }

        selectedDates.sort((a, b) => a.localeCompare(b));

        updateDateTags();
        updateOverview();
        renderCalendar();
    }

    function updateDateTags() {
        const container = document.querySelector(".cs-date-tags");

        container.innerHTML = selectedDates.map(date => `
            <button
                type="button"
                class="tag"
                data-date="${date}"
                title="Remove ${date}">
                ${date}
            </button>
        `).join("");
    }

    function updateOverview() {
        const overview = document.querySelector(
            ".cs-generator .overview"
        );

        const basename = document.querySelector(
            ".cs-generator .cs-basename"
        ).value.trim();

        const start = Number(document.querySelector(
            ".cs-generator .cs-start-num"
        ).value);

        if (!selectedDates.length) {
            overview.style.display = "none";
            return;
        }

        overview.querySelector("ul").innerHTML =
            selectedDates.map((date, i) =>
                `<li>${basename} #${start + i} at ${date}</li>`
            ).join("");

        overview.style.display = "block";
    }

    function generateDialog() {
        return `
            <dialog class="cs-dialog">
                <span class="cs-dialog-close" title="Close">×</span>

                <div class="material cs-generator">
                    <div class="input-group">
                        <input
                            type="text"
                            class="form-control cs-basename"
                            value="${tournamentName}" />

                        <label>Tournament basename</label>
                    </div>

                    <div class="input-group">
                        <input
                            type="number"
                            value="1"
                            min="1"
                            class="form-control cs-start-num" />

                        <label>Starting number</label>
                    </div>

                    <div class="input-group">
                        <label>Tournament dates</label>

                        <div class="cs-date-tags date-tags"></div>

                        <span class="desc">
                            Click a date or tag to toggle/remove it.
                        </span>

                        <div class="cs-calendar"></div>
                    </div>

                    <div class="overview">
                        <h4>The following tournaments will be created</h4>
                        <ul></ul>
                    </div>

                    <hr />

                    <button type="button" class="cs-generate">
                        Generate
                    </button>
                </div>
            </dialog>
        `;
    }

    // =========================
    // Transactional logic
    // =========================

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
            .forEach(f => {
                opts[f.name] = f.value;
            });

        const rankingId =
            document.querySelector(
                "#ranking .section-content p a"
            )?.href.split("/").at(-1) ?? 0;

        opts.addToRankingList = rankingId;

        return opts;
    }

    async function cloneAndPublishTransaction({
        basename,
        index,
        date,
        baseOptions
    }) {
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

        const failed = results.filter(
            result => result.status === "rejected"
        );

        console.log("Tournament generation results:", results);

        if (failed.length) {
            alert(
                `${failed.length} tournaments failed to generate. Check the console.`
            );
        }

        document.querySelector(".cs-dialog").close();

        if (typeof CS !== "undefined" && CS.StatusMessage) {
            CS.StatusMessage.show(
                "info",
                "info",
                "Tournaments created."
            );
        }
    }

    // =========================
    // CueScore internals
    // =========================

    function prepareData() {
        const organizations = [];

        jQuery("div.organizations table tbody tr").each(function () {
            organizations.push(
                jQuery(this).data("organization").organizationId
            );
        });

        jQuery("#organizations").val(organizations.join(","));

        const managers = [];

        jQuery("div.managers table tbody tr").each(function () {
            managers.push(
                jQuery(this).data("player").playerId
            );
        });

        jQuery("#managers").val(managers.join(","));

        const venues = [];

        jQuery("div.venues table tbody tr").each(function () {
            venues.push(
                jQuery(this).data("venue").venueId
            );
        });

        jQuery("#venues").val(venues.join(","));

        const tournamentParticipations = [];

        jQuery("#tournamentParticipationSection table tbody tr")
            .each(function () {
                tournamentParticipations.push(
                    jQuery(this).data("tournament").tournamentId
                );
            });

        jQuery("#tournamentParticipations")
            .val(tournamentParticipations.join(","));
    }

    function saveUpdatedTournament(baseOptions, dt, draftId, name) {
        const opts = { ...baseOptions };

        opts.name = name;
        opts.tournamentId = draftId;
        opts.startdate = dt;
        opts.stopdate = dt;

        return fetch("/ajax/tournament/edit/save.php", {
            method: "POST",

            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },

            body: new URLSearchParams(opts)
        }).then(res => {
            if (!res.ok) {
                throw new Error("Save failed");
            }

            return res;
        });
    }

    async function withRetry(
        fn,
        { retries = 5, baseDelay = 300, factor = 2 } = {}
    ) {
        let delay = baseDelay;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                if (attempt === retries) throw err;

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );

                delay *= factor;
            }
        }
    }

    // =========================

    document.body.insertAdjacentHTML(
        "beforeend",
        generateDialog()
    );

    addCTA();
    addListeners();
    renderCalendar();

})();
