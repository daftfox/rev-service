import {BoardArchitecture} from "../base";

export interface IBoardDataValues {
    id: string;
    type: string;
    name?: string;
    lastUpdateReceived?: string;
    architecture?: BoardArchitecture;
}