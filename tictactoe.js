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
    }

    return {
        init,
    }

})();


Gameboard.init(gridSize = 3);