export default interface IPinMapping {
    LED: number;
    TX: number;
    RX: number;
    [PIN_NAME: string]: number;
}
