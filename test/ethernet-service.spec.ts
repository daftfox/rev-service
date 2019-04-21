import { describe, before } from 'mocha';
import { expect } from 'chai';
import EthernetService from '../src/service/ethernet-service';
import Boards from '../src/model/boards';
import EthernetServiceOptions from '../src/interface/ethernet-service-options';
import * as net from 'net';
import { connectBoard } from './test-util/board-util';


describe( 'Ethernet service', () => {
    let model: Boards;
    let ethernetServiceOptions: EthernetServiceOptions;
    let ethernetService: EthernetService;

    const connectedClients: net.Socket[] = [];

    before( () => {
        process.env.debug = '1';
        model = new Boards();
        ethernetServiceOptions = {
            listenPort: 9000,
            startPort: 3000,
            endPort: 3100
        };
        ethernetService = new EthernetService( model, ethernetServiceOptions );
    } );

    it( 'should have instantiated properly', () => {
        expect( ethernetService ).to.not.equal( null );
    } );

    it( 'should connect to the proxy', ( done ) => {
        const client = new net.Socket().connect( ethernetServiceOptions.listenPort );
        client.on('data', ( data: Buffer ) => {

            /*
             * f9 => report version
             * f0 => start sysex command
             * 79 => query firmware
             * f7 => end sysex command
             */

            expect( data.toString( 'hex' ) ).to.equal( 'f9f079f7' );
            done();
        });
    } ).timeout(70000);

    it( 'should create a new instance of major tom', ( done ) => {
        connectBoard( ethernetServiceOptions )
            .then( ( client: net.Socket ) => {
                connectedClients.push( client );

                expect( model.boards.length ).to.equal( 1 );

                done();
            });
    } ).timeout( 10000 );

    it( 'should create two concurrent instances of major tom', ( done ) => {
        connectBoard( ethernetServiceOptions )
            .then( ( client1: net.Socket ) => {
                connectedClients.push( client1 );
                expect( model.boards.length ).to.equal( 1 );

                // connect a second board
                connectBoard( ethernetServiceOptions )
                    .then( ( client2: net.Socket ) => {
                        connectedClients.push( client2 );
                        expect( model.boards.length ).to.equal( 2 );
                        done();
                    } );
            } );
    } ).timeout( 14000 );
} );
