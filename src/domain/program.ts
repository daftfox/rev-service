import { Column, DataType, Model, Table } from 'sequelize-typescript';
import ICommand from './interface/command';
import IProgram from './interface/program';

@Table({
    timestamps: true,
})
class Program extends Model<Program> implements IProgram {
    @Column({ type: DataType.STRING, primaryKey: true })
    public id: string;

    @Column(DataType.STRING)
    public name: string;

    @Column(DataType.STRING)
    public deviceType: string;

    @Column(DataType.JSON)
    public commands: ICommand[];
}

export default Program;
