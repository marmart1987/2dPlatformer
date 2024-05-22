"use strict";
class PRNG {
    m;
    a;
    c;
    state;
    constructor(seed) {
        this.m = 0x80000000; // 2**31;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed !== undefined ? seed : Math.floor(Math.random() * (this.m - 1));
    }
    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }
    nextFloat() {
        // returns in range [0, 1)
        return this.nextInt() / (this.m - 1);
    }
    nextRange(start, end) {
        // returns in range [start, end): including start, excluding end
        // can't modulu nextInt because of weak randomness in lower bits
        const rangeSize = end - start;
        const randomUnder1 = this.nextInt() / this.m;
        return start + Math.floor(randomUnder1 * rangeSize);
    }
    choice(array) {
        return array[this.nextRange(0, array.length)];
    }
}
class arrayFuncs {
    static forEach = (array, callback) => {
        array.forEach(function (row, y) {
            row.forEach(function (element, x) {
                callback(element, x, y);
            });
        });
    };
}
function twoDArray(size, initializer) {
    let array = [];
    if (size[1] > 0 && size[0] > 0) {
        let row = [];
        for (let i = 0; i < size[0]; i++) {
            row.push(initializer);
        }
        for (let i = 0; i < size[1]; i++) {
            array.push(row);
        }
        return array;
    }
    return [];
}
class blockType {
    name;
    collisions;
    generatable;
    size = [-1, -1];
    imagePath;
    constructor(collisions, name, generatable, imagePath) {
        this.name = name;
        this.collisions = collisions;
        this.generatable = generatable;
        this.imagePath = imagePath;
    }
}
class block {
    static blockTypes = {
        air: new blockType(false, "air", false),
        baseplate: new blockType(false, "baseplate", true, "./Assets/baseplate.png"),
        stairs: new blockType(false, "stairs", true),
    };
    constructor(type) {
        let request = block.blockTypes[type];
        if (!request?.name) {
            throw ("Unable to create block with nonexistant block type \"" + type + "\"");
        }
        return request;
    }
}
class map {
    prng;
    placeableBlockTypes;
    map;
    constructor(prng) {
        if (!prng) {
            console.error("Missing PRNG");
        }
        this.prng = prng;
        this.placeableBlockTypes = map.compilePlaceableBlockTypes();
        //@ts-ignore
        this.map = map.combineChunks(chunk(), chunk(), chunk(), chunk(), chunk(), chunk(), chunk(), chunk());
        return this.map;
    }
    static compilePlaceableBlockTypes() {
        return Object.values(block.blockTypes).filter(function (element) {
            if (element.generatable) {
                return true;
            }
        });
    }
    static combineChunks(...chunks) {
        let combined = [];
        chunks[0].forEach(function (yHeight, index) {
            combined[index] = yHeight;
            chunks.forEach((chunk, cIndex) => {
                if (cIndex === 0) {
                    return;
                }
                combined[index] = combined[index].concat(chunk[index]);
            });
        });
        return combined;
    }
    chooseRandomTile(prng) {
        return new block(this.placeableBlockTypes[prng.nextRange(0, this.placeableBlockTypes.length)].name);
    }
}
class baseplate {
    constructor() {
        let plate = twoDArray([16, 1], new block("baseplate"));
        return plate[0];
    }
}
function chunk() {
    let chunk = twoDArray([16, 100], new block("air"));
    chunk.push(new baseplate(), new baseplate(), new baseplate());
    return chunk;
}
function weightedChoose(array, prng) {
    let range = [];
    array.forEach((value) => {
        for (let i = 0; i < value[1]; i++) {
            range.push(value[0]);
        }
    });
    return prng.choice(range);
}
class level {
    levelSeed;
    prng;
    map;
    assets;
    constructor(seed) {
        this.levelSeed = seed ? seed : Date.now();
        this.prng = new PRNG(Number(this.levelSeed));
        this.map = new map(this.prng);
        this.assets = level.compileAssets(Object.values(block.blockTypes));
    }
    static compileAssets(blocks) {
        let blocksWithSprites = blocks.filter(function (value) { return value.imagePath !== undefined; });
        //@ts-ignore
        let assets = blocksWithSprites.map((value) => {
            return {
                name: value.name,
                url: value.imagePath,
                bundle: "init"
            };
        });
        let manifest = {
            bundles: []
        };
        let createdBundles = { init: 0 };
        //@ts-ignore
        manifest.bundles.push({
            name: "init",
            assets: []
        });
        assets.forEach(function (asset) {
            if (asset.bundle) {
                //@ts-ignore
                if (createdBundles[asset.bundle] > -1) {
                    //@ts-ignore
                    manifest.bundles[createdBundles[asset.bundle]].assets.push({
                        alias: asset.name,
                        src: asset.url
                    });
                }
                else {
                    manifest.bundles[manifest.bundles.length] = {
                        name: asset.bundle,
                        assets: [{
                                alias: asset.name,
                                src: asset.url
                            }]
                    };
                    //@ts-ignore
                    createdBundles[asset.bundle] = manifest.bundles.length - 1;
                }
            }
            else {
                manifest.bundles[0].assets.push({
                    alias: asset.name,
                    src: asset.url
                });
            }
            manifest.bundles.push();
        });
        return manifest;
    }
}
