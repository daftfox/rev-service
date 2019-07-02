import Board, { PIN_MAPPING, PINOUT } from "./board";
import { BuildOptions } from "sequelize";
import * as FirmataBoard from 'firmata';
import Logger from "../service/logger";
import IPinMapping from "../interface/pin-mapping";

class LedController extends Board {

    /**
     * The baud rate at which the LED controller shield communicates over UART.
     * This is 9600 baud by default
     *
     * @static
     * @type {number}
     * @access private
     */
    private static SERIAL_BAUD_RATE = 9600;

    /**
     * An instance of {@link IPinMapping} allowing for convenient mapping of device pinMapping.
     * Default pinMapping mapping for LED Controller (Wemos D1 / ESP8266) is as follows:
     * builtin LED: GPIO2 / D4
     * tx: GPIO5 / D1
     * rx: GPIO4 / D2
     *
     * @type {IPinMapping}
     */
    public pinout: PINOUT = PINOUT.ESP_8266;
    public pinMapping: IPinMapping = PIN_MAPPING.ESP_8266;

    constructor( model?: any, buildOptions?: BuildOptions, firmataBoard?: FirmataBoard, serialConnection: boolean = false, id?: string ) {
        super( model, buildOptions, firmataBoard, serialConnection, id );

        // override namespace and logger set by parent constructor
        this.namespace = `LedController_${ this.id }`;
        this.log = new Logger( this.namespace );

        Object.assign( this.availableActions, {
            SETCOLOR: { requiresParams: true, method: ( color: string ) => { this.setColor( color ) } },
            PULSECOLORRGB: { requiresParams: true, method: ( red: string, green: string, blue: string ) => { this.pulseColorRGB( red, green, blue ) } },
            SETCOLORRGB: { requiresParams: true, method: ( red: string, green: string, blue: string ) => { this.setColorRGB( red, green, blue ) } },
        } );

        if ( firmataBoard ) {

            const serialOptions = {
                portId: this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
                baud: LedController.SERIAL_BAUD_RATE,
                rxPin: this.pinMapping.RX,
                txPin: this.pinMapping.TX
            };

            this.firmataBoard.serialConfig( serialOptions );
        }
    }

    private pulseColorRGB( red: string, green: string, blue: string ): void {
        this.serialWrite( this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0, `PULSECOLORRGB:${ red },${ green },${ blue };` );
    }

    private setColorRGB( red: string, green: string, blue: string ): void {
        this.serialWrite( this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0, `SETCOLORRGB:${ red },${ green },${ blue };` );
    }

    private setColor( color: string ): void {
        switch ( color ) {
            case COLOR.RED:
                this.setColorRGB( '255', '0', '0' );
                break;
            case COLOR.ORANGE:
                this.setColorRGB( '255', '161', '0' );
                break;
            case COLOR.YELLOW:
                this.setColorRGB( '255', '255', '0' );
                break;
            case COLOR.LIME:
                this.setColorRGB( '178', '255', '0' );
                break;
            case COLOR.GREEN:
                this.setColorRGB( '59', '255', '0' );
                break;
            case COLOR.TURQUOISE:
                this.setColorRGB( '0', '255', '208' );
                break;
            case COLOR.BLUE:
                this.setColorRGB( '0', '0', '255' );
                break;
            case COLOR.VIOLET:
                this.setColorRGB( '97', '0', '255' );
                break;
            case COLOR.PURPLE:
                this.setColorRGB( '135', '0', '255' );
                break;
            case COLOR.PINK:
                this.setColorRGB( '255', '0', '255' );
                break;
            case COLOR.WHITE:
                this.setColorRGB( '255', '255', '255' );
                break;
            default:
                throw new Error( `${ color } is not a supported color, use SETCOLORRGB instead.` );
        }
    }
}

export default LedController;

enum COLOR {
    RED = 'red',
    ORANGE = 'orange',
    YELLOW = 'yellow',
    LIME = 'lime',
    GREEN = 'green',
    TURQUOISE = 'turquoise',
    BLUE = 'blue',
    VIOLET = 'violet',
    PURPLE = 'purple',
    PINK = 'pink',
    WHITE = 'white',
}
