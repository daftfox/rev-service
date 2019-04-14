/**
 * @classdesc This class shouldn't exist, but here we are eh?
 * JavaScript doesn't allow you to parse a character to a hexadecimal value of its ASCII code, without turning it
 * into a string.
 * For example:
 * "J" => "4a"
 *
 * This bothers me, because the serialWrite() method in firmatajs expects an array of number typed variables.
 *
 * "AHA, but we have parseInt()!" - I hear you think. Let's see what happens:
 * parseInt("4a") => 4
 *
 * That leaves us with only half of what we need in all cases where the hexadecimal representation of the character's
 * ASCII code contains anything that isn't a ten-based digit.
 *
 * Therefore I have decided that implementing a service that is able to convert all possible characters required by the
 * Freematics OBD II Emulator AT-method set.
 *
 * Enjoy this ugly bastard.
 * @namespace StringConverter
 */
class StringConverter {
    private static CHARACTERS = {
        "A": 0x41,
        "B": 0x42,
        "C": 0x43,
        "D": 0x44,
        "E": 0x45,
        "F": 0x46,
        "G": 0x47,
        "H": 0x48,
        "I": 0x49,
        "J": 0x4A,
        "K": 0x4B,
        "L": 0x4C,
        "M": 0x4D,
        "N": 0x4E,
        "O": 0x4F,
        "P": 0x50,
        "Q": 0x51,
        "R": 0x52,
        "S": 0x53,
        "T": 0x54,
        "U": 0x55,
        "V": 0x56,
        "W": 0x57,
        "X": 0x58,
        "Y": 0x59,
        "Z": 0x5A,
        "0": 0x30,
        "1": 0x31,
        "2": 0x32,
        "3": 0x33,
        "4": 0x34,
        "5": 0x35,
        "6": 0x36,
        "7": 0x37,
        "8": 0x38,
        "9": 0x39,
        " ": 0x20,
        "=": 0x3D
    };

    /**
     * Converts the supplied string to a hexadecimal byte-array
     *
     * @param {string} str
     * @returns {number[]} A hexadecimal byte-array
     */
    public static toCharArray( str: string ): number[] {
        const charArray = [];

        for( let character of str ) {
            charArray.push( StringConverter.CHARACTERS[ character.toUpperCase() ] );
        }

        return charArray;
    }
}

export default StringConverter;