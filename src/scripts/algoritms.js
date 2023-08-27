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
    const sum = a + b ;
    const def = Math.abs(a - b);
    const rand = (generator.random() * sum);
    return rand < sum / 2;

}

// function getBias(index, length, concentrationControl = 0) {
//     const center = length / 2;
//     const distanceToCenter = Math.abs(center - index);
//     return (distanceToCenter) * concentrationControl;
// }

// function getBias(cur, length, concentration) {
//     const middle = (length - 1) / 2;
//     let bias = Math.abs(cur - middle) / middle;
//     bias *= concentration;
//     return bias;
// }


export function binaryPass() {
    const result = [];
    let cur = Number(weightedRandom(0, 1));
    // let cur = 0;

    const weights = [...WEIGHTS].slice(0, +sessionStorage.getItem("lines") || CONFIGS.MAX_LINES);

    weights.forEach((row, i) => {
        const leftIndex = cur;
        const rightIndex = cur === row.length - 1 ? cur : cur + 1;

        // const leftWeight = leftIndex !== cur ? row[leftIndex] : 0;
        // const rightWeight = rightIndex !== cur ? row[rightIndex] : 0;

        const leftWeight = row[leftIndex];
        const rightWeight = row[rightIndex];

        // const bias = getBias(cur, row.length, -0.05);
        // const leftWeight = cur <= row.length / 2 ? row[leftIndex] - bias : row[leftIndex] + bias;
        // const rightWeight = cur <= row.length / 2 ? row[rightIndex] + bias : row[rightIndex] - bias;

        // return true or false, which is left or right
        const randomValue = weightedRandom(leftWeight, rightWeight);
        result.push(randomValue ? "left" : "right");

        cur = randomValue ? leftIndex : rightIndex;

        if (i === weights.length - 1) {
            console.log("Generated index: ", cur);
        }
    });

    return result;
}


class RESULTS_CLASS {
    results = {
        total: 1000,
        bet: 1,
        index: 0,
        multiplier: 0,
        profit: 0,
        last5: [],
    }
    getResults() {
        return this.results;
    }
    setResults(results) {
        this.results = results;
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
    const curBet = RESULTS.getResults().bet;
    const curTotal = RESULTS.getResults().total;

    RESULTS.setResults({
        ...RESULTS.getResults(),
        total: curTotal - curBet
    });
}

export function regResult (index) {
    console.log("Collision index:", index);
    console.log("-----------------------");
    const curResult = RESULTS.getResults();
    console.log("Pre result: ", curResult);

    const multipliers = MULTIPLIERS[+sessionStorage.getItem("lines") || CONFIGS.MAX_LINES];
    const multiplier = multipliers[index];
    const profit = round((multiplier * curResult.bet), 2);
    const total = round((curResult.total + profit), 2);
    const last5 = curResult.last5;
    const bet = curResult.bet;

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

    console.log("Updated result: ", RESULTS.getResults());
    console.log("");
}
