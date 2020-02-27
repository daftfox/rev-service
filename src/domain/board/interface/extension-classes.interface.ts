import { Board } from '../base';
import {BuildOptions} from "sequelize";

export interface IExtensionClasses {
    [key: string]: new (model?: any, buildOptions?: BuildOptions) => Board;
}
