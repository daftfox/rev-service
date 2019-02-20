import Board from "./board";
import * as FirmataBoard from 'firmata';
import StringConverter from "../service/string-converter";
import Logger from "../service/logger";

// https://freematics.com/pages/products/freematics-obd-emulator-mk2/control-command-set/

class MajorTom extends Board {

    // -------- Do not alter the values below --------
    private static SUPPLY_VOLTAGE = {
        HIGH: 550,                               // ~13.5v
        GOOD: 410,                               // ~12.6v
        LOW: 240,                                // ~11.5v
        CRITICAL: 0                              // ~10.6v
    };
    private static LED_PIN              = 2;     // GPIO16 / D0
    private static FAN_PIN              = 16;    // GPIO16 / D0
    private static POWER_PIN            = 14;    // GPIO14 / D5
    // private static RX_PIN          = 13;    // GPIO13 / D7
    // private static TX_PIN          = 15;    // GPIO15 / D8
    private static EMULATOR_BAUD        = 38400; // Emulator baud rate (should be 38400 baud)
    // -------- Do not alter the values above --------

    /*
     * Map available methods so we can easily call them from elsewhere
     */
    protected AVAILABLE_COMMANDS = {
        BLINKON: () => { this.enableBlinkLed( true ) },
        BLINKOFF: () => { this.enableBlinkLed( false ) },
        TOGGLELED: () => { this.toggleLED() },
        ENGINEON: () => { this.startEngine() },
        ENGINEOFF: () => { this.stopEngine() },
        SETSPEED: ( speed: string ) => { this.setSpeed( speed ) },
        SETRPM: ( rpm: string ) => { this.setRPM( rpm ) },
        SETDTC: ( speed: string, mode: string ) => { this.setDTC( speed, mode ) },
        CLEARDTCS: () => { this.clearAllDTCs() },
        DEBUGON: () => { this.enableEmulatorDebugMode( true ) },
        DEBUGOFF: () => { this.enableEmulatorDebugMode( false ) },
        SETVIN: ( vin: string ) => { this.setVIN( vin ) },
    };
    private static DEFAULT_POWER_DIP_DURATION = 1500;  // Default power dip duration when 'starting the engine'
    private static DEFAULT_SHAKE_DURATION     = 10000; // Default shake interval duration

    private shakeInterval;
    private blinkInterval;
    private engineOn = false;

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
     */
    private initializeMajorTom(): void {
        this.namespace = `Major Tom - ${ this.id }`;
        Logger.info( this.namespace, "This is Major Tom to ground control." );
        this.firmataBoard.pinMode( MajorTom.FAN_PIN, FirmataBoard.PIN_MODE.OUTPUT );
        this.firmataBoard.pinMode( MajorTom.POWER_PIN, FirmataBoard.PIN_MODE.PWM );

        const serialOptions = {
            portId: this.firmataBoard.SERIAL_PORT_IDs.HW_SERIAL0,
            baud: MajorTom.EMULATOR_BAUD,
            // rxPin: MajorTom.RX_PIN,
            // txPin: MajorTom.TX_PIN
        };

        this.firmataBoard.serialConfig( serialOptions );
    }

    private enableBlinkLed( enable: boolean ) {
        if ( enable ) {
            if ( this.blinkInterval ) throw new Error( `LED blink is already enabled.` );
            this.blinkInterval = setInterval( this.toggleLED.bind( this ), 1000);
        } else {
            clearInterval( this.blinkInterval );
            this.firmataBoard.digitalWrite( MajorTom.LED_PIN, FirmataBoard.PIN_STATE.HIGH ); // high === low???
        }
    }

    /**
     * Enable or disable the emulator's ignition
     * @param {boolean} enable
     */
    private enableEmulatorIgnition( enable: boolean ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATACC${ enable ? 1 : 0 }` ) );
    }

    /**
     * Validate the given DTC (Diagnostic Trouble Code) and set to the emulator
     * @param {string} dtc - A DTC code as per this site: https://www.obd-codes.com/trouble_codes/
     * @param {number} mode - The mode at which the DTC should be set
     */
    private setDTC( dtc: string, mode: string ): void {
        if ( !MajorTom.isValidDTC( dtc ) ) throw `${ dtc } is not a valid DTC.`;

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
     */
    private clearAllDTCs(): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATCLR DTC` ) );
    }

    /**
     * Sets the emulator RPM (Rotations Per Minute)
     * @param {number} rpm - RPM
     */
    private setRPM( rpm: string ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATSET 010C=${ rpm }` ) );
    }

    /**
     * Sets the emulator speed
     * @param {number} speed - Speed in km/h
     */
    private setSpeed( speed: string ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATSET 0113=${ speed }` ) );
    }

    /**
     * Enable or disable the emulator's debug mode
     * @param {boolean} enable
     */
    private enableEmulatorDebugMode( enable: boolean ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATINF${ enable ? 1 : 0 }` ) );
    }

    /**
     * Sets the emulator's VIN (Vehicle Identification Number)
     * @param {string} vin
     */
    private setVIN( vin: string ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATSET VIN=${ vin }` ) );
    }

    /**
     * Voltage should be between 0 - 600. This is not the actual voltage. Refer to MajorTom.SUPPLY_VOLTAGE
     * @param {number} voltage
     */
    private setSupplyVoltage( voltage: number ): void {
        if ( voltage > 600 ) throw `Better not play with fire.`;
        this.firmataBoard.analogWrite( MajorTom.POWER_PIN, voltage );
    }

    /**
     * Turn the engine on.
     * This will turn the emulator engine ignition on, dip the power supply and run the (unbalanced) fan
     * The engine will remain running until stopEngine() is called.
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
     */
    private stopEngine(): void {
        this.engineOn = false;
        this.enableEmulatorIgnition( false );
        clearInterval( this.shakeInterval );
    }

    /**
     * Enable or disable the emulator's character echo feature
     * @param {boolean} enable
     */
    private enableEmulatorCharacterEcho( enable: boolean ): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATE${ enable ? 1 : 0 }` ) );
    }

    /**
     * Initialize the emulator, or whatever that means
     */
    private initializeEmulator(): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATZ` ) );
    }

    /**
     * Reset the emulator
     */
    private resetEmulator(): void {
        this.serialWriteToEmulator( StringConverter.toCharArray( `ATR` ) );
    }

    /**
     * Writes a character byte-array to MajorTom's physical serial UART interface.
     * This interface is directly connected to the emulator to allow control using AT-commands.
     * @param {number[]} charArray - AT-command to send, encoded as a hexadecimal byte-array
     */
    private serialWriteToEmulator( charArray: number[] ): void {
        this.firmataBoard.serialWrite( this.firmataBoard.SERIAL_PORT_IDs.HW_SERIAL0, charArray );
    }

    private toggleLED(): void {
        this.firmataBoard.digitalWrite( MajorTom.LED_PIN, this.firmataBoard.pins[ MajorTom.LED_PIN ].value === FirmataBoard.PIN_STATE.HIGH ? FirmataBoard.PIN_STATE.LOW : FirmataBoard.PIN_STATE.HIGH );
    }

    /**
     * Turns on the (unbalanced) fan for 10 seconds, after which the fan remains turned off for 1 second.
     * It will do so indefinitely or until the stopEngine() method is called.
     * NOTE: This method should not be used anywhere besides the startEngine() method.
     */
    private shake(): void {
        this.shakeInterval = setInterval( () => {
            this.enableFan( true );

            setTimeout( () => {
                this.enableFan( false );
            }, MajorTom.DEFAULT_SHAKE_DURATION );
        }, MajorTom.DEFAULT_SHAKE_DURATION + 1000 );
    }

    /**
     * Enable or disable the fan
     * @param {boolean} enable
     */
    private enableFan( enable: boolean ): void {
        this.firmataBoard.digitalWrite( MajorTom.FAN_PIN, enable ? FirmataBoard.PIN_STATE.HIGH : FirmataBoard.PIN_STATE.LOW );
    }

    /**
     * Sharply dip the power supply to ~11.6v and ramp the voltage up to ~12.5v (linear)
     * NOTE: latency should be tested properly when connecting using EtherPort instance.
     * @param {number} dipDuration - Dip duration in ms with a minimum of 1000. Defaults to 1500
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
            if ( ramped + MajorTom.SUPPLY_VOLTAGE.LOW >= MajorTom.SUPPLY_VOLTAGE.GOOD ) clearInterval( rampUp );
        }, interval );
    }

    /**
     * Validates a DTC
     * @param {string} dtc - DTC to validate
     * @returns {boolean}
     */
    private static isValidDTC( dtc: string ): boolean {
        return /^P[0-3][A-Z0-9][A-Z0-9][A-Z0-9]$/.exec( dtc ) !== null;
    }
}

export default MajorTom;