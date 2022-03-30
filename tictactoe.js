let Gameboard = (function() {
    let slots = [];
    let rows = [];
    let cols = [];
    let diagonals = [];
    let allSlotGroups = []; // union of rows, columns and diagonals
    let boardGridSize;

    function init(gridSize) {

        const NUM_GRIDS = gridSize ** 2;
        this.boardGridSize = gridSize;

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
                    if (Player.currentPlayer.isHuman) {
                        let team = Player.currentPlayer.team;
                        slots[Number(slot.getAttribute("data-slot"))] = team;
                        slot.setAttribute("data-team", team);
                        slot.textContent = team;
                    }
                });
                document.querySelector(".board").appendChild(slot);
            }

            // adjust the CSS grid-template to match gridsize
            document.querySelector(".board").style.gridTemplate =
                `repeat(${gridSize}, 60px) / repeat(${gridSize}, 60px)`;

        })();

    }

    function getSlots() {
        // return a copy so it can't be modified from outside
        return slots.slice(0);
    }

    function getSlotGroups() {
        // return a copy so it can't be modified from outside
        return allSlotGroups.slice(0);
    }

    return {
        init,
        getSlots,
        getSlotGroups,
        boardGridSize,
    }

})();


let Player = (function() {
    let numPlayers = 0;
    let teams = [];
    let players = [];
    let currentPlayer = null;

    function CreatePlayer(team, isHuman) {
        player = Object.create(null);
        player.id = ++numPlayers;
        player.isHuman = isHuman;
        player.team = team;
        players.push(player);
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

    function nextPlayer() {
        // cycle sequentially through the list of players
        let playerIndex = this.players.indexOf(this.currentPlayer);
        playerIndex++;
        if (playerIndex > this.players.length - 1)
            playerIndex = 0;

        this.currentPlayer = this.players[playerIndex];
    }

    return {
        CreatePlayer,
        getNumPlayers,
        getNumTeams,
        currentPlayer,
        players,
        nextPlayer,
    };

})();


Gameboard.init(gridSize = 3);
let p1 = Player.CreatePlayer(1, isHuman = true);
let p2 = Player.CreatePlayer(2, isHuman = false);


// -------------

(function gamePlay() {

    document.querySelectorAll(".slot").forEach((slot) => {
        slot.addEventListener("click", () => {
            // only take human input if current player is human
            if (Player.currentPlayer.isHuman) {
                playerTurn();
            }
        });
    });

    let cpuTimer;
    let gameLoop = setInterval(() => {
        if (Player.currentPlayer.isHuman)
        ; // do nothing, but wait for click from human player
        else {
            // make cpu play after a short pause to make the game more fun
            if (!cpuTimer) {
                cpuTimer = setTimeout(() => {
                    playerTurn();
                    clearTimeout(cpuTimer);
                    cpuTimer = null;
                }, 1000);
            }

        }
    }, 100);

    function playerTurn() {
        let playerTeam = Player.currentPlayer.team;
        let playerId = Player.currentPlayer.id;
        let playerPersonality = Player.currentPlayer.isHuman ? "Human" : "Cpu";

        // if player is cpu, play automatically
        if (!Player.currentPlayer.isHuman)
            cpuMove();

        // what should happen after a move is made
        console.log(`${playerPersonality} (player ${playerId} team ${playerTeam}) made a move`);
        checkForWin(Gameboard);
        Player.nextPlayer();
    }

    function cpuMove() {
        console.log("A.I is playing...");
        let slotGroups = Gameboard.getSlotGroups();
        let slots = Gameboard.getSlots();

        let cpuAboutToWin = false;
        let cpuOpponentAboutToWin = false;

        for (let indexSlotGroup of slotGroups) { // indexSlotGroup e.g [0, 3, 6] -- holds index
            let slotGroup = indexSlotGroup.map((x) => { // slotGroup e.g [1, 1, null] -- holds team
                return slots[x];
            });

            // find if slotGroup is solely occupied by current cpu team  AND 
            // only one slot left in slotGroup (cpu says "check")
            let capturedSlots = slotGroup.filter((x) => {
                return x == Player.currentPlayer.team;
            });
            // ... AND only one slot left in slotGroup...
            if (slotGroup.includes(null) && capturedSlots.length == Gameboard.boardGridSize - 1) {
                cpuAboutToWin = true;
                console.log(`Cpu player ${Player.currentPlayer.id} says "Check!"`);
            }


            // find if slotGroup is solely occupied by another team  AND 
            // only one slot left in slotGroup (cpu opponent says "check")
            capturedSlots = slotGroup.filter((x) => {
                return x && x != Player.currentPlayer.team;
            });
            // ... AND only one slot left in slotGroup
            if (slotGroup.includes(null) && capturedSlots.length == Gameboard.boardGridSize - 1) {
                cpuOpponentAboutToWin = true;
                console.log(`Cpu's opponent says "Check!"`);
            }


        }

        if (cpuAboutToWin) {
            // cpu should play into the final dominated slot and claim victory
            console.log(`Cpu player ${Player.currentPlayer.id} hits it!`);
        } else if (cpuOpponentAboutToWin) {
            // cpu play into the final opposing slot and hinder opponent's win
            console.log(`Cpu player ${Player.currentPlayer.id} defends!`)
        }
    }

    function checkForWin(gameBoard) {
        let slotGroups = gameBoard.getSlotGroups();
        let slots = gameBoard.getSlots();

        for (let slotGroup of slotGroups) {
            slotGroup = slotGroup.map((x) => {
                return slots[x];
            });

            let capturedSlots = slotGroup.filter((x) => {
                return x == Player.currentPlayer.team;
            });

            if (capturedSlots.length == gameBoard.boardGridSize) {
                let winningTeam = Player.currentPlayer.team;
                console.log(`Team ${winningTeam} wins!`);
                break;
            }
        }
    }

})();