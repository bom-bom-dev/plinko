import MersenneTwister from "mersenne-twister";
import { MULTIPLIERS, WEIGHTS } from "./configs";

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

    WEIGHTS.forEach((row, i) => {
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

        if (i === WEIGHTS.length - 1) {
            console.log("-", cur, "-");
            console.log("");

            // const curResult = RESULTS.getResults();
            // const multiplier = MULTIPLIERS[cur] * 10;
            // const profit = multiplier * curResult.bet / 10;
            // const total = curResult.total - curResult.bet + profit;
            //
            // console.log("total", total);
            // console.log("profit", profit);

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

export function regResult (index) {
    console.log("regResult", index)
    const curResult = RESULTS.getResults();
    console.log("curResult", curResult)

    const multiplier = MULTIPLIERS[index];
    const profit = round((multiplier * curResult.bet), 2);
    const total = round((curResult.total - curResult.bet + profit), 2);
    const last5 = curResult.last5;

    last5.length === 5 && last5.shift();
    last5.push(profit);

    RESULTS.setResults({
        total: total,
        bet: 1,
        index: index,
        multiplier: multiplier,
        profit: profit,
        last5: last5
    });

    console.log("updatedResult", RESULTS.getResults());
    console.log("");
}

