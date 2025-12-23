// global styles
document.head.insertAdjacentHTML('beforeend', `<style>${getGlobalStyles()}<style>`);

function getGlobalStyles(){
	return `
		.activetables {
	    display: flex;
	    gap: 5px;
	    flex-wrap: wrap;
		}
		
		.activetables .tournamenttable {
	    background: red;
	    color: white;
	    font-size: 14px;
	    padding: 5px;
	    border-radius: 4px;
	    cursor: pointer;
	    position: relative;
		}
		
		.tableswitch:checked + label {
			background-color: #588157;
		}
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
		select{
	    &,&::picker(select){
	      appearance:base-select;
	    }
	    background:none;
	    padding:0;
		}
	`
}

// method to update body classes with tables in use and deactivated tables
function updateTableStates(running){
	const tablesUsed = running.map(r => r.querySelector(".table select").value).filter(t => t !== '0').map(t => `selected-${t}`).join(" ");
	const deactivatedTables = [...document.querySelectorAll('.tableswitch:not(:checked)')].map(e => `deactivated-${e.value}`).join(" ");
	
	document.body.className = `${tablesUsed} ${deactivatedTables}`
}

function setupTables(){
	const tableData = getTableData();
	createTablesStyles(tableData);
	createTableToggles(tableData);
}

// retrieves table ids and names from a table selector
function getTableData(){
	return [...document.querySelector("tr td.table select").querySelectorAll("option")].filter(v => v.value !== '0').map(o => ({id: o.value, name: o.textContent}));
}

// create the styles for the table selector options (deactivated and in use)
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

// table switches to turn tables on and off for a tournament
function createTableToggles(tableData){
	const html = createTablesHtml(tableData);
	document.querySelector("#schedule").insertAdjacentHTML("beforebegin", html)
}

function createTablesHtml(tables){
	return `<h3>Tables used for the tournament</h3><div class="activetables">${tables.map(table => {
		return `<input class="tableswitch" type="checkbox" value="${table.id}" id="table${table.id}" checked/><label class="tournamenttable" for="table${table.id}">${table.name}</label>`
	}).join("")}</div>`
}
function markAvailable(){
	[...document.querySelectorAll(".canstart")].forEach(g => {
		if(g.classList.contains("finished") || g.classList.contains("playing"))
		g.classList.remove("canstart")
	})
	const tournamentFinished = document.querySelector(".resultSection");
	const res = [];
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
	
	waiting.forEach(game => {
		let playerA;
		let playerB;
		try {
		  playerA = game.querySelector(".playerA .name").textContent;
		  playerB = game.querySelector(".playerB .name").textContent;
		} catch(e){
			return;
		}
		if(!playersPlaying.has(playerA) && !playersPlaying.has(playerB)){
			game.classList.add("canstart");
			res.push(game);
		}
	});
	
	updateTableStates(running)
	return res;
}
setupTables();
setInterval(markAvailable, 3000);
