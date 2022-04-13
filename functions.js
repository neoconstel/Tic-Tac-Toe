/**
 * 
 * @param _array 
 * @returns a shuffled copy of the array
 */
export function shuffledArray(array) {
    // make a copy to be operated on
    let _array = array.slice(0);

    let buffer = [];
    const initialArrayLength = _array.length;

    for (let i = 0; i < initialArrayLength; i++) {
        // take a random element from array and put in buffer
        let randomIndex = Math.floor(Math.random() * _array.length);
        buffer.push(_array[randomIndex]);
        _array.splice(randomIndex, 1);
    }
    return buffer;
}