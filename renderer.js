let app = new PIXI.Application();
import config from "./config.js";
import {
    collidableSprite
} from "./collidableSprite.js";
import {
    player
} from "./player.js";
globalThis.__PIXI_APP__ = app;
window.onscroll = function () {
    window.scrollTo(0, 0);
};

function renderInit(level, assets, game, engine) {
    let appHeight = app.renderer.height * config.appHeightMultiplier
    let appWidth = app.renderer.width * config.appWidthMultiplier
    for (let y = level.map.length - 1; y > -1; y--) {
        let row = level.map[y]
        row.forEach((element, x) => {
            if (element.imagePath) {
                const size = appWidth / config.maxBlocksInWindow
                let sprite = new collidableSprite(assets[element.name], size, size, x * size + size / 2, appHeight - ((config.worldBottom + 1 - y) * size + size / 2), true)
                console.log(sprite)

                engine.addUpdatingSprite(sprite)
                sprite.anchor.set(0.5);
                game.addChild(sprite)

                /*
                let sprite = new PIXI.Sprite(assets[element.name])
                sprite.anchor.set(0.5);
                game.addChild(sprite)
                const size = appWidth / config.maxBlocksInWindow
                sprite.width = sprite.height = size
                sprite.x = x * size + size / 2
                sprite.y = appHeight - ((config.worldBottom + 1 - y) * size + size / 2)
                */

            }
        })
    }
}

(async () => {
    await app.init({
        background: '#1099bb',
        resizeTo: window
    });


    document.body.appendChild(app.canvas);
    PIXI.Assets.init({
        manifest: level.compileAssets(Object.values(block.blockTypes))
    })
    const assets = await PIXI.Assets.loadBundle('init');

    console.log(assets)
    const engine = new collisionEngine(PIXI)

    let lvl = new level(418)
    let game = new PIXI.Container
    app.stage.addChild(game)
    game.scale.x = game.scale.y = 1
    renderInit(lvl, assets, game, engine)
    let x = new player(await PIXI.Assets.load("./Assets/Player.png"), 50, engine.engine)
    engine.addUpdatingSprite(x)
    x.anchor.set(0.5);
    app.stage.addChild(x)

    let sprite = new collidableSprite(assets.baseplate, 100, 100, 100, 200, false)
    console.log("Falling sprite", sprite)
    engine.addUpdatingSprite(sprite)
    sprite.anchor.set(0.5);
    app.stage.addChild(sprite)



    document.documentElement.style.overflow = 'hidden'; // firefox, chrome
    document.body.scroll = "no"; // ie only


    app.ticker.add((time) => {
        engine.update()
        //const size = appWidth / config.maxBlocksInWindow


    });

})();

class collisionEngine {
    elements = []

    constructor(pixi) {
        console.log("Collisons starting")
        this.pixi = pixi
        this.engine = Matter.Engine.create({
            gravity: {
                y: 1
            },
            width: window.screen.width,
            height: window.screen.height
        })
        this.engine.gravity.scale = 0.001
        Matter.Events.on(this.engine, 'collisionStart', (event) => this.onCollision(event))
    }
    addUpdatingSprite(collidableSprite) {
        Matter.Composite.add(this.engine.world, collidableSprite.rigidBody)
        if (!collidableSprite.rigidBody.isStatic) {
            this.elements.push(collidableSprite)
        }
    }

    update() {
        Matter.Engine.update(this.engine, 1000 / 60)
        for (let el of this.elements) {
            el.update()
        }
    }

    // check who hits what 
    onCollision(event) {
        let collision = event.pairs[0]

    }


    findSpriteWithRigidbody(rb) {
        return this.elements.find((element) => element.rigidBody === rb)
    }

    removeElement(element) {
        element.beforeUnload()
        Matter.Composite.remove(this.engine.world, element.rigidBody) // stop physics simulation
        this.pixi.stage.removeChild(element) // stop drawing on the canvas
        this.elements = this.elements.filter((el) => el != element) // stop updating
    }

}