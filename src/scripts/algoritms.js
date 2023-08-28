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

const generator = new MersenneTwister();

function weightedRandom(a, b) {
    const sum = a + b;
    const rand = generator.random() * sum;
    return rand < sum / 2;
}

export function binaryPass(logs = true) {
    const directions = [];
    const targetWeights = [];
    let collisionIndex = 0;
    let cur = Number(weightedRandom(0, 1));

    const weights = [...WEIGHTS].slice(0, +sessionStorage.getItem("lines") || CONFIGS.MAX_LINES);

    weights.forEach((row, i) => {
        const leftIndex = cur;
        const rightIndex = cur === row.length - 1 ? cur : cur + 1;

        const leftWeight = row[leftIndex];
        const rightWeight = row[rightIndex];

        // return true or false, which is left or right
        const randomValue = weightedRandom(leftWeight, rightWeight);

        directions.push(randomValue ? "left" : "right");
        targetWeights.push(randomValue ? leftWeight : rightWeight);

        cur = randomValue ? leftIndex : rightIndex;

        if (i === weights.length - 1) {
            logs && console.log("Generated index: ", cur);
            collisionIndex = cur;
        }
    });

    return {
        directions: directions,
        targetWeights: targetWeights,
        collisionIndex: collisionIndex,
    }
}


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

export const RESULTS = new RESULTS_CLASS();

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

export function setBet (bet) {
    const curResult = RESULTS.getResults();
    RESULTS.setResults({
        ...curResult,
        bet: bet
    });
}

export function playBet() {
    const curResult = RESULTS.getResults();
    const curBet = curResult.bet;
    const curTotal = curResult.total;

    RESULTS.setResults({
        ...curResult,
        total: round(curTotal - curBet, 2)
    });
}

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
