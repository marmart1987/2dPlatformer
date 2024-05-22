export class collidableSprite extends PIXI.Sprite {
    constructor(texture, width, height, x, y, isStatic, noRotate) {
        super(texture)
        this.noRotate = noRotate
        this.width = width
        this.height = height
        this.x = x
        this.y = y
        let options = {}

        this.rigidBody = Matter.Bodies.rectangle(x, y, width, height, options) //x,y,w,h
        if (isStatic) {
            this.rigidBody.isStatic = true;
        }
        this.rigidBody.density = 0.01;


    }

    update() {
        this.position.set(this.rigidBody.position.x, this.rigidBody.position.y)

        if (!this.noRotate) {
            this.rotation = this.rigidBody.angle
        } else {
            Matter.Body.setAngularVelocity(this.rigidBody, 0)
        }
    }


    beforeUnload() {

    }
}