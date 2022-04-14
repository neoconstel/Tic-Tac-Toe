// ---------imports------------
import { shuffledArray } from "./functions.js";


// ----------------------modules and functions----------------------

export let Gameboard = (function() {
    let slots;
    let rows;
    let cols;
    let diagonals;
    let allSlotGroups; // union of rows, columns and diagonals
    let boardGridSize;

    function init(gridSize) {

        slots = [];
        rows = [];
        cols = [];
        diagonals = [];
        allSlotGroups = [];

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

    function getSlotGroups(shuffled) {
        // return a copy so it can't be modified from outside
        return allSlotGroups.slice(0);
    }

    // this function is for the cpu to play
    function captureSlot(slotIndex) {
        // ignore if the slot is already captured
        if (slots[slotIndex])
            return;

        slots[slotIndex] = Player.currentPlayer.team;
        let uiSlot = document.querySelector(`.slot[data-slot="${slotIndex}"`);
        uiSlot.setAttribute("data-team", Player.currentPlayer.team);
        uiSlot.textContent = Player.currentPlayer.team;
    }

    return {
        init,
        getSlots,
        getSlotGroups,
        boardGridSize,
        captureSlot,
    }

})();


export let Player = (function() {
    let numPlayers = 0;
    let teams = [];
    let players = [];
    let currentPlayer = null;

    function CreatePlayer(team, isHuman) {
        let player = Object.create(null);
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

    function init() {
        numPlayers = 0;
        teams = [];
        players = [];
        currentPlayer = null;
    }

    return {
        CreatePlayer,
        getNumPlayers,
        getNumTeams,
        currentPlayer,
        players,
        nextPlayer,
        init,
    };

})();


export function gamePlay() {

    let gridSize = Number(document.querySelector(".grid-size").value);
    Gameboard.init(gridSize = gridSize);

    let p1 = Player.CreatePlayer(1, true);
    let p2 = Player.CreatePlayer(2, false);

    let gameEnded = false;

    document.querySelectorAll(".slot").forEach((slot) => {
        slot.addEventListener("click", () => {
            // abort if game has ended
            if (gameEnded)
                return;

            // abort if slot has been captured
            let slotIndex = slot.getAttribute("data-slot");
            if (Gameboard.getSlots()[slotIndex])
                return;

            // only take human input if current player is human
            if (Player.currentPlayer.isHuman) {
                Gameboard.captureSlot(Number(slot.getAttribute("data-slot")));

                playerTurn();
            }

        });
    });

    gameLoop = setInterval(() => {
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
        checkForWin();
        Player.nextPlayer();
    }

    function cpuMove() {
        // abort if game ended
        if (gameEnded)
            return;

        console.log("A.I is playing...");

        let cpuAboutToWin = false;
        let cpuOpponentAboutToWin = false;

        let cpuWinningIndexSlotGroup;
        let cpuOpponentWinningIndexSlotGroup;

        let maxSoloGroup = {
            length: 0,
            indexSlotGroup: null
        };


        for (let indexSlotGroup of shuffledArray(Gameboard.getSlotGroups(), 2)) { // indexSlotGroup e.g [0, 3, 6] -- holds index
            let slotGroup = indexSlotGroup.map((x) => { // slotGroup e.g [1, 1, null] -- holds team
                return Gameboard.getSlots()[x];
            });

            // test #1
            // find if slotGroup is solely occupied by current cpu team  AND 
            // only one slot left in slotGroup (cpu says "check")
            let capturedSlots = slotGroup.filter((x) => {
                return x == Player.currentPlayer.team;
            });
            // ... AND only one slot left in slotGroup...
            if (slotGroup.includes(null) && capturedSlots.length == Gameboard.boardGridSize - 1) {
                cpuAboutToWin = true;
                cpuWinningIndexSlotGroup = indexSlotGroup.slice(0);
                console.log(`Cpu player ${Player.currentPlayer.id} says "Check!"`);
            }


            // test #2
            // find if slotGroup is solely occupied by opposing team  AND 
            // only one slot left in slotGroup (cpu opponent says "check")
            capturedSlots = slotGroup.filter((x) => {
                return x && x != Player.currentPlayer.team;
            });
            // ... AND only one slot left in slotGroup
            if (slotGroup.includes(null) && capturedSlots.length == Gameboard.boardGridSize - 1) {
                cpuOpponentAboutToWin = true;
                cpuOpponentWinningIndexSlotGroup = indexSlotGroup.slice(0);
                console.log(`Cpu's opponent says "Check!"`);
            }


            // test #3
            // slotGroup is not occupied by opponent in any of its slots
            let unOpposingSlots = slotGroup.filter((x) => {
                return x == null || x == Player.currentPlayer.team;
            });

            // slotGroup is only occupied by current cpu
            capturedSlots = slotGroup.filter((x) => {
                return x == Player.currentPlayer.team;
            });

            if (unOpposingSlots.length == Gameboard.boardGridSize && capturedSlots.length >= maxSoloGroup.length) {
                maxSoloGroup.indexSlotGroup = indexSlotGroup.slice(0);
                maxSoloGroup.length = capturedSlots.length;
            }


        }

        if (cpuAboutToWin) {
            // cpu should play into the final dominated slot and claim victory
            console.log(`Cpu player ${Player.currentPlayer.id} nails it!`);
            for (let slotIndex of cpuWinningIndexSlotGroup) {
                if (Gameboard.getSlots()[slotIndex] == null) {
                    Gameboard.captureSlot(slotIndex);
                }
            }
        } else if (cpuOpponentAboutToWin) {
            // cpu play into the final opposing slot and hinder opponent's win
            console.log(`Cpu player ${Player.currentPlayer.id} defends!`);
            for (let slotIndex of cpuOpponentWinningIndexSlotGroup) {
                if (Gameboard.getSlots()[slotIndex] == null) {
                    Gameboard.captureSlot(slotIndex);
                }
            }
        } else if (maxSoloGroup.indexSlotGroup != null) {
            // this means there is a group solo-owned and most-captured by cpu, 
            // so get a null slot in the group and capture it to increase dominance
            console.log("AI playing into max solo group...");
            for (let slotIndex of maxSoloGroup.indexSlotGroup) {
                if (Gameboard.getSlots()[slotIndex] == null) {
                    Gameboard.captureSlot(slotIndex);
                    break;
                }
            }
        } else {
            // opponent has at least a slot in every group, so just play
            // randomly into any vacant slot. This should lead to a tie
            console.log("AI meets dead-end. Playing into any empty slot");
            for (let slotIndex in Gameboard.getSlots()) {
                if (Gameboard.getSlots()[slotIndex] == null) {
                    Gameboard.captureSlot(slotIndex);
                }
            }
        }
    }

    function checkForWin() {
        let slotGroups = Gameboard.getSlotGroups();
        let slots = Gameboard.getSlots();

        for (let slotGroup of slotGroups) {
            slotGroup = slotGroup.map((x) => {
                return slots[x];
            });

            let capturedSlots = slotGroup.filter((x) => {
                return x == Player.currentPlayer.team;
            });

            if (capturedSlots.length == Gameboard.boardGridSize) {
                let winningTeam = Player.currentPlayer.team;
                console.log(`Team ${winningTeam} wins!`);

                // register that the game has ended
                gameEnded = true;

                // display winner on UI
                document.querySelector(".winner-display").textContent =
                    `Player ${Player.currentPlayer.id} Wins!`;
                break;
            }
        }
        // if there was no winner in the turn and slots filled, it's a draw
        if (!Gameboard.getSlots().includes(null)) {
            // register that the game has ended
            gameEnded = true;

            // display that it's a draw
            document.querySelector(".winner-display").textContent =
                `It's a Draw!`;
        }
    }

};


// ----------------------initializer----------------------

export let cpuTimer;
export let gameLoop;

document.querySelector(".new-game").addEventListener("click", () => {
    clearTimeout(cpuTimer);
    cpuTimer = null;

    clearInterval(gameLoop);
    gameLoop = null;

    document.querySelector(".winner-display").textContent = "";

    Player.init();

    console.log("\n\n-----New Game Started-----\n\n");
    gamePlay();
});

gamePlay();