"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class Program extends sequelize_1.Model {
}
Program.init({
    name: sequelize_1.STRING
}, {
    sequelize,
});
//# sourceMappingURL=program.js.map