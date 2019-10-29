import Boards from "../../model/boards";
import Programs from "../../model/programs";

export default interface IWebSocketOptions {
    port: number;
    boardModel: Boards;
    programModel: Programs;
}