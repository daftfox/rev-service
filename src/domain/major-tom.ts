import Board from "./board";
import * as FirmataBoard from 'firmata';
import StringConverter from "../service/string-converter";
import Logger from "../service/logger";

// https://freematics.com/pages/products/freematics-obd-emulator-mk2/control-command-set/

/**
 * @classdesc
 * MajorTom is an extension of the default IBoard class, allowing for more specific control over its behaviour. Since we
 * know and design the physical properties and abilities of the 'Major Tom' device, we are able to define methods that
 * allow us to seamlessly integrate with these abilities.
 *
 * @namespace MajorTom
 */
class MajorTom extends Board {

    /**
     * Analog values that represent certain voltage levels the device is able to supply.
     * HIGH     ~13.5v
     * GOOD     ~12.6v
     * LOW      ~11.5v
     * CRITICAL ~10.6v
     * @type {Object}
     * @access private
     * @namespace SUPPLY_VOLTAGE
     */
    private static SUPPLY_VOLTAGE = {
        HIGH: 550,
        GOOD: 410,
        LOW: 240,
        CRITICAL: 0
    };

    /**
     * The pin connected to the builtin LED
     * ESP8266:         GPIO2
     * Wemos D1 Mini:   D4
     * @type {number}
     * @access private
     */
    private static LED_PIN = 2;

    /**
     * The pin connected to the unbalanced fan
     * ESP8266:         GPIO16
     * Wemos D1 Mini:   D0
     * @type {number}
     * @access private
     */
    private static FAN_PIN = 16;

    /**
     * The pin connected to the variable power supply
     * ESP8266:         GPIO14
     * Wemos D1 Mini:   D5
     * @type {number}
     * @access private
     */
    private static POWER_PIN = 14;

    /**
     * Microcontroller pin designated for receiving serial communication
     * ESP8266:         GPIO13
     * Wemos D1 Mini:   D7
     * @type {number}
     * @access private
     */
    private static RX_PIN = 13;

    /**
     * The pin designated for transmitting serial communication
     * ESP8266:         GPIO15
     * Wemos D1 Mini:   D8
     * @type {number}
     * @access private
     */
    private static TX_PIN = 15;

    /**
     * The baud rate at which the Freematics OBD II emulator communicates over UART
     * This is 38400 baud by default
     * @type {number}
     * @access private
     */
    private static EMULATOR_BAUD = 38400;

    /**
     * The default duration of the power dip that's executed on engine ignition.
     * @type {number}
     * @access private
     */
    private static DEFAULT_POWER_DIP_DURATION = 1500;

    /**
     * The default duration of a shake interval. Eg. the length of time the fan spins before taking a little break.
     * @type {number}
     * @access private
     */
    private static DEFAULT_SHAKE_DURATION = 10000; // Default shake interval duration

    /**
     * The ID of the interval that's executed when we turn on the engine.
     * @access private
     */
    private shakeInterval;

    /**
     * The ID of the interval that's executed when we blink the builtin LED.
     * @access private
     */
    private blinkInterval;

    /**
     * Indicator for whether the engine is running or not.
     * @type {boolean}
     * @access private
     */
    private engineOn = false;

    /**
     * The availableCommands property is used to map available methods to string representations so we can easily
     * validate and call them from elsewhere. The mapping should be obvious.
     * @type {Object}
     * @access protected
     */
    public availableCommands = {
        BLINKON: () => { this.enableBlinkLed( true ); this.currentJob = "BLINKON" },
        BLINKOFF: () => { this.enableBlinkLed( false ); this.resetCurrentJob() },
        TOGGLELED: () => { this.toggleLED() },
        ENGINEON: () => { this.startEngine(); this.currentJob = "ENGINEON" },
        ENGINEOFF: () => { this.stopEngine(); this.resetCurrentJob() },
        SETSPEED: ( speed: string ) => { this.setSpeed( speed ) },
        SETRPM: ( rpm: string ) => { this.setRPM( rpm ) },
        SETDTC: ( speed: string, mode: string ) => { this.setDTC( speed, mode ) },
        CLEARDTCS: () => { this.clearAllDTCs() },
        // DEBUGON: () => { this.enableEmulatorDebugMode( true ) },
        // DEBUGOFF: () => { this.enableEmulatorDebugMode( false ) },
        SETVIN: ( vin: string ) => { this.setVIN( vin ) }
    };

    /**
     * @constructor
     * @param {FirmataBoard} firmataBoard
     * @param {string} id
     */
    constructor( firmataBoard: FirmataBoard, id: string ) {
        super( firmataBoard, id );

        this.firmataBoard.removeListener( 'ready', this.readyListener );
        this.firmataBoard.on( 'ready', this.initializeMajorTom.bind( this ) );
    }

    /**
     * Initializes Major Tom by setting its pins in the correct state and configuring the physical serial UART interface
     * @access private
     */
    private initializeMajorTom(): void {
        this.namespace = `Major Tom - ${ this.id }`;
        this.log = new Logger( this.namespace );

        this.log.debug( "This is Major Tom to ground control." );
        this.firmataBoard.pinMode( MajorTom.FAN_PIN, FirmataBoard.PIN_MODE.OUTPUT );
        this.firmataBoard.pinMode( MajorTom.POWER_PIN, FirmataBoard.PIN_MODE.PWM );

        const serialOptions = {
            portId: this.firmataBoard.SERIAL_PORT_IDs.HW_SERIAL0,
            baud: MajorTom.EMULATOR_BAUD,
            // rxPin: MajorTom.RX_PIN,
            // txPin: MajorTom.TX_PIN
        };

        this.firmataBoard.serialConfig( serialOptions );
        this.startHeartbeat();
    }

    /**
     * Enable or disable the builtin LED blinking
     *
     * @param {boolean} enable
     * @access private
     */
    private enableBlinkLed( enable: boolean ) {
        if ( enable ) {
            if ( this.blinkInterval ) {
                this.log.warn( `LED blink is already enabled.` );
                return;
            }
            this.blinkInterval = setInterval( this.toggleLED.bind( this ), 500);
            this.intervals.push( this.blinkInterval );
        } else {
            this.clearInterval( this.blinkInterval );
            this.blinkInterval = null;
            this.firmataBoard.digitalWrite( MajorTom.LED_PIN, FirmataBoard.PIN_STATE.HIGH ); // high === low???
        }
    }

    /**
     * Enable or disable the emulator's ignition
     * @param {boolean} enable
     * @access private
     */
    private enableEmulatorIgnition( enable: boolean ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATACC${ enable ? 1 : 0 }` ) );
    }

    /**
     * Validate the given DTC (Diagnostic Trouble Code) and set to the emulator
     * @param {string} dtc A DTC code as per this site: https://www.obd-codes.com/trouble_codes/
     * @param {number} mode The mode at which the DTC should be set
     * @access private
     */
    private setDTC( dtc: string, mode: string ): void {
        if ( !MajorTom.isValidDTC( dtc ) ) throw new Error( `${ dtc } is not a valid DTC.` );

        let _mode: string;
        switch ( mode ) {
            case "0x07":
                _mode = `7`;
                break;
            case "0x0A":
                _mode = `A`;
                break;
        }

        this.serialWriteToEmulator( StringConverter.toCharArray( `ATSET DTC${ _mode }=${ dtc }` ) );
    }

    /**
     * Clear all DTCs from the emulator
     * @access private
     */
    private clearAllDTCs(): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATCLR DTC` ) );
    }

    /**
     * Sets the emulator RPM (Rotations Per Minute)
     * @param {number} rpm RPM
     * @access private
     */
    private setRPM( rpm: string ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATSET 010C=${ rpm }` ) );
    }

    /**
     * Sets the emulator speed
     * @param {number} speed Speed in km/h
     * @access private
     */
    private setSpeed( speed: string ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATSET 0113=${ speed }` ) );
    }

    /**
     * Enable or disable the emulator's debug mode
     * @param {boolean} enable
     * @access private
     */
    private enableEmulatorDebugMode( enable: boolean ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATINF${ enable ? 1 : 0 }` ) );
    }

    /**
     * Sets the emulator's VIN (Vehicle Identification Number)
     * @param {string} vin
     * @access private
     */
    private setVIN( vin: string ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATSET VIN=${ vin }` ) );
    }

    /**
     * Voltage should be between 0 - 600. This is not the actual voltage. Refer to MajorTom.SUPPLY_VOLTAGE
     * @param {number} voltage
     * @access private
     */
    private setSupplyVoltage( voltage: number ): void {
        if ( voltage > 600 ) throw new Error( `Better not play with fire. Do not set supply voltage higher than 600 (for now).` );
        this.firmataBoard.analogWrite( MajorTom.POWER_PIN, voltage );
    }

    /**
     * Turn the engine on.
     * This will turn the emulator engine ignition on, dip the power supply and run the (unbalanced) fan
     * The engine will remain running until stopEngine() is called.
     * @access private
     */
    private startEngine(): void {
        if ( this.engineOn ) throw new Error( `Engine has already been started.` );
        this.engineOn = true;
        this.enableEmulatorIgnition( true );
        this.dipPowerSupply( MajorTom.DEFAULT_POWER_DIP_DURATION );
        this.shake();
    }

    /**
     * Turn the engine off.
     * @access private
     */
    private stopEngine(): void {
        this.engineOn = false;
        this.enableEmulatorIgnition( false );
        this.clearInterval( this.shakeInterval );
    }

    /**
     * Enable or disable the emulator's character echo feature
     * @access private
     * @param {boolean} enable
     */
    private enableEmulatorCharacterEcho( enable: boolean ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATE${ enable ? 1 : 0 }` ) );
    }

    /**
     * Initialize the emulator, or whatever that means
     * @access private
     */
    private initializeEmulator(): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATZ` ) );
    }

    /**
     * Reset the emulator
     * @access private
     */
    private resetEmulator(): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATR` ) );
    }

    /**
     * Writes a character byte-array to MajorTom's physical serial UART interface.
     * This interface is directly connected to the emulator to allow control using AT-commands.
     * @access private
     * @param {number[]} charArray AT-method to send, encoded as a hexadecimal byte-array
     */
    private serialWriteToEmulator( charArray: number[] ): void {
        this.firmataBoard.serialWrite( this.firmataBoard.SERIAL_PORT_IDs.HW_SERIAL0, charArray );
    }

    /**
     * @access private
     */
    private toggleLED(): void {
        this.firmataBoard.digitalWrite( MajorTom.LED_PIN, this.firmataBoard.pins[ MajorTom.LED_PIN ].value === FirmataBoard.PIN_STATE.HIGH ? FirmataBoard.PIN_STATE.LOW : FirmataBoard.PIN_STATE.HIGH );
    }

    /**
     * Turns on the (unbalanced) fan for 10 seconds, after which the fan remains turned off for 1 second.
     * It will do so indefinitely or until the stopEngine() method is called.
     * NOTE: This method should not be used anywhere besides the startEngine() method.
     * @access private
     */
    private shake(): void {
        this.shakeInterval = setInterval( () => {
            this.enableFan( true );

            setTimeout( () => {
                this.enableFan( false );
            }, MajorTom.DEFAULT_SHAKE_DURATION );

        }, MajorTom.DEFAULT_SHAKE_DURATION + 1000 );

        this.intervals.push( this.shakeInterval );
    }

    /**
     * Enable or disable the fan
     * @param {boolean} enable
     * @access private
     */
    private enableFan( enable: boolean ): void {
        this.firmataBoard.digitalWrite( MajorTom.FAN_PIN, enable ? FirmataBoard.PIN_STATE.HIGH : FirmataBoard.PIN_STATE.LOW );
    }

    /**
     * Sharply dip the power supply to ~11.6v and ramp the voltage up to ~12.5v (linear)
     * NOTE: latency should be tested properly when connecting using EtherPort instance.
     * @param {number} dipDuration - Dip duration in ms with a minimum of 1000. Defaults to 1500
     * @access private
     */
    private dipPowerSupply( dipDuration: number ): void {
        let ramped = 0;
        const interval = Math.ceil( ( dipDuration >= 1000 ? dipDuration : 1500 ) / ( ( MajorTom.SUPPLY_VOLTAGE.GOOD - MajorTom.SUPPLY_VOLTAGE.LOW ) / 10 ) );

        // dip it!
        this.firmataBoard.analogWrite( MajorTom.POWER_PIN, MajorTom.SUPPLY_VOLTAGE.LOW );

        // ramp it!
        const rampUp = setInterval( () => {
            ramped += 10;
            this.setSupplyVoltage( MajorTom.SUPPLY_VOLTAGE.LOW + ramped );
            if ( ramped + MajorTom.SUPPLY_VOLTAGE.LOW >= MajorTom.SUPPLY_VOLTAGE.GOOD ) this.clearInterval( rampUp );
        }, interval );

        this.intervals.push( rampUp );
    }

    /**
     * Validates a DTC
     * @param {string} dtc - DTC to validate
     * @access private
     * @returns {boolean}
     */
    private static isValidDTC( dtc: string ): boolean {
        return /^P[0-3][A-Z0-9][A-Z0-9][A-Z0-9]$/.exec( dtc ) !== null;
    }
}

export default MajorTom;