#! /usr/bin/env node

'use strict';
import MainController from './controller/main';
const main = new MainController();

main.startAllServices();
