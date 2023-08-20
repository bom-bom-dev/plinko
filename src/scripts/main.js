import "/src/styles/styles.scss";
import { CONFIGS, WEIGHTS } from "./configs";
import { plinkoInit } from "./app";


const statisticNode = document.getElementById("statistic");
WEIGHTS[WEIGHTS.length - 1].forEach((weight, index) => {
    const cell = document.createElement("p");
    cell.innerHTML = `<b>${index}</b>: <span id="cell-${index}">0</span>`;

    statisticNode.appendChild(cell);
});


plinkoInit();
