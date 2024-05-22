import config from "./config.js";

export function controlsManager(player, dt) {
    if (!player) return;
    const acceleration = config.movementAcceleration
    const vel = player.rigidBody.velocity;
    if (player.isMovingLeft) {
        // console.log("left", vel.x)
        vel.x -= acceleration * dt;
    } else if (player.isMovingRight) {
        // console.log("right", vel.x)
        vel.x += acceleration * dt;
    }
    player.limitMaxSpeed()
    //console.log(player.rigidBody.speed, player.rigidBody.position.x)
    Matter.Body.setVelocity(player.rigidBody, vel);
}