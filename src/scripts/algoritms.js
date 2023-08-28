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

// function weightedRandom(a, b) {
//     const sum = a + b ;
//     const rand = (generator.random() * sum);
//     return rand < sum / 2;
// }

function weightedRandom(a, b) {
    const sum = a + b;
    const rand = generator.random() * sum;
    return rand < a;
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

// TEST
async function test() {
    console.info("");
    console.info("---- Tes run ----");
    console.log("START RESULTS", RESULTS.getResults());
    console.log("MULTIPLIERS", MULTIPLIERS[+sessionStorage.getItem("lines") || CONFIGS.MAX_LINES]);
    const rtp = [];

    const bet = async () => {
        const { collisionIndex } = binaryPass(false);
        playBet();
        regResult(collisionIndex, false);

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
                console.info('bet resolved')
            }, 10);
        });
    }

    const bet100 = async () => {
        for (let i = 0; i < 100; i++) {
            await bet();
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
                console.info('100 bets resolved')
            }, 10);
        });
    }

    for (let i = 0; i < 10; i++) {
        await bet100();
        const { total} = RESULTS.getResults();
        rtp.push(total);
        RESULTS.refreshResults();
    }
    console.info("")
    console.info("[RTP] 10 loops x 100 bets: ", rtp);
    console.info("[RTP] totals average: ", round((rtp.reduce((a, b) => a + b, 0) / rtp.length), 2));
}

document.addEventListener("keydown", (event) => {
    if (event.key === "T" || event.keyCode === 84) {
        test();
    }
});
