(() => {
	if (
		!location.pathname.startsWith('/tournament') ||
		document.querySelector('#resultSection')
	)
		return;
	document.head.insertAdjacentHTML(
		'beforeend',
		`<style data-ux-bookmarklet>${getGlobalStyles()}</style>`
	);
	const VENUE_ID = document
		.querySelector('.titleSection .venue a')
		?.href.split('/')
		.at(-1);
	let deactivatedTablesSettings =
		localStorage.getItem('deactivated-tables-' + VENUE_ID) || '';
	const TOURNAMENT_ID = location.pathname.split('/').at(-1);
	const WALKOVER_PLAYER_ID = 1000615;
	const GAME_STATUS = {
		WAITING: 0,
		PLAYING: 1,
		FINISHED: 2,
	};
	function getGlobalStyles() {
		return `
			.activetables {
		    display: flex;
		    gap: 5px;
		    flex-wrap: wrap;
		    margin-bottom: 20px;
			}
			
			.activetables .tournamenttable {
		    background: white;
		    color: black;
		    font-size: 14px;
		    padding: 5px;
		    border-radius: 4px;
		    cursor: pointer;
		    position: relative;
		    border: 1px solid red;
		    border-bottom-width: 5px;
			}
			
			.tableswitch:checked + label {
				background-color: white;
		    border: 1px solid green;
		    border-bottom-width: 5px;
			}
			
			.activetables input {
				display: none;
			}
			table.score select.tablePicker option.tableInUse{
				background-color:white;
				color: black;
			}
			table.score select.tablePicker option{
			  font-size:14px;
			  width:150px;
			  margin:5px;
			  padding:5px
			}
			.canstart {
			  background: rgb(0 128 0 / 70%)!important;
			  color: white!important;
			}
			select.tablePicker,
			select.tablePicker::picker(select) {
			  appearance: base-select;
			}
			select.tablePicker{
		    background:none;
		    padding:0;
		    width: 80px;
			}
			
			.floatingmessage {
				position: fixed;
		    top: 100px;
		    right: 20px;
		    padding: 20px;
		    z-index: 10;
		    border-radius: 5px;
		    font-weight: bold;
		    background: white;
		    color: black;
		    outline: 5px double #8BAE66;
		    border-bottom: 5px solid #8BAE66;
			}
			
			.floatingmessage:after {
		    content: '  games can start';
			}
			
			.floatingmessage.expand {
		    width: 300px;
		    height: 300px;
		    border-radius: 100%;
		    font-size: 100px;
		    display: flex;
		    justify-content: center;
		    align-items: center;
		    text-shadow: 2px 2px black, 3px 3px red, -2px -2px teal;
		    top: 50%;
				left: 50%;
				transform: translateX(-50%) translateY(-50%);
				box-shadow: 0 0 0 5000px rgba(0, 0, 0, .7);
			}
			
			.floatingmessage.expand:after {
		    content: 'games can start';
		    font-size: 14px;
		    text-shadow: none;
		    position: absolute;
		    bottom: 40px;
			}
			
			.floatingmessage:hover:before {
		    content: "click to expand";
		    position: absolute;
		    top: 120%;
		    font-size: 12px;
		    font-weight: normal;
		    width: 100%;
		    text-align: center;
		    left: 0;
			}
			
			.floatingmessage.expand:hover:before {
		    content: "click to shrink";
		    position: absolute;
		    top: 105%;
		    font-size: 12px;
		    font-weight: normal;
		    width: 100%;
		    text-align: center;
		    left: 0;
		    text-shadow: none;
			}
			
			@media (min-width: 1000px){
					.tableswitch:checked + label:hover:before {
						content: "off";
						position: absolute;
						width: 100%;
						height: 100%;
						top: 0;
						left: 0;
						background: crimson;
						color: white;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					.tableswitch:not(checked) + label:hover:before {
						content: "on";
						position: absolute;
						width: 100%;
						height: 100%;
						top: 0;
						left: 0;
						background: #588157;
						color: white;
						display: flex;
						align-items: center;
						justify-content: center;
					}
			}
		`;
	}

	async function fetchVenueData(venueId) {
		const data = await fetch('https://api.cuescore.com/venue/?id=' + venueId);
		return await data.json();
	}

	async function fetchTournamentData(tournamentId) {
		const data = await fetch(
			'https://api.cuescore.com/tournament/?id=' + tournamentId
		);
		return await data.json();
	}

	function updateTableStates(tablesUsed) {
		const tablesUsedClasses = tablesUsed.map((t) => `selected-${t}`).join(' ');
		const deactivatedTables = [
			...document.querySelectorAll('.tableswitch:not(:checked)'),
		].map((e) => e.value);
		const deactivatedTablesClasses = deactivatedTables
			.map((id) => `deactivated-${id}`)
			.join(' ');

		document.body.className = `${tablesUsedClasses} ${deactivatedTablesClasses}`;
		if (deactivatedTablesSettings !== deactivatedTables.join()) {
			localStorage.setItem(
				'deactivated-tables-' + VENUE_ID,
				deactivatedTables.join()
			);
			deactivatedTablesSettings = deactivatedTables.join();
		}
	}
	function setupTables(venueData) {
		const tableData = getTableData(venueData);
		if (tableData.length === 0) return;
		createTablesStyles(tableData);
		createTableToggles(tableData);
	}

	function getTableData(venueData) {
		return venueData.tables
			.sort((a, b) => a.name - b.name)
			.map((t) => ({ id: String(t.tableId), name: `Table ${t.name}` }));
	}

	function createTablesStyles(tableData = []) {
		if (tableData.length === 0) return;

		let cssstring = '';
		for (let table of tableData) {
			cssstring += `.selected-${table.id} option[value="${table.id}"]{background: #1E81AF!important;color:white!important;}`;
			cssstring += `.deactivated-${table.id} option[value="${table.id}"]{background: red!important;color:white!important;}`;
		}
		document.head.insertAdjacentHTML(
			'beforeend',
			`<style>${cssstring}</style>`
		);
	}

	function createTableToggles(tableData) {
		const deactivatedTables = deactivatedTablesSettings.split(',');
		const html = createTablesHtml(tableData, deactivatedTables);
		document.querySelector('#schedule').insertAdjacentHTML('beforebegin', html);
	}

	function updateMessage(canStartNumber) {
		const messageContainer = document.querySelector('.floatingmessage');
		if (!messageContainer) return;
		messageContainer.innerHTML = canStartNumber;
	}

	function createTablesHtml(tables, deactivatedTables) {
		return `<div class="floatingmessage" onclick="this.classList.toggle('expand')"></div><h2>Tables used for the tournament</h2><div class="activetables">${tables
			.map((table) => {
				return `<input class="tableswitch" type="checkbox" value="${table.id}" id="table${table.id}" ${deactivatedTables.includes(table.id) ? '' : 'checked'}/><label class="tournamenttable" for="table${table.id}">${table.name}</label>`;
			})
			.join('')}</div>`;
	}

	function maxGamesStarted(games) {
		const busyPlayers = new Set();
		const selectedGames = [];

		for (const [p1, p2, id] of games) {
			if (!busyPlayers.has(p1) && !busyPlayers.has(p2)) {
				selectedGames.push([p1, p2, id]);
				busyPlayers.add(p1);
				busyPlayers.add(p2);
			}
		}

		return {
			count: selectedGames.length,
			games: selectedGames,
		};
	}
	function maxGamesStartedHeuristic(games) {
		const degree = {};

		for (const [a, b] of games) {
			degree[a] = (degree[a] || 0) + 1;
			degree[b] = (degree[b] || 0) + 1;
		}

		const sortedGames = [...games].sort(
			([a1, b1], [a2, b2]) =>
				degree[a1] + degree[b1] - (degree[a2] + degree[b2])
		);

		return maxGamesStarted(sortedGames);
	}

	function validPlayerId(id) {
		return id !== 0 && id !== WALKOVER_PLAYER_ID;
	}

	function markAvailable() {
		fetchTournamentData(TOURNAMENT_ID).then((tournamentData) => {
			const tournamentFinished = tournamentData.statusCode === 2; // status === 'Finished'
			if (tournamentFinished)
				return clearInterval(window.__TABLE_UX_INTERVAL__);

			const running = tournamentData.matches.filter(
				(m) => m.matchstatusCode === GAME_STATUS.PLAYING
			);
			const waiting = tournamentData.matches
				.filter((m) => m.matchstatusCode === GAME_STATUS.WAITING)
				.filter((m) => {
					const playerAId = m.playerA.playerId;
					const playerBId = m.playerB.playerId;
					return validPlayerId(playerAId) && validPlayerId(playerBId);
				});

			const playersPlaying = running.reduce((acc, curr) => {
				const playerAId = curr.playerA.playerId;
				const playerBId = curr.playerB.playerId;

				acc.add(playerAId);
				acc.add(playerBId);
				return acc;
			}, new Set());

			const canStart = waiting.filter((game) => {
				const playerAId = game.playerA.playerId;
				const playerBId = game.playerB.playerId;
				if (!playersPlaying.has(playerAId) && !playersPlaying.has(playerBId)) {
					return true;
				}
				return false;
			});
			[...document.querySelectorAll('.canstart')].forEach((g) => {
				g.classList.remove('canstart');
			});
			canStart.forEach((game) =>
				document
					.querySelector('tr#match-' + game.matchId)
					.classList.add('canstart')
			);
			const tablesUsed = running.map((g) => g.table.tableId).map(String);
			updateTableStates(tablesUsed);
			const maxPossibleNumberOfGames = maxGamesStartedHeuristic(
				canStart.map((g) => [g.playerA.playerId, g.playerB.playerId, g.matchId])
			);
			const numberOfAvailableTables = [
				...document.querySelectorAll('.tableswitch:checked'),
			]
				.map((t) => t.value)
				.filter((t) => !tablesUsed.includes(t)).length;
			updateMessage(
				Math.min(maxPossibleNumberOfGames.count, numberOfAvailableTables)
			);
		});
	}
	markAvailable();
	if (!window.__TABLE_UX_INTERVAL__) {
		window.__TABLE_UX_INTERVAL__ = setInterval(markAvailable, 5000);
	}

	VENUE_ID && fetchVenueData(VENUE_ID).then(setupTables);
})();
