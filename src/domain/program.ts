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