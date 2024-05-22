class PRNG {
    private readonly m: number;
    private readonly a: number;
    private readonly c: number;
    private state: number;

    constructor(seed?: number) {
        this.m = 0x80000000; // 2**31;
        this.a = 1103515245;
        this.c = 12345;

        this.state = seed !== undefined ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    nextInt(): number {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }

    nextFloat(): number {
        // returns in range [0, 1)
        return this.nextInt() / (this.m - 1);
    }

    nextRange(start: number, end: number): number {
        // returns in range [start, end): including start, excluding end
        // can't modulu nextInt because of weak randomness in lower bits
        const rangeSize = end - start;
        const randomUnder1 = this.nextInt() / this.m;
        return start + Math.floor(randomUnder1 * rangeSize);
    }

    choice<T>(array: Array<T>): T {
        return array[this.nextRange(0, array.length)];
    }

}
class arrayFuncs {
    static forEach = (array: Array<Array<any>>, callback: Function) => {
        array.forEach(function (row, y) {
            row.forEach(function (element, x) {
                callback(element, x, y)
            })
        })
    }
}
function twoDArray(size: [number, number], initializer: any) {

    let array: Array<any> = []
    if (size[1] > 0 && size[0] > 0) {
        let row: Array<any> = []
        for (let i = 0; i < size[0]; i++) {
            row.push(initializer)
        }
        for (let i = 0; i < size[1]; i++) {
            array.push(row)
        }
        return array
    }
    return []

}


class blockType {
    name: string;
    collisions: boolean;
    generatable: boolean;
    size: [number, number] = [-1, -1];
    imagePath: string | undefined;
    constructor(collisions: boolean, name: string, generatable: boolean, imagePath?: string,) {
        this.name = name
        this.collisions = collisions
        this.generatable = generatable
        this.imagePath = imagePath
    }
}

class block {
    static blockTypes = {
        air: new blockType(false, "air", false,),
        baseplate: new blockType(false, "baseplate", true, "./Assets/baseplate.png"),
        stairs: new blockType(false, "stairs", true),
    }
    constructor(type: string) {
        let request: any = block.blockTypes[type as keyof block]
        if (!request?.name) { throw ("Unable to create block with nonexistant block type \"" + type + "\"") }
        return request
    }
}


class map {
    prng: PRNG
    placeableBlockTypes: Array<blockType>
    map: any
    constructor(prng: PRNG) {
        if (!prng) {
            console.error("Missing PRNG");
        }

        this.prng = prng
        this.placeableBlockTypes = map.compilePlaceableBlockTypes()
        //@ts-ignore
        this.map = map.combineChunks(chunk(), chunk(), chunk(), chunk(), chunk(), chunk(), chunk(), chunk())

        return this.map
    }
    static compilePlaceableBlockTypes() {
        return Object.values(block.blockTypes).filter(function (element: blockType) {
            if (element.generatable) {
                return true
            }
        })
    }
    static combineChunks(...chunks: Array<Array<Array<block>>>) {
        let combined: Array<Array<block>> = []
        chunks[0].forEach(function (yHeight, index) {
            combined[index] = yHeight
            chunks.forEach((chunk, cIndex) => {
                if (cIndex === 0) { return }
                combined[index] = combined[index].concat(chunk[index])
            })

        })
        return combined
    }
    chooseRandomTile(prng: PRNG) {
        return new block(this.placeableBlockTypes[prng.nextRange(0, this.placeableBlockTypes.length)].name)
    }
}
class baseplate {
    constructor() {
        let plate = twoDArray([16, 1], new block("baseplate"))
        return plate[0]
    }
}
function chunk() {

    let chunk = twoDArray([16, 100], new block("air"))
    chunk.push(new baseplate(), new baseplate(), new baseplate())
    return chunk
}
interface asset {
    name: string
    url: string
    bundle?: string
}
interface bundle {
    name: string
    assets: {
        alias: string,
        src: string
    }[]
}
interface manifest {
    bundles: bundle[]
}
function weightedChoose(array: Array<[any, number]>, prng: PRNG) {
    let range: any[] = []
    array.forEach((value) => {
        for (let i = 0; i < value[1]; i++) {
            range.push(value[0])
        }
    })
    return prng.choice(range)
}

class level {
    levelSeed: number;
    prng: PRNG;
    map: map
    assets: object
    constructor(seed?: number) {
        this.levelSeed = seed ? seed : Date.now();
        this.prng = new PRNG(Number(this.levelSeed))
        this.map = new map(this.prng)
        this.assets = level.compileAssets(Object.values(block.blockTypes))
    }
    static compileAssets(blocks: Array<blockType>) {
        let blocksWithSprites = blocks.filter(function (value) { return value.imagePath !== undefined })
        //@ts-ignore
        let assets: asset[] = blocksWithSprites.map((value) => {
            return {
                name: value.name,
                url: value.imagePath,
                bundle: "init"
            }

        })
        let manifest: manifest = {
            bundles: []
        }


        let createdBundles = { init: 0 };
        //@ts-ignore
        manifest.bundles.push({
            name: "init",
            assets: []
        })
        assets.forEach(function (asset) {
            if (asset.bundle) {
                //@ts-ignore
                if (createdBundles[asset.bundle] > -1) {
                    //@ts-ignore
                    manifest.bundles[createdBundles[asset.bundle]].assets.push({
                        alias: asset.name,
                        src: asset.url
                    })
                } else {
                    manifest.bundles[manifest.bundles.length] = {
                        name: asset.bundle,
                        assets: [{
                            alias: asset.name,
                            src: asset.url
                        }]
                    }
                    //@ts-ignore
                    createdBundles[asset.bundle] = manifest.bundles.length - 1
                }
            } else {
                manifest.bundles[0].assets.push({
                    alias: asset.name,
                    src: asset.url
                })
            }
            manifest.bundles.push()
        })
        return manifest


    }



}