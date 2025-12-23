(()=>{
	document.head.insertAdjacentHTML('beforeend', `<style data-ux-bookmarklet>${getGlobalStyles()}</style>`);
	
	function getGlobalStyles(){
		return `
			.activetables {
		    display: flex;
		    gap: 5px;
		    flex-wrap: wrap;
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
			}
			
			.floatingmessage.expand:after {
		    content: 'games can start';
		    font-size: 14px;
		    text-shadow: none;
		    position: absolute;
		    bottom: 40px;
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
		`
	}
	
	function updateTableStates(tablesUsed){
		const tablesUsedClasess = tablesUsed.map(t => `selected-${t}`).join(" ");
		const deactivatedTables = [...document.querySelectorAll('.tableswitch:not(:checked)')].map(e => `deactivated-${e.value}`).join(" ");
		
		document.body.className = `${tablesUsedClasess} ${deactivatedTables}`
	}
	function setupTables(){
		const tableData = getTableData();
		if(tableData.length === 0)
		  return
		createTablesStyles(tableData);
		createTableToggles(tableData);
	}
	
	function getTableData(){
		const tableSelect = document.querySelector("tr td.table select");
		if(!tableSelect) return [];
		return [...tableSelect.querySelectorAll("option")].filter(v => v.value !== '0').map(o => ({id: o.value, name: o.textContent}));
	}
	
	function createTablesStyles(tableData = []){
		if(tableData.length === 0)
		  return
		  
	  let cssstring = '';
	  for(let table of tableData){
	  	cssstring += `.selected-${table.id} option[value="${table.id}"]{background: #1E81AF!important;color:white!important;}`;
	  	cssstring += `.deactivated-${table.id} option[value="${table.id}"]{background: red!important;color:white!important;}`;
	  }
	  document.head.insertAdjacentHTML('beforeend', `<style>${cssstring}</style>`);
	}
	
	function createTableToggles(tableData){
		const html = createTablesHtml(tableData);
		document.querySelector("#schedule").insertAdjacentHTML("beforebegin", html)
	}
	
	function updateMessage(canStartNumber){
		const messageContainer = document.querySelector(".floatingmessage");
		if(!messageContainer) return;
		messageContainer.innerHTML = canStartNumber;
		//messageContainer.innerHTML = canStartNumber > 0 ? `${canStartNumber} game${canStartNumber > 1 ? 's' : ''} can start` : `No games can start`;
	
	}
	
	function createTablesHtml(tables){
		return `<div class="floatingmessage" onclick="this.classList.toggle('expand')"></div><h3>Tables used for the tournament</h3><div class="activetables">${tables.map(table => {
			return `<input class="tableswitch" type="checkbox" value="${table.id}" id="table${table.id}" checked/><label class="tournamenttable" for="table${table.id}">${table.name}</label>`
		}).join("")}</div>`
	}
	
	function markAvailable(){
		[...document.querySelectorAll(".canstart")].forEach(g => {
			if(g.classList.contains("finished") || g.classList.contains("playing"))
			g.classList.remove("canstart")
		})
		const tournamentFinished = document.querySelector(".resultSection");
		if(tournamentFinished) return
		
		const allGames = [...document.querySelectorAll("table.score tr.match:not(.walkover)")];
		const running = allGames.filter(game => game.classList.contains("playing"));
		const waiting = allGames.filter(game => game.classList.contains("waiting") && !game.querySelector(".name .upcoming"))
		
		const playersPlaying = running.reduce((acc, curr) => {
			const playerA = curr.querySelector(".playerA .name").textContent;
			const playerB = curr.querySelector(".playerB .name").textContent;
			
			acc.add(playerA);
			acc.add(playerB);
			return acc
		}, new Set());
		
		const canStart = waiting.filter(game => {
			let playerA;
			let playerB;
			try {
			  playerA = game.querySelector(".playerA .name").textContent;
			  playerB = game.querySelector(".playerB .name").textContent;
			} catch(e){
				return;
			}
			if(!playersPlaying.has(playerA) && !playersPlaying.has(playerB)){
				return true;
			}
			return false;
		});
		
		canStart.forEach(game => game.classList.add("canstart"));
		const tablesUsed = running.map(r => r.querySelector(".table select").value).filter(t => t !== '0');
		updateTableStates(tablesUsed);
		const numberOfAvailableTables = [...document.querySelectorAll('.tableswitch:checked')].map(t => t.value).filter(t => !tablesUsed.includes(t)).length;
		updateMessage(Math.min(canStart.length, numberOfAvailableTables));
	}
	setupTables();
	markAvailable();
	if (!window.__TABLE_UX_INTERVAL__) {
	  window.__TABLE_UX_INTERVAL__ = setInterval(markAvailable, 5000);
	}
})()
