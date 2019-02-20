#! /usr/bin/env node

'use strict';
import MainController from './controller/main';

const main = new MainController();

// process.on('uncaughtException', (error: Error) => {
//     //console.log(`Uncaught exception because: ${error['errno']}, ${error['code']}, ${error['syscall']}`);
//     console.log(`Uncaught exception because: ${error}}`);
//     // Application specific logging, throwing an error, or other logic here
// });