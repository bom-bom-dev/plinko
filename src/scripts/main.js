import "/src/styles/styles.scss";
import { WEIGHTS } from "./configs";
import { plinkoInit } from "./app";
import chroma from "chroma-js";

// MULTI BALLS HANDLER
const checkboxNode = document.createElement("label");
const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.addEventListener("change", () => {
    sessionStorage.setItem("multi-ball", `${checkbox.checked}`);
});
checkboxNode.appendChild(document.createTextNode("Multi Balls"));
checkboxNode.appendChild(checkbox);
document.body.appendChild(checkboxNode);


// STATISTICS TABLE
const statisticNode = document.createElement("div");
statisticNode.id = "statistic";
document.body.appendChild(statisticNode);

WEIGHTS[WEIGHTS.length - 1].forEach((weight, index) => {
    const cell = document.createElement("p");
    cell.innerHTML = `<b>${index}</b>: <span id="cell-${index}">0</span>`;

    statisticNode.appendChild(cell);
});


// PALETTE FOR CELLS
export function generateGradient(length) {
    const scale = chroma.scale(['#009d1b', '#6dea00','#fffb00', '#ee8f00']);
    const colors = [];
    for (let i = 0; i < length / 2; i++) {
        colors.push(scale(i / (length / 2)).hex());
    }
    return length % 2 === 0
        ? colors.concat(colors.slice().reverse())
        : colors.concat(colors.slice(0, -1).reverse());
}



// INIT
document.addEventListener("DOMContentLoaded", () => {
    checkbox.checked = sessionStorage.getItem("multi-ball") === "true";
    plinkoInit();
});
