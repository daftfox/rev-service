import { Board, SUPPORTED_ARCHITECTURES } from '../base';
import { BuildOptions } from 'sequelize';
import * as FirmataBoard from 'firmata';
import { LoggerService } from '../../../service/logger.service';
import { injectable } from 'tsyringe';

@injectable()
export class LedController extends Board {
    /**
     * The baud rate at which the LED controller shield communicates over UART.
     * This is 9600 baud by default
     *
     * @static
     * @type {number}
     * @access private
     */
    private static SERIAL_BAUD_RATE = 9600;

    private static PAYLOAD_HEADER = '[';
    private static PAYLOAD_FOOTER = ']';

    private static LED_COMMANDS = {
        SETCOLOR: 'C',
        PULSECOLOR: 'P',
        SETBRIGHTNESS: 'B',
        RAINBOW: 'R',
        RETRO: '8', // not implemented
        KITT: 'K',
    };

    public architecture = SUPPORTED_ARCHITECTURES.ESP_8266;

    constructor(model?: any, buildOptions?: BuildOptions, firmataBoard?: FirmataBoard) {
        super(model, buildOptions, firmataBoard);

        // override namespace and logger set by parent constructor
        this.namespace = `led-controller-${this.id}`;

        this.availableActions = {
            RAINBOW: {
                requiresParams: false,
                method: () => {
                    this.rainbow();
                },
            },
            KITT: {
                requiresParams: true,
                method: (hue: string, saturation: string, value: string) => {
                    this.kitt(parseInt(hue, 10), parseInt(saturation, 10), parseInt(value, 10));
                },
            },
            PULSECOLOR: {
                requiresParams: true,
                method: (hue: string, saturation: string) => {
                    this.pulseColor(parseInt(hue, 10), parseInt(saturation, 10));
                },
            },
            SETCOLOR: {
                requiresParams: true,
                method: (hue: string, saturation: string, value: string) => {
                    this.setColor(parseInt(hue, 10), parseInt(saturation, 10), parseInt(value, 10));
                },
            },
        };

        if (firmataBoard) {
            const serialOptions = {
                portId: this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
                baud: LedController.SERIAL_BAUD_RATE,
                rxPin: this.architecture.pinMap.RX,
                txPin: this.architecture.pinMap.TX,
            };

            this.firmataBoard.serialConfig(serialOptions);
        }
    }

    private static buildPayload(command: string, ...parameters: any[]): any[] {
        return [LedController.PAYLOAD_HEADER, command, ...parameters, LedController.PAYLOAD_FOOTER];
    }

    private static parametersAreValid(args: IArguments): boolean {
        const parameters = Array.from(args).map(Board.is8BitNumber);

        return !parameters.includes(false);
    }

    private pulseColor(hue: number, saturation: number): void {
        if (!LedController.parametersAreValid(arguments)) {
            throw new Error(`Parameters should be 8 bit numbers (0-255).`);
        }

        this.serialWriteBytes(
            this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
            LedController.buildPayload(LedController.LED_COMMANDS.PULSECOLOR, hue, saturation),
        );
    }

    private setColor(hue: number, saturation: number, value: number): void {
        if (!LedController.parametersAreValid(arguments)) {
            throw new Error(`Parameters should be 8 bit numbers (0-255).`);
        }

        this.serialWriteBytes(
            this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
            LedController.buildPayload(LedController.LED_COMMANDS.SETCOLOR, hue, saturation, value),
        );
    }

    private rainbow(): void {
        this.serialWriteBytes(
            this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
            LedController.buildPayload(LedController.LED_COMMANDS.RAINBOW),
        );
    }

    private kitt(hue: number, saturation: number, value: number): void {
        if (!LedController.parametersAreValid(arguments)) {
            throw new Error(`Parameters should be 8 bit numbers (0-255).`);
        }

        this.serialWriteBytes(
            this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
            LedController.buildPayload(LedController.LED_COMMANDS.KITT, hue, saturation, value),
        );
    }
}
