import "/src/styles/styles.scss";
import { WEIGHTS } from "./configs";
import { plinkoInit } from "./app";


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


// INIT
document.addEventListener("DOMContentLoaded", () => {
    checkbox.checked = sessionStorage.getItem("multi-ball") === "true";
    plinkoInit();
});
