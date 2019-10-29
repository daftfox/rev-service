export default interface IDatabaseOptions {
    username: string;
    password: string;
    host: string;
    port: number;
    path: string;
    dialect: string;
    schema: string;
    debug: boolean;
}