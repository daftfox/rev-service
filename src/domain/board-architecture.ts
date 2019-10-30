import IPinMap from "./interface/pin-map";

export default class BoardArchitecture {
    readonly name: string;
    readonly pinMap: IPinMap;

    constructor( name: string, pinMap: IPinMap ) {
        this.name = name;
        this.pinMap = pinMap;
    }
}