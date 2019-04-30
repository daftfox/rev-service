"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const logger_1 = require("./logger");
const chalk_1 = require("chalk");
/**
 * @classdesc A basic HTTP static files server serving static files at a given port
 * @namespace HttpService
 */
class HttpService {
    /**
     * @constructor
     * @param {number} port Port on which to listen for HTTP requests.
     */
    constructor(port) {
        this.log = new logger_1.default(HttpService.namespace);
        this.port = port;
        this._server = http_1.createServer(this.handleRequest.bind(this)).listen(port);
        this.log.debug(`Listening on port ${chalk_1.default.rgb(240, 240, 30).bold(port.toString(10))}.`);
    }
    /**
     * Get the Server object.
     * @access public
     * @returns {module:http.Server}
     */
    get server() {
        return this._server;
    }
    /**
     * Handles HTTP requests and serves the requested file(s) where possible.
     * @access private
     * @param request
     * @param response
     */
    handleRequest(request, response) {
        const parsedUrl = url.parse(request.url);
        let pathname = `${parsedUrl.pathname}`;
        const extension = path.parse(pathname).ext;
        // find a better solution, mate
        // if ( pathname !== '/' ) {
        //     response.statusCode = 403;
        //     response.end( `This path is not allowed.` );
        //     return;
        // }
        fs.access(pathname, fs.constants.F_OK, (error) => {
            if (error) {
                response.statusCode = 404;
                response.end(`File ${pathname} not found`);
                return;
            }
            if (fs.statSync(process.cwd() + pathname).isDirectory())
                pathname = `${process.cwd()}/public${pathname}index.html`;
            fs.readFile(pathname, (error, data) => {
                if (error) {
                    response.statusCode = 500;
                    response.end(`Error getting the file: ${error}.`);
                }
                else {
                    response.setHeader(`Content-type`, HttpService.ALLOWED_FILETYPES[extension] || `text/plain`);
                    response.end(data);
                }
            });
        });
    }
}
/**
 * @type {string}
 * @access private
 * @static
 */
HttpService.namespace = 'http';
/**
 * @type {Object}
 * @access private
 * @static
 */
HttpService.ALLOWED_FILETYPES = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    //'.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
};
exports.default = HttpService;
//# sourceMappingURL=http-service.js.map