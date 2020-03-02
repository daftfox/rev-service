import { Event } from './event.model';
import { IBoardDataValues } from '../../board';

export class FirmwareUpdatedEvent extends Event {
    dataValues: IBoardDataValues;

    constructor(dataValues: IBoardDataValues) {
        super();

        this.dataValues = dataValues;
    }
}
