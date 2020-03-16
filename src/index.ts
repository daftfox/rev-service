#! /usr/bin/env node

'use strict';
import 'reflect-metadata';
import { MainController } from './controller';
const main = new MainController();

main.startAllServices();
