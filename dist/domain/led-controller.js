"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const board_1 = require("./board");
const logger_1 = require("../service/logger");
class LedController extends board_1.default {
    constructor(model, buildOptions, firmataBoard, serialConnection = false, id) {
        super(model, buildOptions, firmataBoard, serialConnection, id);
        /**
         * An instance of {@link IPinMapping} allowing for convenient mapping of device pinMapping.
         * Default pinMapping mapping for LED Controller (Wemos D1 / ESP8266) is as follows:
         * builtin LED: GPIO2 / D4
         * tx: GPIO5 / D1
         * rx: GPIO4 / D2
         *
         * @type {IPinMapping}
         */
        this.pinout = board_1.PINOUT.ESP_8266;
        this.pinMapping = board_1.PIN_MAPPING.ESP_8266;
        // override namespace and logger set by parent constructor
        this.namespace = `LedController_${this.id}`;
        this.log = new logger_1.default(this.namespace);
        Object.assign(this.availableActions, {
            SETCOLOR: { requiresParams: true, method: (color) => { this.setColor(color); } },
            PULSECOLORRGB: { requiresParams: true, method: (red, green, blue) => { this.pulseColorRGB(red, green, blue); } },
            SETCOLORRGB: { requiresParams: true, method: (red, green, blue) => { this.setColorRGB(red, green, blue); } },
        });
        if (firmataBoard) {
            const serialOptions = {
                portId: this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
                baud: LedController.SERIAL_BAUD_RATE,
                rxPin: this.pinMapping.RX,
                txPin: this.pinMapping.TX
            };
            this.firmataBoard.serialConfig(serialOptions);
        }
    }
    pulseColorRGB(red, green, blue) {
        this.serialWrite(this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0, `PULSECOLORRGB:${red},${green},${blue};`);
    }
    setColorRGB(red, green, blue) {
        this.serialWrite(this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0, `SETCOLORRGB:${red},${green},${blue};`);
    }
    setColor(color) {
        switch (color) {
            case COLOR.RED:
                this.setColorRGB('255', '0', '0');
                break;
            case COLOR.ORANGE:
                this.setColorRGB('255', '161', '0');
                break;
            case COLOR.YELLOW:
                this.setColorRGB('255', '255', '0');
                break;
            case COLOR.LIME:
                this.setColorRGB('178', '255', '0');
                break;
            case COLOR.GREEN:
                this.setColorRGB('59', '255', '0');
                break;
            case COLOR.TURQUOISE:
                this.setColorRGB('0', '255', '208');
                break;
            case COLOR.BLUE:
                this.setColorRGB('0', '0', '255');
                break;
            case COLOR.VIOLET:
                this.setColorRGB('97', '0', '255');
                break;
            case COLOR.PURPLE:
                this.setColorRGB('135', '0', '255');
                break;
            case COLOR.PINK:
                this.setColorRGB('255', '0', '255');
                break;
            case COLOR.WHITE:
                this.setColorRGB('255', '255', '255');
                break;
            default:
                throw new Error(`${color} is not a supported color, use SETCOLORRGB instead.`);
        }
    }
}
/**
 * The baud rate at which the LED controller shield communicates over UART.
 * This is 9600 baud by default
 *
 * @static
 * @type {number}
 * @access private
 */
LedController.SERIAL_BAUD_RATE = 9600;
exports.default = LedController;
var COLOR;
(function (COLOR) {
    COLOR["RED"] = "red";
    COLOR["ORANGE"] = "orange";
    COLOR["YELLOW"] = "yellow";
    COLOR["LIME"] = "lime";
    COLOR["GREEN"] = "green";
    COLOR["TURQUOISE"] = "turquoise";
    COLOR["BLUE"] = "blue";
    COLOR["VIOLET"] = "violet";
    COLOR["PURPLE"] = "purple";
    COLOR["PINK"] = "pink";
    COLOR["WHITE"] = "white";
})(COLOR || (COLOR = {}));
//# sourceMappingURL=led-controller.js.map