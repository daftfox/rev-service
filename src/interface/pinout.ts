export default interface IPinout {
    LED: number;
    TX: number;
    RX: number;
    [PIN_NAME: string]: number;
}