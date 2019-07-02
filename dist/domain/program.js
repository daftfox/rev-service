"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
let Program = class Program extends sequelize_typescript_1.Model {
    getCommands() {
        return JSON.parse(this.commands);
    }
    setCommands(commands) {
        this.commands = JSON.stringify(commands);
    }
};
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Program.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Program.prototype, "deviceType", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Program.prototype, "commands", void 0);
Program = __decorate([
    sequelize_typescript_1.Table({
        timestamps: true
    })
], Program);
exports.default = Program;
const blinkProgram = {
    name: 'Blink example',
    deviceType: 'all',
    commands: [
        {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        }, {
            action: 'TOGGLELED',
            duration: 1000,
        },
    ],
};
const sosProgram = {
    name: 'SOS',
    deviceType: 'all',
    commands: [
        {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 1000,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 500,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 1000,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 1000,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 1000,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 1000,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 1000,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 500,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 1000,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "0"],
            duration: 300,
        }, {
            action: 'SETPINVALUE',
            parameters: ["2", "1"],
            duration: 300,
        },
    ],
};
exports.defaultPrograms = {
    BLINK_PROGRAM: blinkProgram,
    SOS_PROGRAM: sosProgram,
};
//# sourceMappingURL=program.js.map