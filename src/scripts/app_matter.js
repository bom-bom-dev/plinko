// import * as PIXI from "pixi.js";
// import * as Matter from 'matter-js';
//
// // import weights from "../resources/weights.json";
//
// const weights = {
//     "1": [0.5, 0.5],
//     "2": [0.25, 0.5, 0.25],
//     "3": [0.125, 0.375, 0.375, 0.125],
//     "4": [0.0625, 0.25, 0.375, 0.25, 0.0625],
//     "5": [0.03125, 0.15625, 0.3125, 0.3125, 0.15625, 0.03125],
//     "6": [0.015625, 0.09375, 0.234375, 0.3125, 0.234375, 0.09375, 0.015625],
//     "7": [0.0078125, 0.0546875, 0.1640625, 0.2734375, 0.2734375, 0.1640625, 0.0546875, 0.0078125],
//     "8": [0.00390625, 0.03125, 0.109375, 0.21875, 0.2734375, 0.21875, 0.109375, 0.03125, 0.00390625],
//     "9": [0.001953125, 0.017578125, 0.0703125, 0.1640625, 0.24609375, 0.24609375, 0.1640625, 0.0703125, 0.017578125, 0.001953125],
//     "10": [0.0009765625, 0.009765625, 0.046875, 0.1171875, 0.205078125, 0.24609375, 0.205078125, 0.1171875, 0.046875, 0.009765625, 0.0009765625],
//     "11": [0.00048828125, 0.005859375, 0.03125, 0.09375, 0.17578125, 0.234375, 0.234375, 0.17578125, 0.09375, 0.03125, 0.005859375, 0.00048828125]
// };
//
// const PEG_RADIUS = 5;
// const PEG_GAP_X = 50;
// const PEG_GAP_Y = 70;
// const PADDING = 50;
// const BALL_RADIUS = 10;
//
//
// const app = new PIXI.Application({
//     background: '#1099bb',
//     height: window.innerHeight - 3,
//     width: window.innerWidth - 3,
// });
// document.body.appendChild(app.view);
//
//
// // PHYSICS
// const engine = Matter.Engine.create();
// const world = engine.world;
// Matter.Engine.run(engine);
//
//
// // GRAPHICS
// const pegs = [];
//
// function pegsGenerator() {
//     for (let row = 0; row < Object.keys(weights).length; row++) {
//         const colsInThisRow = weights[row + 1].length + 1;
//         const totalWidth = (colsInThisRow - 1) * PEG_GAP_X;
//         const offsetX = (app.renderer.width - totalWidth) / 2;
//
//         for (let col = 0; col < colsInThisRow; col++) {
//             const x = col * PEG_GAP_X + offsetX;
//             const y = row * PEG_GAP_Y + PADDING;
//
//             const pegBody = Matter.Bodies.circle(x, y, PEG_RADIUS, {
//                 isStatic: true,
//             });
//             pegs.push(pegBody);
//             Matter.World.add(world, pegBody);
//         }
//     }
//
//     pegs.forEach(peg => {
//         const pegGraphic = new PIXI.Graphics();
//         pegGraphic.beginFill(0x0000ff);
//         pegGraphic.drawCircle(peg.position.x, peg.position.y, PEG_RADIUS);
//         pegGraphic.endFill();
//         app.stage.addChild(pegGraphic);
//     });
// }
// pegsGenerator();
//
//
//
// // Graphics for ball
// let ball;
//
// // Physics for ball
// let ballBody;
//
// const  beforeUpdateEvent = function() {
//     Matter.Body.setVelocity(ballBody, { x: ballBody.velocity.x, y: 1 });
// }
//
//
// // Set ball to physics body
// function newBall() {
//     ball = new PIXI.Graphics();
//     ball.beginFill(0xff1000);
//     ball.drawCircle(0, 0, BALL_RADIUS);
//     ball.endFill();
//     app.stage.addChild(ball);
//
//     ballBody = new BallBodyFactory(app.renderer.width / 2, 0);
//     Matter.World.add(world, ballBody);
//     Matter.Body.setPosition(ballBody, { x: app.renderer.width / 2, y: 0 });
//
//     Matter.Events.on(engine, 'beforeUpdate', beforeUpdateEvent);
// }
//
// function BallBodyFactory(x, y) {
//     return Matter.Bodies.circle(x, y, BALL_RADIUS, {
//         restitution: .5,
//     });
// }
//
//
// document.querySelector("canvas").onclick = () => {
//     newBall();
// };
//
//
// app.ticker.add((delta) => {
//     Matter.Engine.update(engine, delta * 1000 / 60); // 60 FPS
//
//     if (!ballBody || !ball) {
//         return;
//     }
//
//     ball.x = ballBody.position.x;
//     ball.y = ballBody.position.y;
//
//     if (ball.y >= app.renderer.height - BALL_RADIUS) {
//         Matter.World.remove(world, ballBody);
//         ballBody = null;
//         ball.destroy();
//         Matter.Events.off(engine, 'beforeUpdate', beforeUpdateEvent);
//     }
// });
//
