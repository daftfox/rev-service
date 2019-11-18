export default class AvailableTypes {
    public static MAJORTOM = 'MajorTom';
    public static BOARD = 'Board';
    public static LEDCONTROLLER = 'LedController';

    public static isAvailableType(type: string): boolean {
        return Object.values(AvailableTypes).includes(type);
    }
}
