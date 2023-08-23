import MersenneTwister from "mersenne-twister";
import { WEIGHTS } from "./configs";

// function weightedRandom(a, b) {
//     const sum = a + b;
//     const rand = Math.random() * sum;
//     return rand < sum / 2;
// }

// function weightedRandom(a, b) {
//     const sum = a + b;
//     const randArray = new Uint32Array(1);
//     window.crypto.getRandomValues(randArray);
//     const rand = (randArray[0] / 0xFFFFFFFF) * sum;
//     return rand < sum / 2;
// }

const generator = new MersenneTwister();

function weightedRandom(a, b) {
    const sum = a + b ;
    const rand = (generator.random_excl() * sum);
    return rand < sum / 2;
}

export function binaryPass() {
    const result = [];
    let cur = Number(weightedRandom(0, WEIGHTS[0].length - 1));
    // let cur = 0;

    for (let i = 0; i < WEIGHTS.length; i++) {
        const row = WEIGHTS[i];
        const leftIndex = cur;
        const rightIndex = cur === row.length - 1 ? cur : cur + 1;

        const leftWeight = leftIndex !== cur ? row[leftIndex] : 0;
        const rightWeight = rightIndex !== cur ? row[rightIndex] : 0;

        // return true or false, which is left or right
        const randomValue = weightedRandom(leftWeight, rightWeight);
        result.push(randomValue ? "left" : "right");

        cur = randomValue ? leftIndex : rightIndex;

        if (i === WEIGHTS.length - 1) {
            console.log("-", cur, "-");
            console.log("")

            // TODO integrate registrationResult() here
        }
    }

    return result;
}

export function registrationResult() {

}
