import {Column, DataType, Model, Table} from "sequelize-typescript";
import ICommand from "./interface/command";

@Table({
    timestamps: true
})
class Program extends Model<Program> {

    @Column( DataType.STRING )
    public name: string;

    @Column( DataType.STRING )
    public deviceType: string;

    @Column( DataType.TEXT )
    private commands: string;

    public getCommands(): ICommand[] {
        return JSON.parse( this.commands );
    }

    public setCommands( commands: ICommand[] ): void {
        this.commands = JSON.stringify( commands );
    }
}

export default Program;

const blinkProgram = {
    name: 'Blink example',
    deviceType: 'all',
    commands: [
        {
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },{
            action: 'TOGGLELED',
            duration: 1000,
        },
    ],
};

const sosProgram = {
    name: 'SOS',
    deviceType: 'all',
    commands: [
        {
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 1000,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 500,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 1000,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 1000,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 1000,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 1000,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 1000,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 500,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 1000,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "0" ],
            duration: 300,
        },{
            action: 'SETPINVALUE',
            parameters: [ "2", "1" ],
            duration: 300,
        },
    ],
};

export const defaultPrograms = {
    BLINK_PROGRAM: blinkProgram,
    SOS_PROGRAM: sosProgram,
};