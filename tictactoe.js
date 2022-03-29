let Gameboard = (function() {
    let slots = [];
    let rows = [];
    let cols = [];
    let diagonals = [];
    let allSlotGroups = []; // union of rows, columns and diagonals

    function init(gridSize) {

        const NUM_GRIDS = gridSize ** 2;

        // fill slots with null to show neutral state
        for (let i = 0; i < NUM_GRIDS; i++) {
            slots.push(null);
        }

        // get row indices
        for (let i = 0, startIndex = 0; i < gridSize; i++) {
            let buffer = [startIndex];
            while (buffer.length < gridSize)
                buffer.push(buffer.slice(-1)[0] + 1);

            rows.push(buffer);
            startIndex += gridSize;
        }

        // get column indices
        for (let i = 0, startIndex = 0; i < gridSize; i++) {
            let buffer = [startIndex];
            while (buffer.length < gridSize)
                buffer.push(buffer.slice(-1)[0] + gridSize);

            cols.push(buffer);
            startIndex += 1;
        }

        // get leftRightDiagonal
        (function() {
            let startIndex = 0;
            let buffer = [startIndex];
            while (buffer.length < gridSize)
                buffer.push(buffer.slice(-1)[0] + gridSize + 1);

            diagonals.push(buffer);
        })();


        // get rightLeftDiagonal
        (function() {
            let startIndex = gridSize - 1;
            let buffer = [startIndex];
            while (buffer.length < gridSize)
                buffer.push(buffer.slice(-1)[0] + gridSize - 1);

            diagonals.push(buffer);
        })();

        // get a union of all slot groups
        allSlotGroups.push(...rows, ...cols, ...diagonals);

        console.log(`\nAll slot groups for which winning is possible ` +
            `(${allSlotGroups.length} possible ways):`)
        console.table(allSlotGroups);


        // create physical grids in html dom
        (function() {
            // first destroy all existing slots
            document.querySelectorAll(".slot").forEach((slot) => {
                slot.parentElement.removeChild(slot);
            });

            // proceed to create slots and add to board
            for (let i = 0; i < NUM_GRIDS; i++) {
                const slot = document.createElement("div");
                slot.classList.add("slot");
                slot.setAttribute("data-slot", i);
                slot.setAttribute("data-team", "");
                slot.addEventListener("click", () => {
                    let team = Player.currentPlayer.team;
                    slots[Number(slot.getAttribute("data-slot"))] = team;
                    slot.setAttribute("data-team", team);
                    slot.textContent = team;
                });
                document.querySelector(".board").appendChild(slot);
            }

            // adjust the CSS grid-template to match gridsize
            document.querySelector(".board").style.gridTemplate =
                `repeat(${gridSize}, 60px) / repeat(${gridSize}, 60px)`;

        })();

    }

    return {
        init,
    }

})();


let Player = (function() {
    let numPlayers = 0;
    let teams = [];
    let currentPlayer = null;

    function CreatePlayer(team, isHuman) {
        player = Object.create(null);
        player.id = ++numPlayers;
        player.isHuman = isHuman;
        player.team = team;
        if (!teams.includes(team))
            teams.push(team);

        // this sets first player instance as the default currentPlayer
        if (this.currentPlayer == null)
            this.currentPlayer = player;

        return player;
    }

    function getNumPlayers() {
        return numPlayers;
    }

    function getNumTeams() {
        return teams.length;
    }

    return {
        CreatePlayer,
        getNumPlayers,
        getNumTeams,
        currentPlayer,
    };

})();


Gameboard.init(gridSize = 3);
let p1 = Player.CreatePlayer(1, true);
let p2 = Player.CreatePlayer(2, false);
let p3 = Player.CreatePlayer(2, false);

// console.log("Player 1 id: " + p1.id);
// console.log("Player 2 id: " + p2.id);
// console.log("Player1 is human? " + p1.isHuman);
// console.log("Player2 is human? " + p2.isHuman);
// console.log("Number of players: " + Player.getNumPlayers());
// console.log("Number of Teams: " + Player.getNumTeams());