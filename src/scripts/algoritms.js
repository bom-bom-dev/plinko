import MersenneTwister from "mersenne-twister";
import { MULTIPLIERS, WEIGHTS, CONFIGS } from "./configs";

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

const generator = new MersenneTwister(); // alternative for Math.random() or window.crypto.getRandomValues()

/**
 * @description Returns true or false, which is left or right, checking the weighted random
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
function weightedRandom(a, b) {
    const sum = a + b;
    const rand = generator.random() * sum;
    return rand < sum / 2;
}


/**
 * @description Generates a random index, which is the collision index
 * @param logs - logs the generated index by default
 * @returns  {{targetWeights: number[], directions: string[], collisionIndex: number}}
 */
export function binaryPass(logs = true) {
    const directions = []; // array of "left" or "right", which is the direction road of ball
    const targetWeights = []; // array of target weights, which ball will cross
    let collisionIndex = 0; // the collision cell index, which indicates which cell the ball will fall into.
    let cur = Number(weightedRandom(0, (WEIGHTS[0].length - 1))); // start position of ball

    const weights = [...WEIGHTS].slice(0, +sessionStorage.getItem("lines") || CONFIGS.MAX_LINES); // weights arr based on amount of lines

    weights.forEach((row, i) => {
        const leftIndex = cur;
        const rightIndex = cur === row.length - 1 ? cur : cur + 1;

        const leftWeight = row[leftIndex]; // weight of left next step
        const rightWeight = row[rightIndex]; // weight of right next step

        const randomValue = weightedRandom(leftWeight, rightWeight); // return true or false, which is left or right

        directions.push(randomValue ? "left" : "right"); // push the direction of ball
        targetWeights.push(randomValue ? leftWeight : rightWeight); // push the target weight

        cur = randomValue ? leftIndex : rightIndex; // update the current position of ball

        // if it's the last row, then it's the collision cell index
        if (i === weights.length - 1) {
            logs && console.log("Generated index: ", cur);
            collisionIndex = cur;
        }
    });

    return {
        directions: directions, // array of "left" or "right", which is the direction road of ball
        targetWeights: targetWeights, // array of target weights, which ball will cross
        collisionIndex: collisionIndex, // the collision cell index, which indicates which cell the ball will fall into.
    }
}


/**
 * @Class RESULTS_CLASS
 * @description Class for storing the results of the game
 * @property {number} total - total amount of money
 * @property {number} bet - bet amount
 * @property {number} index - collision index
 * @property {number} multiplier - multiplier of the collision index
 * @property {number} profit - profit amount
 * @property {number[]} last5 - last 5 profits
 * @method getResults - returns the results
 * @method setResults - sets the results
 * @method refreshResults - refreshes the results
 */
class RESULTS_CLASS {
    results = null;
    constructor() {
        this.refreshResults();
    }
    getResults() {
        return this.results;
    }
    setResults(results) {
        this.results = results;
    }
    refreshResults() {
        this.results = {
            total: 1000,
            bet: 1,
            index: 0,
            multiplier: 0,
            profit: 0,
            last5: [],
        }
    }
}

export const RESULTS = new RESULTS_CLASS(); // instance of RESULTS_CLASS


/**
 * @description Rounds the number to the given decimal
 * @param {number} value
 * @param {number} decimals
 * @returns {number}
 */
export function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}


/**
 * @description Sets the bet amount to RESULTS
 * @param {number} bet
 */
export function setBet (bet) {
    const curResult = RESULTS.getResults();
    RESULTS.setResults({
        ...curResult,
        bet: bet
    });
}


/**
 * @description Plays the bet, which means subtracting the bet amount from total amount
 */
export function playBet() {
    const curResult = RESULTS.getResults();
    const curBet = curResult.bet;
    const curTotal = curResult.total;

    RESULTS.setResults({
        ...curResult,
        total: round(curTotal - curBet, 2)
    });
}

/**
 * @description Registers the result to RESULTS, based on the given collision index
 * @param {number} index
 * @param {boolean} logs - logs the result by default
 */
export function regResult (index, logs = true) {
    logs && console.log("Collision index:", index);
    logs && console.log("-----------------------");
    const curResult = RESULTS.getResults();
    logs && console.log("Pre result: ", curResult);

    const multipliers = MULTIPLIERS[+sessionStorage.getItem("lines") || CONFIGS.MAX_LINES];
    const multiplier = multipliers[index];
    const bet = curResult.bet;
    const profit = round((multiplier * bet), 2);
    const total = round((curResult.total + profit), 2);
    const last5 = curResult.last5;

    last5.length === 5 && last5.shift();
    last5.push(profit);

    RESULTS.setResults({
        total: total,
        bet: bet,
        index: index,
        multiplier: multiplier,
        profit: profit,
        last5: last5
    });

    logs && console.log("Updated result: ", RESULTS.getResults());
    logs && console.log("");
}

// 11 lines - 0.9599609375
// 10 lines - 0.9900390625
// 9 lines - 0.98984375
// 8 lines - 0.98984375

/**
 * @description Logs the average profit of 100000 games, when pressing "T" or "t" key
 */
document.addEventListener("keydown", (event) => {
    if (event.key === "T" || event.keyCode === 84) {
        let sum = 0;
        for (let i = 0; i < 100000; i++) {
            const { collisionIndex } = binaryPass(false);
            const m = MULTIPLIERS[+sessionStorage.getItem("lines") || CONFIGS.MAX_LINES];
            const multiplier = m[collisionIndex];
            const profit = round((multiplier * 1), 2);
            sum += profit;
        }

        console.log("Average profit: ", sum / 100000);
    }
});
