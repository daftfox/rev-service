import {
    BoardService,
    DatabaseService,
    EthernetService,
    ProgramService,
    SerialService,
    WebSocketService,
} from '../service';
import { LoggerService } from '../service/logger.service';
import {container, inject} from "tsyringe";
import {ConfigurationService} from "../service/configuration.service";
import {IAppConfiguration} from "../domain/configuration/interface";

/**
 * The MainController is the main controller. 'nuff said.
 * @namespace MainController
 */
export class MainController {
    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @type {string}
     * @static
     * @access private
     */
    private namespace = `main-controller`;

    /**
     * Data boardModel managing instances of {@link Board} or classes that extend it.
     *
     * @type {BoardService}
     * @access private
     */
    private boardModel: BoardService;

    private programModel: ProgramService;

    /**
     * Local instance of the {@link WebSocketService}.
     *
     * @type {WebSocketService}
     * @access private
     */
    private socketService: WebSocketService;

    /**
     * Local instance of the {@link EthernetService}.
     *
     * @type {EthernetService}
     * @access private
     */
    private ethernetService: EthernetService;

    /**
     * Local instance of the {@link SerialService}.
     *
     * @type {SerialService}
     * @access private
     */
    private serialService: SerialService;

    private databaseService: DatabaseService;

    private appConfiguration: IAppConfiguration;

    /**
     * Creates a new instance of MainController and starts required services.
     */
    constructor() {
        this.appConfiguration = container.resolve(ConfigurationService).appConfiguration;
        process.env.debug = this.appConfiguration.debug ? 'true' : '';
    }

    /**
     * Start services that are required to run the application.
     *
     * @access public
     * @returns {void}
     */
    public async startAllServices(): Promise<void> {
        LoggerService.info('Starting rev-service', this.namespace);

        await this.startDatabaseService();

        this.instantiateDataModels();
        await this.synchroniseDataModels();

        this.startWebSocketService();

        if (this.appConfiguration.ethernet) {
            this.startEthernetService();
        }

        if (this.appConfiguration.serial) {
            this.startSerialService();
        }

        process.on('uncaughtException', (error: Error) => { LoggerService.stack(error, this.namespace)});
    }

    private stopServices(): void {
        if (this.ethernetService) {
            this.ethernetService.closeServer();
            this.ethernetService = undefined;
        }

        if (this.serialService) {
            this.serialService.closeServer();
            this.serialService = undefined;
        }

        if (this.socketService) {
            this.socketService.closeServer();
            this.socketService = undefined;
        }
    }

    private startWebSocketService(): void {
        this.socketService = container.resolve(WebSocketService);
        this.socketService.startServer();
    }

    private async startDatabaseService(): Promise<void> {
        this.databaseService = container.resolve(DatabaseService);
        await this.databaseService.synchronise();
        await this.databaseService.insertDefaultRecords();
    }

    private startEthernetService(): void {
        this.ethernetService = container.resolve(EthernetService);
        this.ethernetService.listen();
    }

    private startSerialService(): void {
        this.serialService = container.resolve(SerialService);
        this.serialService.listen();
    }

    private instantiateDataModels(): void {
        this.boardModel = container.resolve(BoardService);
        this.programModel = container.resolve(ProgramService);
    }

    private async synchroniseDataModels(): Promise<void> {
        await this.boardModel.synchronise();
        await this.programModel.synchronise();
    }
}
