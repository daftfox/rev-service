import { BoardService, DatabaseService, EthernetService, SerialService, WebSocketService } from '../service';
import { LoggerService } from '../service/logger.service';
import { container } from 'tsyringe';
import { ConfigurationService } from '../service/configuration.service';
import { IAppConfiguration } from '../domain/configuration/interface';

/**
 * The MainController is the main controller. 'nuff said.
 * @namespace MainController
 */
export class MainController {
    /**
     * Creates a new instance of MainController and starts required services.
     */
    constructor() {
        this.appConfiguration = container.resolve(ConfigurationService).appConfiguration;
        process.env.debug = this.appConfiguration.debug ? 'true' : '';

        process.on('uncaughtException', (error: Error) => {
            LoggerService.stack(error, this.namespace);
        });

        LoggerService.info('Starting rev-service', this.namespace);
    }
    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @type {string}
     * @static
     * @access private
     */
    private namespace = `main-controller`;
    private appConfiguration: IAppConfiguration;

    public static stopServices(): void {
        container.resolve(EthernetService).closeServer();
        container.resolve(SerialService).closeServer();
        container.resolve(WebSocketService).closeServer();
        DatabaseService.closeConnection();
    }

    private static startWebSocketService(): void {
        container.resolve(WebSocketService).listen();
    }

    private static async startDatabaseService(): Promise<void> {
        const service = container.resolve(DatabaseService);
        await service.synchronise();
        await service.insertDefaultRecords();
    }

    private static startEthernetService(): void {
        container.resolve(EthernetService).listen();
    }

    private static startSerialService(): void {
        container.resolve(SerialService).listen();
    }

    private static async synchroniseDataModels(): Promise<void> {
        await container.resolve(BoardService).updateCache();
    }

    /**
     * Start services that are required to run the application.
     *
     * @access public
     * @returns {void}
     */
    public async startAllServices(): Promise<void> {
        await MainController.startDatabaseService();
        await MainController.synchroniseDataModels();

        MainController.startWebSocketService();

        if (this.appConfiguration.ethernet) {
            MainController.startEthernetService();
        }

        if (this.appConfiguration.serial) {
            MainController.startSerialService();
        }
    }
}
