import Config from '../config/config';
import EthernetService from '../service/ethernet-service';
import WebSocketService from '../service/web-socket-service';
import LoggerService from '../service/logger-service';
import Boards from '../model/boards';
import IFlags from '../domain/interface/flags';
import DatabaseService from "../service/database-service";
import Programs from "../model/programs";
import SerialService from "../service/serial-service";
import IDatabaseOptions from "../domain/interface/database-options";
import IWebSocketOptions from "../domain/interface/web-socket-options";

// only required during dev
require('longjohn');

/**
 * The MainController is the main controller. 'nuff said.
 * @namespace MainController
 */
class MainController {
    /**
     * Namespace used by the local instance of {@link LoggerService}
     *
     * @type {string}
     * @static
     * @access private
     */
    private static namespace = `main`;

    /**
     * Local instance of the {@link LoggerService} class.
     *
     * @access private
     * @type {LoggerService}
     */
    private static log = new LoggerService( MainController.namespace );

    /**
     * Object containing the parsed process arguments.
     *
     * @type {IFlags}
     * @access private
     */
    private options: IFlags;

    /**
     * Data boardModel managing instances of {@link Board} or classes that extend it.
     *
     * @type {Boards}
     * @access private
     */
    private boardModel: Boards;


    private programModel: Programs;

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

    /**
     * Creates a new instance of MainController and starts required services.
     */
    constructor() {
        this.options = Config.parseOptions( process.argv );
        process.env.debug = this.options.debug ? 'true' : '';
    }

    /**
     * Start services that are required to run the application.
     *
     * @access public
     * @returns {void}
     */
    public async startAllServices(): Promise<void> {
        MainController.log.info( 'Starting rev-service' );

        await this.startDatabaseService( {
            username: this.options.dbUsername,
            password: this.options.dbPassword,
            host: this.options.dbHost,
            port: this.options.dbPort,
            path: this.options.dbPath,
            dialect: this.options.dbDialect,
            schema: this.options.dbSchema,
            debug: this.options.debug
        } );

        this.instantiateDataModels();
        await this.synchroniseDataModels();

        this.startWebSocketService( {
            port: this.options.port,
            boardModel: this.boardModel,
            programModel: this.programModel
        } );

        if ( this.options.ethernet ) {
            this.startEthernetService( this.boardModel, this.options.ethernetPort );
        }

        if ( this.options.serial ) {
            this.startSerialService( this.boardModel );
        }

        process.on('uncaughtException', MainController.log.stack );
    }

    public stopService(): void {
        this.stopServices();
    }

    private stopServices(): void {
        if ( this.ethernetService ) {
            this.ethernetService.closeServer();
            this.ethernetService = undefined;
        }

        if ( this.serialService ) {
            this.serialService.closeServer();
            this.serialService = undefined;
        }
    }

    private startWebSocketService( options: IWebSocketOptions ): void {
        this.socketService = new WebSocketService( options );
    }

    private async startDatabaseService( options: IDatabaseOptions ): Promise<void> {
        this.databaseService =  new DatabaseService( options );
        return await this.databaseService.synchronise();
    }

    private startEthernetService( boardModel: Boards, port: number ): void {
        this.ethernetService = new EthernetService( boardModel, port );
    }

    private startSerialService( boardModel: Boards ): void {
        this.serialService = new SerialService( boardModel );
    }

    private instantiateDataModels(): void {
        this.boardModel = new Boards();
        this.programModel = new Programs();
    }

    private async synchroniseDataModels(): Promise<void> {
        return this.boardModel.synchronise();
        // todo: synch programs
    }
}

export default MainController;
