import { createServer, Server } from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import Logger from './logger';

/**
 * @classdesc A basic HTTP static files server serving static files at a given port
 * @namespace HttpService
 */
class HttpService {

    /**
     * @type {http.Server}
     * @access private
     */
    private _server: Server;

    /**
     * @type {number}
     * @access private
     */
    private port: number;

    /**
     * @type {string}
     * @access private
     * @static
     */
    private static namespace = 'http';

    /**
     * @type {Object}
     * @access private
     * @static
     */
    private static ALLOWED_FILETYPES = { // todo: filter out unwanted filetypes?
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        //'.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        //'.wav': 'audio/wav',
        //'.mp3': 'audio/mpeg',
        //'.svg': 'image/svg+xml',
        //'.pdf': 'application/pdf',
        //'.doc': 'application/msword'
    };

    /**
     * @constructor
     * @param {number} port Port on which to listen for HTTP requests.
     */
    constructor( port: number ) {
        this.port = port;
        this._server = createServer( this.handleRequest.bind( this ) ).listen( port );
        Logger.info( HttpService.namespace, `Listening on port ${port}.` );
    }

    /**
     * Get the Server object.
     * @access public
     * @returns {module:http.Server}
     */
    public get server(): Server {
        return this._server;
    }

    /**
     * Handles HTTP requests and serves the requested file(s) where possible.
     * @access private
     * @param request
     * @param response
     */
    private handleRequest( request: Request, response ): void {
        const parsedUrl = url.parse( request.url );
        let pathname = `${parsedUrl.pathname}`;
        const extension = path.parse( pathname ).ext;

        // find a better solution, mate
        // if ( pathname !== '/' ) {
        //     response.statusCode = 403;
        //     response.end( `This path is not allowed.` );
        //     return;
        // }

        fs.access( pathname, fs.constants.F_OK, ( error ) => {
            if ( error ) {
                response.statusCode = 404;
                response.end( `File ${ pathname } not found` );
                return;
            }

            if ( fs.statSync( process.cwd() + pathname ).isDirectory() ) pathname = `${ process.cwd() }/public${ pathname }index.html`;

            fs.readFile( pathname, ( error, data ) => {
                if( error ){
                    response.statusCode = 500;
                    response.end( `Error getting the file: ${ error }.` );
                } else {
                    response.setHeader( `Content-type`, HttpService.ALLOWED_FILETYPES[ extension ] || `text/plain` );
                    response.end( data );
                }
            } );
        } );
    }
}

export default HttpService;