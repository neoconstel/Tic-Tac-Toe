let Gameboard = (function() {
    let slots = [];
    let rows = [];
    let cols = [];
    let diagonals = [];

    function init(gridSize) {

        const NUM_GRIDS = gridSize ** 2;

        // fill slots with unique identifier indices
        for (let i = 0; i < NUM_GRIDS; i++) {
            slots.push(i);
        }

        // get row indices
        for (let i = 0, startIndex = 0; i < gridSize; i++) {
            let buffer = slots.slice(startIndex, startIndex + gridSize);
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

    }




    return {
        init,
    }

})();


Gameboard.init(3);