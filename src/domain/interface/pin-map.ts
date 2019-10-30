export default interface IPinMap {
    LED: number;
    TX: number;
    RX: number;
    [PIN_NAME: string]: number;
}
