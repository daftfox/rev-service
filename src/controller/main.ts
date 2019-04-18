import Config, {Flags} from '../config/config';
import SerialService from "../service/serial-service";
import EthernetService from "../service/ethernet-service";
import WebSocketService from "../service/web-socket-service";
import Logger from "../service/logger";
import Boards from "../model/boards";
import CommandError from "../error/command-error";
import NoAvailablePortError from "../error/no-available-port-error";
import NotFoundError from "../error/not-found-error";
import GenericBoardError from "../error/generic-board-error";
require('longjohn');

/**
 * Main controller
 * @classdesc // todo
 * @namespace MainController
 */
class MainController {
    /**
     * @type {string}
     * @static
     * @access private
     */
    private static namespace = `main`;

    /**
     * @access private
     * @type {Logger}
     */
    private log = new Logger( MainController.namespace );

    /**
     * @type {Flags}
     * @access private
     */
    private options: Flags;

    /**
     * @type {Boards}
     * @access private
     */
    private model: Boards;

    /**
     * @type {WebSocketService}
     * @access private
     */
    private socketService: WebSocketService;

    /**
     * @type {EthernetService}
     * @access private
     */
    private ethernetService: EthernetService;

    /**
     * @type {SerialService}
     * @access private
     */
    private serialService: SerialService;

    /**
     * Creates a new instance of MainController and starts required services
     * @constructor
     */
    constructor() {
        this.options = Config.parseOptions( process.argv );

        this.log.info( 'Starting rev-service' );

        process.env.debug = this.options.debug ? 'true' : '';
        this.startServices();
    }

    /**
     * Start services that are required to start.
     * @access private
     */
    private startServices(): void {
        this.model = new Boards();

        this.socketService = new WebSocketService(
            this.options.port,
            this.model
        );

        if ( this.options.ethernet ) {
            this.ethernetService = new EthernetService( this.model,
                {
                    listenPort: this.options.ethPort,
                    startPort: this.options.startPort,
                    endPort: this.options.endPort,
                } );
        }

        if ( this.options.serial ) {
            this.serialService   = new SerialService( this.model );
        }

        process.on('uncaughtException', this.handleError );
    }

    /**
     * Handle errors.
     * @access private
     * @param {Error} error
     */
    private handleError( error: Error ): void {
        switch( error.constructor ) {
            case CommandError:
            case NoAvailablePortError:
            case NotFoundError:
                this.log.warn( error.message );
                break;
            case Error:
                this.log.stack( error );
                break;
            case GenericBoardError:
            default:
                this.log.error( error );
        }
    }
}

export default MainController;