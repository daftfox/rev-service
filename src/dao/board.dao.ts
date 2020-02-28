import { Board } from '../domain/board/base/board.model';
import { singleton } from 'tsyringe';
import {
    AVAILABLE_EXTENSIONS_CLASSES,
    AVAILABLE_EXTENSIONS_KEYS,
    isAvailableExtension,
} from '../domain/board/extension';
import { BoardTypeNotFoundError } from '../domain/error';
import { IBoardDataValues } from '../domain/board/interface/board-data-values.interface';
import { BoardDuplicateError } from '../domain/error/board-duplicate.error';
import { LoggerService } from '../service/logger.service';

@singleton()
export class BoardDAO {
    private static namespace = 'board-dao';

    public static async exists(boardId: string): Promise<boolean> {
        return (await Board.findByPk(boardId)) !== undefined;
    }

    public static async create(dataValues: IBoardDataValues): Promise<Board> {
        LoggerService.debug(
            `Creating new board with id ${LoggerService.highlight(dataValues.id, 'blue', true)}.`,
            BoardDAO.namespace,
        );

        if (!(await BoardDAO.exists(dataValues.id))) {
            return BoardDAO.instantiateNewBoard(dataValues);
        } else {
            throw new BoardDuplicateError(`Board with id ${dataValues.id} already exists.`);
        }
    }

    public static persist(board: Board): Promise<Board> {
        LoggerService.debug(
            `Persisting board with id ${LoggerService.highlight(board.id, 'blue', true)} to the database.`,
            BoardDAO.namespace,
        );

        return board.save();
    }

    public static async destroy(board: Board): Promise<void> {
        LoggerService.debug(
            `Deleting board with id ${LoggerService.highlight(board.id, 'blue', true)} from the database.`,
            this.namespace,
        );
        await board.destroy();
    }

    public static async getAll(): Promise<Board[]> {
        return Board.findAll().then((boards: Board[]) =>
            boards.map((board: Board) => BoardDAO.createBoardInstance(board.getDataValues())),
        );
    }

    private static instantiateNewBoard(dataValues: IBoardDataValues): Board {
        return BoardDAO.createBoardInstance(dataValues);
    }

    public static createBoardInstance(dataValues: IBoardDataValues): Board {
        if (isAvailableExtension(dataValues.type)) {
            return new AVAILABLE_EXTENSIONS_CLASSES[dataValues.type](dataValues);
        } else {
            throw new BoardTypeNotFoundError(
                `Type '${dataValues.type}' is not a valid type. Valid types are${Object.values(
                    AVAILABLE_EXTENSIONS_KEYS,
                ).map(availableExtension => ` '${availableExtension}'`)}`,
            );
        }
    }
}
