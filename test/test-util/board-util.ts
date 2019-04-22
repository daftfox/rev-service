import * as net from "net";
import * as Promise from 'promise';
import IEthernetServiceOptions from "../../src/interface/ethernet-service-options";
import {ANALOG_MAPPING_BUFFER, CAPABILITIES_BUFFER, VERSION_BUFFER} from "../mock-data/firmata-responses";

export const connectBoard = ( ethernetServiceOptions: IEthernetServiceOptions ) => {
    return new Promise( ( resolve ) => {
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
                resolve( client );
            }
        } );
    } );
};

const parseBuffer = ( buffer: Buffer ) => {
    return buffer.toString( 'hex' );
};