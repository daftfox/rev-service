import { Column, DataType, Model, Table } from 'sequelize-typescript';
import ICommand from './interface/command';

@Table({
    timestamps: true,
})
class Program extends Model<Program> {
    @Column(DataType.STRING)
    public name: string;

    @Column(DataType.STRING)
    public deviceType: string;

    @Column(DataType.JSON)
    public commands: ICommand[];
}

export default Program;
