import { describe, before } from 'mocha';
import { expect } from 'chai';
import EthernetService from '../src/service/ethernet-service';
import Boards from '../src/model/boards';
import EthernetServiceOptions from '../src/interface/ethernet-service-options';
import * as net from 'net';
import { VERSION_BUFFER, ANALOG_MAPPING_BUFFER, CAPABILITIES_BUFFER } from './mock-data/firmata-responses';

describe( 'Ethernet service', () => {
    let boards: Boards;
    let ethernetServiceOptions: EthernetServiceOptions;
    let ethernetService: EthernetService;

    const parseBuffer = ( buffer: Buffer ) => {
        return buffer.toString( 'hex' );
    };

    before( () => {
        process.env.verbose = '1';
        boards = new Boards();
        ethernetServiceOptions = {
            listenPort: 9000,
            startPort: 3000,
            endPort: 3100
        };
        ethernetService = new EthernetService( boards, ethernetServiceOptions );
    } );

    it( 'should instantiate properly', () => {
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

        const client = new net.Socket().connect( ethernetServiceOptions.listenPort );
        client.on( 'data', ( data: Buffer ) => {
            const parsedData = parseBuffer( data );

            if ( parsedData === 'f9f079f7' ) { // request version and firmware
                client.write( VERSION_BUFFER );
            } else if( parsedData === 'f06bf7' ) { // request capabilities
                client.write( CAPABILITIES_BUFFER );
            } else if( parsedData === 'f069f7' ) { // request analog mapping
                client.write( ANALOG_MAPPING_BUFFER );
            } else {
                expect( parsedData.substring( 0, 2 ) ).to.equal( 'f4' );
                done();
            }
        } );
    } ).timeout( 10000 );

    it( 'should create two concurrent instances of major tom', ( done ) => {
        const responses = [];

        const client1 = new net.Socket().connect( ethernetServiceOptions.listenPort );
        client1.on( 'data', ( data: Buffer ) => {
            const parsedData = parseBuffer( data );

            if ( parsedData === 'f9f079f7' ) { // request version and firmware
                client1.write( VERSION_BUFFER );
            } else if( parsedData === 'f06bf7' ) { // request capabilities
                client1.write( CAPABILITIES_BUFFER );
            } else if( parsedData === 'f069f7' ) { // request analog mapping
                client1.write( ANALOG_MAPPING_BUFFER );
            } else {
                responses.push( parsedData.substring( 0, 2 ) );
            }
        } );

        setTimeout( () => {
            const client2 = new net.Socket().connect( ethernetServiceOptions.listenPort );
            client2.on( 'data', ( data: Buffer ) => {
                const parsedData = parseBuffer( data );

                if ( parsedData === 'f9f079f7' ) { // request version and firmware
                    client2.write( VERSION_BUFFER );
                } else if( parsedData === 'f06bf7' ) { // request capabilities
                    client2.write( CAPABILITIES_BUFFER );
                } else if( parsedData === 'f069f7' ) { // request analog mapping
                    client2.write( ANALOG_MAPPING_BUFFER );
                } else {
                    responses.push( parsedData.substring( 0, 2 ) );
                    expect( responses.filter( response => response != 'f4' ).length ).to.equal( 0 );
                    done();
                }
            } );
        }, 3000 );
    } ).timeout( 10000 );
} );
