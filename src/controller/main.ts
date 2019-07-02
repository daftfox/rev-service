import Config from '../config/config';
// import SerialService from '../service/serial-service';
import EthernetService from '../service/ethernet-service';
import WebSocketService from '../service/web-socket-service';
import Logger from '../service/logger';
import Boards from '../model/boards';
import CommandUnavailable from '../error/command-unavailable';
import NoAvailablePortError from '../error/no-available-port-error';
import NotFoundError from '../error/not-found-error';
import GenericBoardError from '../error/generic-board-error';
import IFlags from '../interface/flags';
import DatabaseService from "../service/database-service";
import Programs from "../model/programs";
import SerialService from "../service/serial-service";

// only required during dev
require('longjohn');

/**
 * The MainController is the main controller. 'nuff said.
 * @namespace MainController
 */
class MainController {
    /**
     * Namespace used by the local instance of {@link Logger}
     *
     * @type {string}
     * @static
     * @access private
     */
    private static namespace = `main`;

    /**
     * Local instance of the {@link Logger} class.
     *
     * @access private
     * @type {Logger}
     */
    private log = new Logger( MainController.namespace );

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

    /**
     * Creates a new instance of MainController and starts required services.
     *
     * @constructor
     */
    constructor() {
        this.options = Config.parseOptions( process.argv );

        this.log.info( 'Starting rev-service' );

        process.env.debug = this.options.debug ? 'true' : '';
        this.startServices();
    }

    /**
     * Start services that are required to run the application.
     *
     * @access private
     */
    private startServices(): void {
        new DatabaseService().synchronise()
            .then( () => {
                this.boardModel = new Boards();
                this.programModel = new Programs();

                this.socketService = new WebSocketService(
                    this.options.port,
                    this.boardModel,
                    this.programModel
                );

                if ( this.options.ethernet ) {
                    this.ethernetService = new EthernetService( this.boardModel, this.options.ethPort );
                }
                if ( this.options.serial ) {
                    this.serialService = new SerialService( this.boardModel );
                }
            } );

        process.on('uncaughtException', this.handleError.bind( this ) );
    }

    /**
     * Handle errors.
     *
     * @access private
     * @param {Error} error
     */
    private handleError( error: Error ): void {
        switch( error.constructor ) {
            case CommandUnavailable:
            case NoAvailablePortError:
            case NotFoundError:
                this.log.warn( error.message );
                break;
            case Error:
                this.log.stack( error );
                break;
            case GenericBoardError:
            default:
                this.log.stack( error );
        }
    }
}

export default MainController;
