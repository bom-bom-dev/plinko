import * as PIXI from "pixi.js";

const weights = [
    [0.5, 0.5],
    [0.25, 0.5, 0.25],
    [0.125, 0.375, 0.375, 0.125],
    [0.0625, 0.25, 0.375, 0.25, 0.0625],
    [0.03125, 0.15625, 0.3125, 0.3125, 0.15625, 0.03125],
    [0.015625, 0.09375, 0.234375, 0.3125, 0.234375, 0.09375, 0.015625],
    [0.0078125, 0.0546875, 0.1640625, 0.2734375, 0.2734375, 0.1640625, 0.0546875, 0.0078125],
    [0.00390625, 0.03125, 0.109375, 0.21875, 0.2734375, 0.21875, 0.109375, 0.03125, 0.00390625],
    [0.001953125, 0.017578125, 0.0703125, 0.1640625, 0.24609375, 0.24609375, 0.1640625, 0.0703125, 0.017578125, 0.001953125],
    [0.0009765625, 0.009765625, 0.046875, 0.1171875, 0.205078125, 0.24609375, 0.205078125, 0.1171875, 0.046875, 0.009765625, 0.0009765625],
    [0.00048828125, 0.005859375, 0.03125, 0.09375, 0.17578125, 0.234375, 0.234375, 0.17578125, 0.09375, 0.03125, 0.005859375, 0.00048828125]
]

const BALL_COLOR = "gold";
const PEG_COLOR = "white";
const BACKGROUND_COLOR = "darkslateblue";

const PEG_RADIUS = 5;
const PEG_GAP_X = 50;
const PEG_GAP_Y = 70;
const PADDING = 100;
const BALL_RADIUS = 10;
const BASKET_HEIGHT = 50;

const app = new PIXI.Application({
    background: BACKGROUND_COLOR,
    height: window.innerHeight - 3,
    width: window.innerWidth - 3,
});
document.body.appendChild(app.view);


class Ball {
    ball = null;
    constructor(pegs, basket) {
        this.pegs = pegs;
        this.basket = basket;

        this.ball = new PIXI.Graphics();
        this.ball.beginFill(BALL_COLOR);
        this.ball.drawCircle(0, 0, BALL_RADIUS);
        this.ball.endFill();
        this.ball.x = app.renderer.width / 2;
        this.ball.y = 0;
        this.draw();
    }

    checkPegCollision(peg) {
        const dx = this.ball.x - peg.x;
        const dy = this.ball.y - peg.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (BALL_RADIUS + PEG_RADIUS);
    }
    checkBasketCollision(cell) {
        const topOfBasket = app.renderer.height - BASKET_HEIGHT;
        if (this.ball.y + BALL_RADIUS >= topOfBasket) {
            const leftBound = cell.getBounds().left;
            const rightBound = cell.getBounds().right;
            return this.ball.x >= leftBound && this.ball.x <= rightBound;
        }
        return false;
    }

    lifeCycle() {
        const death = () => {
            app.stage.removeChild(this.ball);
            app.ticker.remove(life);
            console.log('Ball died');
        }
        const  life = () => {
            this.ball.y += 3; // Gravity
            this.pegs.forEach(peg => {
                if (this.checkPegCollision(peg)) {
                    console.log('Peg collision')
                    this.ball.x += PEG_GAP_X / 2;
                }
            });
            this.basket.forEach((cell, i) => {
                if (this.checkBasketCollision(cell)) {
                    console.log('Basket collision with cell:', i);
                    death();
                }
            });
        }
        const birth = () => {
            app.stage.addChild(this.ball);
            app.ticker.add(life);
            console.log('Ball born');
        }

        birth();
    }

    draw() {
        this.lifeCycle();
    }
}

class Pegs {
    pegs = [];
    constructor() {
        this.pegs = this.createPegs();
        this.draw();
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
    createPegs() {

        for (let row = 0; row < weights.length; row++) {
            const colsInThisRow = weights[row].length + 1;
            const totalWidth = (colsInThisRow - 1) * PEG_GAP_X;
            const offsetX = (app.renderer.width - totalWidth) / 2;

            for (let col = 0; col < colsInThisRow; col++) {
                const x = col * PEG_GAP_X + offsetX;
                const y = row * PEG_GAP_Y + PADDING;

                const peg = this.peg(x, y);
                this.pegs.push(peg);
            }
        }

        return this.pegs;
    }
    getPegs() {
        return this.pegs;
    }
    draw() {
        this.pegs.forEach(peg => {
            app.stage.addChild(peg);
        });
    }
}

class Basket {
    cells = [];
    constructor(pegs) {
        const lastRowPegs = pegs.slice(weights.pop().length * -1);
        this.cells = lastRowPegs.map((peg, index) => this.createBasket(peg, index));
        this.draw();
    }
    createBasket(peg, index) {
        const basket = new PIXI.Graphics();
        basket.beginFill(index % 2 === 0 ? "green" : "yellowgreen");
        basket.drawRect(peg.x - PEG_GAP_X, app.renderer.height - BASKET_HEIGHT, PEG_GAP_X, BASKET_HEIGHT);
        basket.endFill();
        return basket;
    }
    getBasket() {
        return this.cells;
    }
    draw() {
        this.cells.forEach(basket => {
            app.stage.addChild(basket);
        });
    }
}

function plinko() {
    const pegsInstance = new Pegs();
    const pegs = pegsInstance.getPegs();

    const basketInstance = new Basket(pegs);
    const basket = basketInstance.getBasket();

    document.querySelector("canvas").onclick = () => {
        new Ball(pegs, basket);
    };
}

plinko();
