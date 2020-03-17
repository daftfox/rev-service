import {
    BoardConnectedEvent,
    BoardDisconnectedEvent,
    BoardErrorEvent,
    BoardReadyEvent,
    BoardUpdatedEvent,
    Event,
    FirmwareUpdatedEvent,
} from '../base';
import { IBoardDataValues } from '../../board/interface';

export const matchBoardConnectedEvent = (event: Event): event is BoardConnectedEvent => {
    return event instanceof BoardConnectedEvent;
};

export const matchBoardDisonnectedEvent = (event: Event): event is BoardDisconnectedEvent => {
    return event instanceof BoardDisconnectedEvent;
};

export const matchBoardUpdatedEvent = (event: Event): event is BoardUpdatedEvent => {
    return event instanceof BoardUpdatedEvent;
};

export const matchBoardErrorEvent = (event: Event): event is BoardErrorEvent => {
    return event instanceof BoardErrorEvent;
};

export const matchBoardReadyEvent = (event: Event): event is BoardReadyEvent => {
    return event instanceof BoardReadyEvent;
};

export const matchFirmwareUpdatedEvent = (event: Event): event is FirmwareUpdatedEvent => {
    return event instanceof FirmwareUpdatedEvent;
};

export const matchAndTransformFirmwareUpdate = (event: Event): [IBoardDataValues] | null => 
    !matchFirmwareUpdatedEvent(event) ? null : [ event.dataValues ]
    ;

