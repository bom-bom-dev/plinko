import * as PIXI from "pixi.js";
import { sound } from '@pixi/sound';
import { gsap } from "gsap";
import { binaryPass } from "./algoritms";
import { CONFIGS, MULTIPLIERS, WEIGHTS } from "./configs";
import { generateGradient } from "./main";
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
} = CONFIGS;


// Create PIXI app
const app = new PIXI.Application({
    background: BACKGROUND_COLOR,
    height: window.outerHeight,
    width: window.outerWidth,
});
document.body.appendChild(app.view);


class Sounds {
    constructor() {
        this.createSounds();
    }

    _sound(name, file) {
        sound.add(name, {
            url: file,
            volume: 0.1,
            preload: true,
        });
    };

    createSounds() {
        this._sound("coin", coin);
        this._sound("run", run);
        this._sound("change", change);
        this._sound("min-max", minMax);
    }

    static playSound(name) {
        sound.play(name);
    }
}

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

class BallCollisions {
    lineIndex = 0;
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

class Ball extends BallCollisions {
    ball = null;
    constructor(cells, lines, directions) {
        super();
        this.cells = cells;
        this.lines = lines;
        this.directions = directions;
        this.lifeCycle();
    }

    lifeCycle() {
        const death = () => {
            app.stage.removeChild(this.ball);
            app.ticker.remove(life);
            // console.log('Ball died');
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
                    this.cells.forEach((cell, i) => {
                        if (this.isCellCollision(cell)) {

                            // TODO: make statistics function
                            const node = document.getElementById(`cell-${i}`);
                            node.innerHTML = parseInt(node.innerHTML) + 1; // Increment cell value to statistics table

                            Animations.cellCollision(cell); // Animate cell collision
                            death(); // Remove the ball
                        }
                    });
                }

                // Increment line collision index because the ball has passed through the line
                if (this.lineIndex < this.lines.length - 1) {
                    this.lineIndex++;
                }
            }

            Animations.ballMoveBottom(this.ball); // Move the ball down
        }
        const birth = () => {
            // Create ball
            // TODO make a Creator class 
            this.ball = new PIXI.Graphics();
            this.ball.beginFill(BALL_COLOR);
            this.ball.drawCircle(0, 0, BALL_RADIUS);
            this.ball.endFill();
            this.ball.x = GAME_BOARD_WIDTH / 2 + GLOBAL_OFFSET_X;
            this.ball.y = 0;

            app.stage.addChild(this.ball); // Add ball to the stage
            app.ticker.add(life); // Start the ball life cycle
            // console.log('Ball born');
        }
        birth();
    }
}

class PegsLines {
    lines = [];
    constructor() {
        this.createPegsLines();
    }
    line(x, y) {
        const line = new PIXI.Graphics();
        // line.beginFill('rgba(0, 0, 0, 0.1)');
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
        for (let row = 0; row < WEIGHTS.length; row++) {
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

class Cells {
    cells = [];
    palette = generateGradient(WEIGHTS[WEIGHTS.length - 1].length);
    constructor(lines) {
        this.createCells(lines);
    }

    cell(x, y, index) {
        const cell = new PIXI.Graphics();
        cell.beginFill(this.palette[index]);
        cell.drawRect(0, 0, PEG_GAP_X, CELL_HEIGHT);
        cell.endFill();
        cell.x = x;
        cell.y = y;

        const text = new PIXI.Text(MULTIPLIERS[index], {
            fontSize: 17,
            align: 'center',
            fontFamily: 'Tektur',
            fontWeight: 'bold',
            fill: '#333',
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

class GameBoard {
    gameBoard;

    constructor(lines, cells) {
        this.createGameBoard(lines, cells);
    }

    createGameBoard(lines, cells) {
        this.gameBoard = new PIXI.Container();
        this.gameBoard.width = GAME_BOARD_WIDTH;
        this.gameBoard.height = GAME_BOARD_HEIGHT;
        this.gameBoard.x = GLOBAL_OFFSET_X;
        this.gameBoard.y = GLOBAL_OFFSET_Y;

        lines.forEach(line => this.gameBoard.addChild(line));
        cells.forEach(cell => this.gameBoard.addChild(cell));
        app.stage.addChild(this.gameBoard);
    }

    getBoard() {
        return this.gameBoard;
    }
}

class HandlerBar {
    constructor(lines, cells) {
        this.createHandlerBar();
        this.lines = lines;
        this.cells = cells;
    }

    button(text, color, w = 100, h = 50) {
        const button = new PIXI.Graphics();
        button.beginFill(color);
        button.drawRect(0, 0, w, h);
        button.endFill();

        const buttonText = new PIXI.Text(text, {
            fontSize: 17,
            align: 'center',
            fontFamily: 'Tektur',
            fontWeight: 'bold',
            fill: '#333',
        });
        buttonText.anchor.set(0.5);
        buttonText.x = button.width / 2;
        buttonText.y = button.height / 2;

        button.addChild(buttonText);
        return button;
    }
    createHandlerBar() {
        const handlerBar = new PIXI.Container();
        handlerBar.width = GAME_BOARD_WIDTH;
        handlerBar.height = GAME_BOARD_HEIGHT / 4;
        handlerBar.x = GLOBAL_OFFSET_X;
        handlerBar.y = GAME_BOARD_HEIGHT + PADDING_TOP + PEG_GAP_Y;


        const background = new PIXI.Graphics();
        background.beginFill("rgba(0, 0, 0, 0.1)");
        background.drawRect(0, 0, GAME_BOARD_WIDTH, GAME_BOARD_HEIGHT / 4);
        background.endFill();
        handlerBar.addChild(background);


        const runButton = this.button("GO!", BALL_COLOR, 320, 80);
        runButton.x = GAME_BOARD_WIDTH / 2 - runButton.width / 2;
        runButton.y = 0;
        runButton.eventMode = "dynamic";
        runButton.on("pointerdown", () => {
            Animations.buttonClick(runButton);
            Sounds.playSound("run");

            if (sessionStorage.getItem("multi-ball") === "true") {
                for (let i = 0; i < 100; i++) {
                    setTimeout(() => {
                        const directions = binaryPass();
                        new Ball(this.cells, this.lines, directions);
                    }, 100 * i);
                }
                return;
            }

            const directions = binaryPass();
            new Ball(this.cells, this.lines, directions);
        });


        const betContainer = new PIXI.Container();
        betContainer.width = 200;
        betContainer.height = 50;
        betContainer.x = GAME_BOARD_WIDTH / 2 - 100;
        betContainer.y = runButton.height + 20;

        const background2 = new PIXI.Graphics();
        background2.beginFill("rgba(0, 0, 0, 0.1)");
        background2.drawRect(0, 0, 200, 50);
        background2.endFill();
        betContainer.addChild(background2);

        const betText = new PIXI.Text("1 COIN", {
            fontSize: 17,
            align: 'center',
            fontFamily: 'Tektur',
            fontWeight: '',
            fill: '#fff',
        });
        betText.anchor.set(0.5);
        betText.x = betContainer.width / 2;
        betText.y = betContainer.height / 2;

        const betControls = (direction) => {
            const value = betText.text.split(" ")[0];

            if (value === "50" && direction === "up" || value === "1" && direction === "down") {
                return;
            }
            switch (direction) {
                case "up":
                    betText.text = +value + 1 + " COIN";
                    break;
                case "down":
                    betText.text = +value - 1 + " COIN";
                    break;
                case "max":
                    betText.text = "50 COIN";
                    break;
                case "min":
                    betText.text = "1 COIN";
                    break;
            }
        }

        const upButton = this.button("+", "greenyellow", 50, 50);
        upButton.x = 200 - upButton.width;
        upButton.eventMode = "dynamic";
        upButton.on("pointerdown", () => {
            Animations.buttonClick(upButton);
            Sounds.playSound("change");
            betControls("up");
        });

        const upMaxButton = this.button("max", "yellowgreen", 50, 50);
        upMaxButton.x = upButton.x + upButton.width + 10;
        upMaxButton.eventMode = "dynamic";
        upMaxButton.on("pointerdown", () => {
            Animations.buttonClick(upMaxButton);
            Sounds.playSound("min-max");
            betControls("max");
        });

        const downButton = this.button("-", "orange", 50, 50);
        downButton.x = 0;
        downButton.eventMode = "dynamic";
        downButton.on("pointerdown", () => {
            Animations.buttonClick(downButton);
            Sounds.playSound("change");
            betControls("down");
        });

        const upMinButton = this.button("min", "darkorange", 50, 50);
        upMinButton.x = downButton.x - upMinButton.width - 10;
        upMinButton.eventMode = "dynamic";
        upMinButton.on("pointerdown", () => {
            Animations.buttonClick(upMinButton);
            Sounds.playSound("min-max");
            betControls("min");
        });

        betContainer.addChild(upButton);
        betContainer.addChild(upMaxButton);
        betContainer.addChild(downButton);
        betContainer.addChild(upMinButton);
        betContainer.addChild(betText);


        const totalContainer = new PIXI.Container();
        totalContainer.width = 150;
        totalContainer.height = 150;

        const totalBetTitle = new PIXI.Text("TOTAL BET:", {
            fontSize: 32,
            align: 'center',
            fontFamily: 'Tektur',
            fontWeight: '',
            fill: '#fff',
        });
        const totalBetValue = new PIXI.Text("1000", {
            fontSize: 50,
            align: 'center',
            fontFamily: 'Tektur',
            fontWeight: '',
            fill: '#fff',
        });
        totalBetValue.y = totalBetTitle.height;

        totalContainer.addChild(totalBetTitle);
        totalContainer.addChild(totalBetValue);


        const resultsContainer  = new PIXI.Container();
        resultsContainer.width = 150;
        resultsContainer.height = 150;
        resultsContainer.x = GAME_BOARD_WIDTH - 150;

        const resultsTitle = new PIXI.Text("RESULTS:", {
            fontSize: 32,
            align: 'center',
            fontFamily: 'Tektur',
            fontWeight: '',
            fill: '#fff',
        });
        resultsContainer.addChild(resultsTitle);

        const resultsTable = new PIXI.Container();
        resultsTable.width = 150;
        resultsTable.height = 150;
        resultsTable.y = resultsTitle.height;
        resultsContainer.addChild(resultsTable);

        handlerBar.addChild(runButton);
        handlerBar.addChild(betContainer);
        handlerBar.addChild(totalContainer);
        handlerBar.addChild(resultsContainer);
        app.stage.addChild(handlerBar);
    }
}

export function plinkoInit() {
    new Sounds();

    const linesInstance = new PegsLines();
    const lines = linesInstance.getLines();

    const cellsInstance = new Cells(lines);
    const cells = cellsInstance.getCells();

    new GameBoard(lines, cells);
    new HandlerBar(lines, cells);
}
