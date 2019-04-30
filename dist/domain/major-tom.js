"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const board_1 = require("./board");
const logger_1 = require("../service/logger");
// https://freematics.com/pages/products/freematics-obd-emulator-mk2/control-command-set/
/**
 * @classdesc
 * MajorTom is an extension of the default Board class, allowing for more specific control over its behaviour. Since we
 * know and design the physical properties and abilities of the 'Major Tom' device, we are able to define methods that
 * allow us to seamlessly integrate with these abilities.
 *
 * @namespace MajorTom
 */
class MajorTom extends board_1.default {
    /**
     * @constructor
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor(firmataBoard, id) {
        super(firmataBoard, id);
        /**
         * Indicator for whether the engine is running or not.
         *
         * @type {boolean}
         * @access private
         */
        this.engineOn = false;
        /**
         * An instance of {@link IPinout} allowing for convenient mapping of device pins.
         * Default pinout mapping for MajorTom (Wemos D1 / ESP8266) is as follows:
         * builtin LED: GPIO2 / D4
         * tx: GPIO5 / D1
         * rx: GPIO4 / D2
         * fan: GPIO16 / D0
         * voltage regulator: GPIO14 / D5
         *
         * @type {IPinout}
         */
        this.pinout = {
            LED: 2,
            RX: 4,
            TX: 5,
            FAN: 16,
            POWER: 14,
        };
        // override namespace and logger set by parent constructor
        this.namespace = `MajorTom_${this.id}`;
        this.log = new logger_1.default(this.namespace);
        Object.assign(this.availableActions, {
            ENGINEON: () => { this.startEngine(); },
            ENGINEOFF: () => { this.stopEngine(); },
            SETSPEED: (speed) => { this.setSpeed(speed); },
            SETRPM: (rpm) => { this.setRPM(rpm); },
            SETDTC: (speed, mode) => { this.setDTC(speed, mode); },
            CLEARDTCS: () => { this.clearAllDTCs(); },
            // DEBUGON: () => { this.enableEmulatorDebugMode( true ) },
            // DEBUGOFF: () => { this.enableEmulatorDebugMode( false ) },
            SETVIN: (vin) => { this.setVIN(vin); }
        });
        // set correct pin modes
        this.firmataBoard.pinMode(this.pinout.FAN, 1 /* OUTPUT */);
        this.firmataBoard.pinMode(this.pinout.POWER, 3 /* PWM */);
        const serialOptions = {
            portId: this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0,
            baud: MajorTom.EMULATOR_BAUD,
            rxPin: this.pinout.RX,
            txPin: this.pinout.TX
        };
        this.firmataBoard.serialConfig(serialOptions);
        this.log.debug("🚀 ‍This is Major Tom to ground control.");
    }
    /**
     * Enable or disable the emulator's ignition.
     *
     * @param {boolean} enable
     * @access private
     * @returns {void}
     */
    enableEmulatorIgnition(enable) {
        this.writeToEmulator(`ATACC${enable ? 1 : 0}`);
    }
    /**
     * Validate the given DTC (Diagnostic Trouble Code) and set to the emulator.
     *
     * @param {string} dtc A DTC code as per this site: https://www.obd-codes.com/trouble_codes/
     * @param {number} mode The mode at which the DTC should be set
     * @access private
     * @returns {void}
     */
    setDTC(dtc, mode) {
        if (!MajorTom.isValidDTC(dtc))
            throw new Error(`${dtc} is not a valid DTC.`);
        let _mode;
        switch (mode) {
            // pending DTC
            case "0x07":
                _mode = `7`;
                break;
            // stored DTC
            case "0x0A":
                _mode = `A`;
                break;
        }
        this.writeToEmulator(`ATSET DTC${_mode}=${dtc}`);
    }
    /**
     * Clear all DTCs from the emulator.
     *
     * @access private
     * @returns {void}
     */
    clearAllDTCs() {
        this.writeToEmulator(`ATCLR DTC`);
    }
    /**
     * Sets the emulated RPM (Revelations Per Minute).
     *
     * @param {number} rpm RPM
     * @access private
     * @returns {void}
     */
    setRPM(rpm) {
        this.writeToEmulator(`ATSET 010C=${rpm}`);
    }
    /**
     * Sets the emulated speed (km/h).
     *
     * @param {number} speed Speed in km/h
     * @access private
     * @returns {void}
     */
    setSpeed(speed) {
        this.writeToEmulator(`ATSET 0113=${speed}`);
    }
    /**
     * Enable or disable the emulator's debug mode.
     *
     * @param {boolean} enable
     * @access private
     * @returns {void}
     */
    enableEmulatorDebugMode(enable) {
        this.writeToEmulator(`ATINF${enable ? 1 : 0}`);
    }
    /**
     * Sets the emulated VIN (Vehicle Identification Number).
     *
     * @param {string} vin
     * @access private
     * @returns {void}
     */
    setVIN(vin) {
        this.writeToEmulator(`ATSET VIN=${vin}`);
    }
    /**
     * Voltage should be between 0 - 600. This is not the actual voltage. Refer to {@link SUPPLY_VOLTAGE}.
     *
     * @param {number} voltage
     * @access private
     * @returns {void}
     */
    setSupplyVoltage(voltage) {
        if (voltage > 600)
            throw new Error(`Better not play with fire. Do not set supply voltage higher than 600 (for now).`);
        this.firmataBoard.analogWrite(this.pinout.POWER, voltage);
    }
    /**
     * Turn the engine on.
     * This will turn the emulator engine ignition on, dip the power supply and run the (unbalanced) fan
     * The engine will remain running until stopEngine() is called.
     *
     * @access private
     * @returns {void}
     */
    startEngine() {
        if (this.engineOn)
            throw new Error(`Engine has already been started.`);
        this.currentJob = "ENGINEON";
        this.engineOn = true;
        this.enableEmulatorIgnition(true);
        this.dipPowerSupply(MajorTom.DEFAULT_POWER_DIP_DURATION);
        this.shake();
    }
    /**
     * Turn the engine off.
     *
     * @access private
     * @returns {void}
     */
    stopEngine() {
        this.resetCurrentJob();
        this.engineOn = false;
        this.enableEmulatorIgnition(false);
        this.clearInterval(this.shakeInterval);
    }
    /**
     * Enable or disable the emulator's character echo feature
     *
     * @access private
     * @param {boolean} enable
     * @returns {void}
     */
    enableEmulatorCharacterEcho(enable) {
        this.writeToEmulator(`ATE${enable ? 1 : 0}`);
    }
    /**
     * Initialize the emulator, whatever that means.
     *
     * @access private
     * @returns {void}
     */
    initializeEmulator() {
        this.writeToEmulator(`ATZ`);
    }
    /**
     * Reset the emulator.
     *
     * @access private
     * @returns {void}
     */
    resetEmulator() {
        this.writeToEmulator(`ATR`);
    }
    /**
     * Writes a character byte-array to MajorTom's physical serial UART interface.
     * This interface is directly connected to the emulator to allow control using AT-commands.
     *
     * @access private
     * @param {string} payload AT-method to send
     * @returns {void}
     */
    writeToEmulator(payload) {
        this.serialWrite(this.firmataBoard.SERIAL_PORT_IDs.SW_SERIAL0, payload);
    }
    /**
     * Turns on the (unbalanced) fan for 10 seconds, after which the fan remains turned off for 1 second.
     * It will do so indefinitely or until the stopEngine() method is called.
     * NOTE: This method should not be used anywhere besides the startEngine() method.
     *
     * @access private
     * @returns {void}
     */
    shake() {
        this.shakeInterval = setInterval(() => {
            this.enableFan(true);
            setTimeout(() => {
                this.enableFan(false);
            }, MajorTom.DEFAULT_SHAKE_DURATION);
        }, MajorTom.DEFAULT_SHAKE_DURATION + 1000);
        this.intervals.push(this.shakeInterval);
    }
    /**
     * Enable or disable the fan.
     *
     * @param {boolean} enable
     * @access private
     * @returns {void}
     */
    enableFan(enable) {
        this.firmataBoard.digitalWrite(this.pinout.FAN, enable ? 1 /* HIGH */ : 0 /* LOW */);
    }
    /**
     * Sharply dip the power supply to ~11.6v and ramp the voltage up to ~12.5v (linear)
     * NOTE: latency should be tested properly when connecting using EtherPort instance.
     *
     * @param {number} dipDuration - Dip duration in ms with a minimum of 1000. Defaults to 1500
     * @access private
     * @returns {void}
     */
    dipPowerSupply(dipDuration) {
        let ramped = 0;
        const interval = Math.ceil((dipDuration >= 1000 ? dipDuration : 1500) / ((MajorTom.SUPPLY_VOLTAGE.GOOD - MajorTom.SUPPLY_VOLTAGE.LOW) / 10));
        // dip it!
        this.firmataBoard.analogWrite(this.pinout.POWER, MajorTom.SUPPLY_VOLTAGE.LOW);
        // ramp it!
        const rampUp = setInterval(() => {
            ramped += 10;
            this.setSupplyVoltage(MajorTom.SUPPLY_VOLTAGE.LOW + ramped);
            if (ramped + MajorTom.SUPPLY_VOLTAGE.LOW >= MajorTom.SUPPLY_VOLTAGE.GOOD)
                this.clearInterval(rampUp);
        }, interval);
        this.intervals.push(rampUp);
    }
    /**
     * Validates a DTC.
     *
     * @access private
     * @static
     * @param {string} dtc - DTC to validate
     * @returns {boolean}
     */
    static isValidDTC(dtc) {
        return /^P[0-3][A-Z0-9][A-Z0-9][A-Z0-9]$/.exec(dtc) !== null;
    }
}
/**
 * Analog values that represent certain voltage levels the device is able to supply.
 * HIGH     ~13.5v
 * GOOD     ~12.6v
 * LOW      ~11.5v
 * CRITICAL ~10.6v
 *
 * @type {Object}
 * @access private
 * @static
 * @namespace SUPPLY_VOLTAGE
 */
MajorTom.SUPPLY_VOLTAGE = {
    HIGH: 550,
    GOOD: 410,
    LOW: 240,
    CRITICAL: 0
};
/**
 * The baud rate at which the Freematics OBD II emulator communicates over UART.
 * This is 38400 baud by default
 *
 * @static
 * @type {number}
 * @access private
 */
MajorTom.EMULATOR_BAUD = 38400;
/**
 * The default duration of the power dip that's executed on engine ignition.
 *
 * @static
 * @type {number}
 * @access private
 */
MajorTom.DEFAULT_POWER_DIP_DURATION = 1500;
/**
 * The default duration of a shake interval. Eg. the length of time the fan spins before taking a little break.
 *
 * @static
 * @type {number}
 * @access private
 */
MajorTom.DEFAULT_SHAKE_DURATION = 10000; // Default shake interval duration
exports.default = MajorTom;
//# sourceMappingURL=major-tom.js.map