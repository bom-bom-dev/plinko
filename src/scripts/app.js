import * as PIXI from "pixi.js";
import {
    BACKGROUND_COLOR,
    BALL_COLOR,
    BALL_RADIUS,
    BASKET_HEIGHT, PADDING,
    PEG_COLOR,
    PEG_GAP_X, PEG_GAP_Y,
    PEG_RADIUS,
    weights
} from "./config";

const app = new PIXI.Application({
    background: BACKGROUND_COLOR,
    height: window.innerHeight,
    width: window.innerWidth,
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
        basket.drawRect(peg.x - PEG_GAP_X, peg.y + 20, PEG_GAP_X, BASKET_HEIGHT);
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
