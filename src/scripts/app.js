import * as PIXI from "pixi.js";
import { sound } from "@pixi/sound";
import { gsap } from "gsap";
import { binaryPass, playBet, regResult, RESULTS, setBet } from "./algoritms";
import { CONFIGS, MULTIPLIERS, WEIGHTS } from "./configs";
import { createStatisticTable, generateGradient } from "./main";
import coin from "../sounds/sound3.mp3";
import run from "../sounds/sound1.mp3";
import change from "../sounds/sound4.mp3";
import minMax from "../sounds/sound5.mp3";

const {
    BALL_RADIUS,
    BALL_COLOR,
    BACKGROUND_COLOR,
    PEG_COLOR,
    PEG_GAP_X,
    PEG_GAP_Y,
    PEG_RADIUS,
    CELL_HEIGHT,
    PADDING_TOP,
    BALL_SPEED,
    GAME_BOARD_WIDTH,
    GAME_BOARD_HEIGHT,
    GLOBAL_OFFSET_X,
    GLOBAL_OFFSET_Y,
    MULTI_BALLS,
    MIN_LINES,
    MAX_LINES,
} = CONFIGS;


// Create PIXI app
const app = new PIXI.Application({
    background: BACKGROUND_COLOR,
    height: window.outerHeight,
    width: window.outerWidth,
});
document.body.appendChild(app.view);


/**
 * @class Sounds
 * @description Class for creating and managing sounds
 * @property isMute - mute state
 * @method s - generic method for creating sound
 * @method createSounds - creates all sounds
 * @method createMuteButton - creates mute button
 * @method playSound - static method for play sound by name
 */
class Sounds {
    isMute = sessionStorage.getItem("mute"); // Get mute state from session storage

    constructor() {
        this.isMute ? sound.muteAll() : sound.unmuteAll(); // Mute or unmute all sounds
        this.createSounds(); // Create all sounds
        this.createMuteButton(); // Create mute button
    }

    createMuteButton() {
        const muteButton = new PIXI.Graphics();
        muteButton.beginFill(BALL_COLOR);
        muteButton.drawRect(0, 0, 80, 30);
        muteButton.endFill();
        muteButton.x = GLOBAL_OFFSET_X + GAME_BOARD_WIDTH - muteButton.width;
        muteButton.y = 16;
        muteButton.tint = this.isMute === "true" ? 0xffffff : 0x00ff00;
        muteButton.eventMode = "dynamic";
        muteButton.on("pointerdown", () => {
            Animations.buttonClick(muteButton);
            this.isMute = sessionStorage.getItem("mute");

            if (this.isMute === "true") {
                sessionStorage.setItem("mute", false);
                sound.unmuteAll();
                muteButton.tint = 0x00ff00;
                muteButton.children[0].text = "SOUND ON";
            } else {
                sessionStorage.setItem("mute", true);
                sound.muteAll();
                muteButton.tint = 0xffffff;
                muteButton.children[0].text = "SOUND OFF";
            }
        });

        app.stage.addChild(muteButton);

        const muteText = new PIXI.Text(this.isMute === "true" ? "SOUND OFF" : "SOUND ON", {
            fontSize: 12,
            align: "center",
            fontFamily: ["Tektur", "Arial"],
            fontWeight: "bold",
            fill: "#333",
        });
        muteText.anchor.set(0.5);
        muteText.x = muteButton.width / 2;
        muteText.y = muteButton.height / 2;
        muteButton.addChild(muteText);
    }

    s(name, file) {
        sound.add(name, {
            url: file,
            volume: 0.1,
            preload: true,
        });
    };

    createSounds() {
        this.s("coin", coin);
        this.s("run", run);
        this.s("change", change);
        this.s("min-max", minMax);
    }

    static playSound(name) {
        sound.play(name);
    }
}


/**
 * @class Animations
 * @description Class for creating and managing animations, use GSAP, static methods uses in lifeCycle method of Ball class
 * @property ease - ease type
 * @property duration - duration of animation
 * @property dy - delta y for ball move
 * @property dx - delta x for ball move
 * @method ballMoveRight - animation for ball move right
 * @method ballMoveLeft - animation for ball move left
 * @method ballMoveBottom - animation for ball move bottom
 * @method pegScale - animation for peg scale
 */
class Animations {
    // type EaseString = "none"
    //     | "power1" | "power1.in" | "power1.out" | "power1.inOut"
    //     | "power2" | "power2.in" | "power2.out" | "power2.inOut"
    //     | "power3" | "power3.in" | "power3.out" | "power3.inOut"
    //     | "power4" | "power4.in" | "power4.out" | "power4.inOut"
    //     | "back" | "back.in" | "back.out" | "back.inOut"
    //     | "bounce" | "bounce.in" | "bounce.out" | "bounce.inOut"
    //     | "circ" | "circ.in" | "circ.out" | "circ.inOut"
    //     | "elastic" | "elastic.in" | "elastic.out" | "elastic.inOut"
    //     | "expo" | "expo.in" | "expo.out" | "expo.inOut"
    //     | "sine" | "sine.in" | "sine.out" | "sine.inOut" | string;

    // Params for animations
    static ease = "back.out";
    static duration = 0.3;
    static dy = PEG_GAP_Y / 10;
    static dx = PEG_GAP_X / 2;

    static ballMoveRight(ball) {
        gsap.to(ball, {
            y: ball.y - this.dy,
            ease: this.ease,
            duration: 0,
        });
        gsap.to(ball, {
            x: ball.x + this.dx,
            ease: this.ease,
            duration: this.duration,
        });
    }
    static ballMoveLeft(ball) {
        gsap.to(ball, {
            y: ball.y - this.dy,
            duration: 0,
        });
        gsap.to(ball, {
            x: ball.x - this.dx,
            ease: this.ease,
            duration: this.duration,
        });
    }
    static ballMoveBottom(ball) {
        gsap.to(ball, {
            y: ball.y + BALL_SPEED,
            duration: 0,
        });
    }

    static pegScale(peg) {
        if (!peg.scale._active) {
            peg.scale._active = true;

            gsap.to(peg.scale, {
                x: 1.5,
                y: 1.5,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onComplete: () => { peg.scale._active = false; }
            });
        }
    }

    static cellCollision(cell) {
        if (!cell.position._active) {
            cell.position._active = true;
            cell.tint -= 10000;

            Sounds.playSound("coin");

            gsap.to(cell.position, {
                y: cell.y + 3,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onComplete: () => { cell.position._active = false; cell.tint += 10000; }
            });
        }

    }

    static buttonClick(button) {
        if (!button.scale._active) {
            button.scale._active = true;

            button.pivot.x = button.width / 2;
            button.pivot.y = button.height / 2;
            button.x += button.width / 2;
            button.y += button.height / 2;

            gsap.to(button.scale, {
                x: 0.9,
                y: 0.9,
                duration: 0.05,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    button.scale._active = false;
                    button.pivot.x = 0;
                    button.pivot.y = 0;
                    button.x -= button.width / 2;
                    button.y -= button.height / 2;
                }
            });
        }
    }
}


/**
 * @class BallCollisions
 * @description Class for checking collisions, use PIXI.Point for getting global position of objects, extends in Ball class
 * @property lineIndex - index of line, which ball has passed through
 * @method isPegCollision - check collision with peg
 * @method isCellCollision - check collision with cell
 * @method isLineCollision - check collision with line
 */
class BallCollisions {
    lineIndex = 0; // Index of line, which ball has passed through
    constructor(ball) {
        this.ball = ball;
    }
    isPegCollision(peg) {
        const ballGlobal = this.ball.toGlobal(new PIXI.Point());
        const pegGlobal = peg.toGlobal(new PIXI.Point());

        const dx = ballGlobal.x - pegGlobal.x;
        const dy = ballGlobal.y - pegGlobal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (BALL_RADIUS + PEG_RADIUS);
    }
    isCellCollision(cell) {
        if (this.ball.y < cell.getBounds().top - BALL_RADIUS) return false;

        const leftBound = cell.getBounds().left;
        const rightBound = cell.getBounds().right;
        return this.ball.x >= leftBound && this.ball.x <= rightBound;
    }
    isLineCollision(line) {
        const topOfLine = line.getBounds().top;
        return this.ball.y >= topOfLine;
    }
}


/**
 * @class Ball
 * @description Class for creating and managing ball, extends in BallCollisions class, use app.ticker for life cycle
 * @property cells - cells array, cells - is parts of basket
 * @property lines - lines array, lines - wrapper which contains pegs
 * @property directions - directions array, directions - result of binaryPass() function
 * @property totalNode - total node, node which contains total bet value
 * @property resultNode - result node, node which contains result value
 * @property linesControlNode - lines control node, node which contains lines control panel
 * @method lifeCycle - life cycle of ball, include birth(), life() and death() functions
 * @function birth - create ball, increment balls counter, play bet, add ball to the stage, start life cycle
 * @function life - check for collisions with pegs, cells and lines, run collision animations
 * @function death - remove ball, decrement balls counter, remove event listeners from lines control panel, destroy ball and related animations
 */
class Ball extends BallCollisions {
    ball = null;
    constructor(cells, lines, directions, totalNode, resultNode, linesControlNode) {
        super();
        this.cells = cells;
        this.lines = lines;
        this.directions = directions;
        this.totalNode = totalNode;
        this.resultNode = resultNode;
        this.linesControlNode = linesControlNode;

        this.lifeCycle(); // Start life cycle for initializing ball
    }

    lifeCycle() {
        const death = () => {
            app.ticker.remove(life); // Stop the ball life cycle
            app.stage.removeChild(this.ball); // Remove the ball from the stage
            gsap.killTweensOf(this.ball); // Kill all animations of the ball
            sessionStorage.setItem("balls-counter", +sessionStorage.getItem("balls-counter") - 1); // Decrement balls counter
            
            // Add event listeners to lines control panel if balls counter is 0, look at birth()
            if (+sessionStorage.getItem("balls-counter") === 0) {
                this.linesControlNode.children.forEach((child) => {
                    child.eventMode = "dynamic";
                });
            }
            this.ball.destroy({ children: true }); // Destroy the ball and children nodes
            this.ball = null; // Remove the ball from the memory
        }
        const  life = () => {
            const curLine = this.lines[this.lineIndex]; // Get nearest line

            // Check for nearest line collision
            if (this.isLineCollision(curLine)) {
                const pegs = curLine.children; // Get all pegs in the line

                // Check collision for each peg in the line
                pegs.forEach((peg) => {
                    if (this.isPegCollision(peg)) {
                        Animations.pegScale(peg);

                        // Check for result for the current line, generated by binaryPass(), look at plinkoInit()
                        switch (this.directions[this.lineIndex]) {
                            case "left":
                                Animations.ballMoveLeft(this.ball);
                                break;
                            case "right":
                                Animations.ballMoveRight(this.ball);
                                break;
                        }
                    }
                });

                // If ball is in the last gate, check for cell collision
                if (this.lineIndex === this.lines.length - 1) {
                    for (let i = 0; i < this.cells.length; i++) {
                        const cell = this.cells[i];
                        
                        // Check for cell collision
                        if (this.isCellCollision(cell)) {
                            const node = document.getElementById(`cell-${i}`); // Get cell node from statistics table
                            node.innerHTML = parseInt(node.innerHTML) + 1; // Increment cell value to statistics table

                            regResult(i); // Register result

                            const totalValueNode = this.totalNode.children[this.totalNode.children.length - 1];
                            totalValueNode.text = RESULTS.getResults().total; // Set total value to node

                            const resultValueNode = this.resultNode.children[this.resultNode.children.length - 1];
                            resultValueNode.text = RESULTS.getResults().profit; // Set profit value to node
                            resultValueNode.x = this.resultNode.children[0].width - resultValueNode.width + 20; // rewrite position after changing value

                            Animations.cellCollision(cell);

                            death(); // Remove the ball
                            return; // Stop the ball life cycle
                        }
                    }
                }

                // Increment line collision index because the ball has passed through the line
                if (this.lineIndex < this.lines.length - 1) {
                    this.lineIndex++;
                }
            }
            Animations.ballMoveBottom(this.ball); // Move the ball down
        }
        const birth = () => {
            // Check if total value less than bet value, make warning and stop the ball life cycle
            if (RESULTS.getResults().total < RESULTS.getResults().bet) {
                console.warn("You have no money for this bet!");
                return;
            }
            sessionStorage.setItem("balls-counter", +sessionStorage.getItem("balls-counter") + 1 || 1); // Increment balls counter
            
            // Create ball
            this.ball = new PIXI.Graphics();
            this.ball.beginFill(BALL_COLOR);
            this.ball.drawCircle(0, 0, BALL_RADIUS);
            this.ball.endFill();
            this.ball.x = GAME_BOARD_WIDTH / 2 + GLOBAL_OFFSET_X;
            this.ball.y = 0;

            playBet(); // Play bet
            
            const totalValueNode = this.totalNode.children[this.totalNode.children.length - 1];
            totalValueNode.text = RESULTS.getResults().total; // set total value to node

            app.stage.addChild(this.ball); // Add ball to the stage
            app.ticker.add(life); // Start the ball life cycle
            // console.log("Ball born");
        }
        
        birth(); // Initialize ball
    }
}


/**
 * @class PegsLines
 * @description Class for creating and managing pegs and lines
 * @method line - generic for line, line - wrapper which contains pegs
 * @method peg - generic for peg
 * @method createPegsLines - create pegs and lines, based on WEIGHTS array
 * @method getLines - return lines array
 */
class PegsLines {
    lines = [];
    constructor() {
        this.createPegsLines(); // Create pegs and lines
    }
    line(x, y) {
        const line = new PIXI.Graphics();
        // line.beginFill("rgba(0, 0, 0, 0.1)");
        line.drawRect(0, 0, GAME_BOARD_WIDTH, PEG_RADIUS * 2);
        line.endFill();
        line.x = x;
        line.y = y;
        return line;
    }
    peg(x, y) {
        const peg = new PIXI.Graphics();
        peg.beginFill(PEG_COLOR);
        peg.drawCircle(0, 0, PEG_RADIUS);
        peg.endFill();
        peg.x = x;
        peg.y = y;
        return peg;
    }
    createPegsLines() {
        const linesAmt = +sessionStorage.getItem("lines") || MAX_LINES; // Get lines amount from session storage

        for (let row = 0; row < linesAmt; row++) {
            const pegsInThisRow = WEIGHTS[row].length + 1;
            const totalWidth = (pegsInThisRow - 1) * PEG_GAP_X;
            const offsetX = (GAME_BOARD_WIDTH - totalWidth) / 2;
            const y = PADDING_TOP + PEG_GAP_Y * row;
            const line = this.line(0, y);

            for (let col = 0; col < pegsInThisRow; col++) {
                const x = col * PEG_GAP_X + offsetX;
                const peg = this.peg(x, PEG_RADIUS);
                line.addChild(peg);
            }

            this.lines.push(line);
            app.stage.addChild(line);
        }
    }
    getLines() {
        return this.lines;
    }
}


/**
 * @class Cells
 * @description Class for creating and managing cells
 * @method cell - generic for cell, cell - is part of basket
 * @method createCells - create cells, based on MULTIPLIERS array and last line
 * @method getCells - return cells array
 */
class Cells {
    cells = [];

    constructor(lines) {
        this.createCells(lines);
    }

    cell(x, y, index) {
        const multipliers = MULTIPLIERS[+sessionStorage.getItem("lines") || MAX_LINES]; // Get multipliers array based on lines amount from session storage
        const palette = generateGradient(multipliers.length); // Generate gradient for cells, look at main.js

        const cell = new PIXI.Graphics();
        cell.beginFill(palette[index]);
        cell.drawRect(0, 0, PEG_GAP_X, CELL_HEIGHT);
        cell.endFill();
        cell.x = x;
        cell.y = y;

        const text = new PIXI.Text(multipliers[index], {
            fontSize: 17,
            align: "center",
            fontFamily: ["Tektur", "Arial"],
            fontWeight: "bold",
            fill: "#333",
        });
        text.anchor.set(0.5);
        text.x = PEG_GAP_X / 2;
        text.y = CELL_HEIGHT / 2;

        cell.addChild(text);
        return cell;
    }

    createCells(lines) {
        const lastLine =  lines[lines.length - 1];

        for (let i = 0; i < lastLine.children.length - 1; i++) {
            const x = lastLine.children[i].x;
            const y = lastLine.y + PEG_GAP_Y;
            const cell = this.cell(x, y, i);

            app.stage.addChild(cell);
            this.cells.push(cell);
        }
    }
    getCells() {
        return this.cells;
    }
}


/**
 * @class HandlersBar
 * @description Class for creating and managing handlers bar
 * @property lines - lines array
 * @property cells - cells array
 * @property recreateGameBoard - function for recreating game board, get from GameBoard class
 * @method background - generic for background
 * @method button - generic for button
 * @method runButton - create run button
 * @method betControl - create bet control panel
 * @method total - create total node
 * @method results - create result node
 * @method linesControl - create lines control panel
 * @method createHandlersBar - create handlers bar, include all handlers nodes
 * @method getHandlersBar - return handlers bar
 */
class HandlersBar {
    handlerBar = null;

    runButtonNode = null;
    betControlNode = null;
    totalNode = null;
    resultNode = null;
    linesControlNode = null;

    constructor(lines, cells, recreateGameBoard) {
        this.lines = lines;
        this.cells = cells;
        this.recreateGameBoard = recreateGameBoard;
        this.createHandlersBar();
    }

    background(w, h, color = "rgba(0, 0, 0, 0.1)") {
        const bg = new PIXI.Graphics();
        bg.beginFill(color);
        bg.drawRect(0, 0, w, h);
        bg.endFill();
        return bg;
    }
    button(text, color, w = 100, h = 50) {
        const button = new PIXI.Graphics();
        button.beginFill(color);
        button.drawRect(0, 0, w, h);
        button.endFill();

        const buttonText = new PIXI.Text(text, {
            fontSize: 17,
            align: "center",
            fontFamily: ["Tektur", "Arial"],
            fontWeight: "bold",
            fill: "#333",
        });
        buttonText.anchor.set(0.5);
        buttonText.x = button.width / 2;
        buttonText.y = button.height / 2;

        button.addChild(buttonText);
        return button;
    }

    runButton(w = 320, h = 80) {
        const runButton = this.button("PLAY", BALL_COLOR, w, h);
        runButton.x = GAME_BOARD_WIDTH / 2 - runButton.width / 2;
        runButton.y = 0;
        runButton.children[0].style.fontSize = 37;
        runButton.eventMode = "dynamic";
        runButton.on("pointerdown", () => {
            Animations.buttonClick(runButton);
            Sounds.playSound("run");

            // Remove event listeners from lines control panel, when balls is running
            this.linesControlNode.children.forEach((child) => {
                child.eventMode = "none";
            });

            // Multi balls mode, run 100 balls for each click
            if (sessionStorage.getItem("multi-ball") === "true") {
                for (let i = 0; i < MULTI_BALLS; i++) {
                    setTimeout(() => {
                        const { directions } = binaryPass();
                        new Ball(this.cells, this.lines, directions, this.totalNode, this.resultNode, this.linesControlNode);
                    }, 100 * i);
                }
                return;
            }

            // Check if total value less than bet value, make warning and stop the ball life cycle
            if (RESULTS.getResults().total < RESULTS.getResults().bet) {
                alert("You have no money for this bet!");
                return;
            }

            const { directions } = binaryPass(); // Get directions array, look at algoritms.js
            new Ball(this.cells, this.lines, directions, this.totalNode, this.resultNode, this.linesControlNode); // Single ball mode, run 1 ball for each click
        });

        this.runButtonNode = runButton; // Save run button node to class property
        return runButton; // Return run button node
    }

    betControl(w = 200, h = 50) {
        // Create bet control panel
        const betContainer = new PIXI.Container();
        betContainer.width = w;
        betContainer.height = h;
        betContainer.x = GAME_BOARD_WIDTH / 2 - 100;
        betContainer.y = this.runButtonNode.height + 20 || 0;

        // Create bet control panel background
        betContainer.addChild(this.background(w, h));

        // Function for changing bet value
        const betChange = (direction) => {
            const value = betValue.text.split(" ")[0];

            if (value === "50" && direction === "up" || value === "1" && direction === "down") {
                return;
            }
            switch (direction) {
                case "up":
                    betValue.text = +value + 1 + " COIN";
                    setBet(+value + 1);
                    break;
                case "down":
                    betValue.text = +value - 1 + " COIN";
                    setBet(+value - 1);
                    break;
                case "max":
                    betValue.text = "50 COIN";
                    setBet(50);
                    break;
                case "min":
                    betValue.text = "1 COIN";
                    setBet(1);
                    break;
            }
        }

        const upButton = this.button("+", "greenyellow", 50, 50);
        upButton.x = 200 - upButton.width;
        upButton.eventMode = "dynamic";
        upButton.on("pointerdown", () => {
            Animations.buttonClick(upButton);
            Sounds.playSound("change");
            betChange("up");
        });
        betContainer.addChild(upButton);

        const upMaxButton = this.button("max", "yellowgreen", 50, 50);
        upMaxButton.x = upButton.x + upButton.width + 10;
        upMaxButton.eventMode = "dynamic";
        upMaxButton.on("pointerdown", () => {
            Animations.buttonClick(upMaxButton);
            Sounds.playSound("min-max");
            betChange("max");
        });
        betContainer.addChild(upMaxButton);

        const downButton = this.button("-", "orange", 50, 50);
        downButton.x = 0;
        downButton.eventMode = "dynamic";
        downButton.on("pointerdown", () => {
            Animations.buttonClick(downButton);
            Sounds.playSound("change");
            betChange("down");
        });
        betContainer.addChild(downButton);

        const upMinButton = this.button("min", "darkorange", 50, 50);
        upMinButton.x = downButton.x - upMinButton.width - 10;
        upMinButton.eventMode = "dynamic";
        upMinButton.on("pointerdown", () => {
            Animations.buttonClick(upMinButton);
            Sounds.playSound("min-max");
            betChange("min");
        });
        betContainer.addChild(upMinButton);

        // Create bet control panel text
        const betValue = new PIXI.Text("1 COIN", {
            fontSize: 17,
            align: "center",
            fontFamily: ["Tektur", "Arial"],
            fill: "#fff",
        });
        betValue.anchor.set(0.5);
        betValue.x = w / 2;
        betValue.y = h / 2;
        betContainer.addChild(betValue);

        this.betControlNode = betContainer;
        return betContainer;
    }

    total(w = 220, h = 150) {
        const totalContainer = new PIXI.Container();
        totalContainer.width = w;
        totalContainer.height = h;

        // totalContainer.addChild(this.background(w, h));

        const totalBetTitle = new PIXI.Text("TOTAL COINS:", {
            fontSize: 30,
            align: "center",
            fontFamily: ["Tektur", "Arial"],
            fill: "#fff",
        });
        const totalBetValue = new PIXI.Text(RESULTS.getResults().total, {
            fontSize: 50,
            align: "center",
            fontFamily: ["Tektur", "Arial"],
            fill: "#fff",
        });
        totalBetValue.y = totalBetTitle.height;

        totalContainer.addChild(totalBetTitle);
        totalContainer.addChild(totalBetValue);

        this.totalNode = totalContainer;
        return totalContainer;
    }

    results(w = 220, h = 150) {
        const resultsContainer  = new PIXI.Container();
        resultsContainer.width = w;
        resultsContainer.height = h;
        resultsContainer.x = GAME_BOARD_WIDTH - w;

        // resultsContainer.addChild(this.background(w, h));

        const resultsTitle = new PIXI.Text("LAST RESULT:", {
            fontSize: 30,
            align: "right",
            fontFamily: ["Tektur", "Arial"],
            fill: "#fff",
        });
        resultsTitle.x = w - resultsTitle.width;
        resultsContainer.addChild(resultsTitle);

        const resultValue = new PIXI.Text(RESULTS.getResults().profit, {
            fontSize: 50,
            align: "right",
            fontFamily: ["Tektur", "Arial"],
            fill: "#fff",
        });
        resultValue.y = resultsTitle.height;
        resultValue.x = w - resultValue.width;
        resultsContainer.addChild(resultValue);

        // const resultsTable = new PIXI.Container();
        // resultsTable.width = 150;
        // resultsTable.height = 150;
        // resultsTable.y = resultsTitle.height;
        // resultsContainer.addChild(resultsTable);

        this.resultNode = resultsContainer;
        return resultsContainer;
    }

    linesControl(w = 50, h = GAME_BOARD_HEIGHT) {
        const linesControl = new PIXI.Container();
        linesControl.width = w;
        linesControl.height = h;
        linesControl.x = GAME_BOARD_WIDTH - w;
        linesControl.y = 0 - h - PADDING_TOP;

        linesControl.addChild(this.background(w, h, BACKGROUND_COLOR));

        const linesControlTitle = new PIXI.Text("LINES", {
            fontSize: 15,
            align: "center",
            fontFamily: ["Tektur", "Arial"],
            fill: "#fff",
        });
        linesControlTitle.anchor.set(0.5);
        linesControlTitle.x = linesControl.width / 2;
        linesControlTitle.y = PEG_GAP_Y;
        linesControl.addChild(linesControlTitle);

        const curLine = sessionStorage.getItem("lines") || MAX_LINES;

        // Create lines control panel, based on MIN_LINES and MAX_LINES constants
        for (let i = MIN_LINES; i <= MAX_LINES; i++) {
            const linesControlValue = new PIXI.Text(i, {
                fontSize: 17,
                align: "center",
                fontFamily: ["Tektur", "Arial"],
                fill: +curLine === i ? BALL_COLOR : "#fff",
            });
            linesControlValue.anchor.set(0.5);
            linesControlValue.x = linesControl.width / 2;
            linesControlValue.y = linesControlValue.height * 2 * (i - MIN_LINES) + linesControlValue.height + 70;

            linesControlValue.eventMode = "dynamic";
            linesControlValue.on("pointerdown", () => {
                if (+sessionStorage.getItem("lines") === i) return;

                sessionStorage.setItem("lines", i);
                this.recreateGameBoard();

                app.stage.removeChild(this.handlerBar);
                this.handlerBar.destroy({ children: true });
                this.handlerBar = null;

                createStatisticTable();
            });
            linesControlValue.on("pointerover", () => {
                linesControlValue.style.fill = BALL_COLOR;
            });
            linesControlValue.on("pointerout", () => {
                if (+sessionStorage.getItem("lines") === i) return;
                linesControlValue.style.fill = "#fff";
            });
            linesControl.addChild(linesControlValue);
        }

        this.linesControlNode = linesControl;
        return linesControl;
    }

    createHandlersBar() {
        const handlerBar = new PIXI.Container();
        handlerBar.width = GAME_BOARD_WIDTH;
        handlerBar.height = GAME_BOARD_HEIGHT / 4;
        handlerBar.x = GLOBAL_OFFSET_X;
        handlerBar.y = GAME_BOARD_HEIGHT + PADDING_TOP + PEG_GAP_Y;

        app.stage.addChild(handlerBar);

        handlerBar.addChild(this.background(handlerBar.width, handlerBar.height));
        handlerBar.addChild(this.runButton());
        handlerBar.addChild(this.betControl());
        handlerBar.addChild(this.total());
        handlerBar.addChild(this.results());
        handlerBar.addChild(this.linesControl());

        this.handlerBar = handlerBar;
    }

    getHandlersBar() {
        return this.handlerBar;
    }
}


/**
 * @class GameBoard
 * @description Class for creating wrapper of all game elements and control position
 * @method createGameBoard - create game board
 * @method recreateGameBoard - recreate game board, used in handlers bar
 */
class GameBoard {
    gameBoard = null;

    constructor() {
        this.createGameBoard();
    }

    createGameBoard() {
        this.gameBoard = new PIXI.Container();
        this.gameBoard.width = GAME_BOARD_WIDTH;
        this.gameBoard.height = GAME_BOARD_HEIGHT;
        this.gameBoard.x = GLOBAL_OFFSET_X;
        this.gameBoard.y =  GLOBAL_OFFSET_Y;
        app.stage.addChild(this.gameBoard);

        const linesInstance = new PegsLines();
        const lines = linesInstance.getLines();

        const cellsInstance = new Cells(lines);
        const cells = cellsInstance.getCells();

        lines.forEach(line => this.gameBoard.addChild(line));
        cells.forEach(cell => this.gameBoard.addChild(cell));

        new HandlersBar(lines, cells, this.recreateGameBoard.bind(this))
    }

    recreateGameBoard() {
        this.gameBoard.children.forEach((child) => {
            app.stage.removeChild(child);
            child.destroy({ children: true });
        });
        this.gameBoard.destroy({ children: true });
        this.gameBoard = null;
        this.createGameBoard();
    }
}


/**
 * @function plinkoInit
 * @description Function for initializing game
 */
export function plinkoInit() {
    new Sounds(); // Initialize sounds
    new GameBoard(); // Initialize game board
}
