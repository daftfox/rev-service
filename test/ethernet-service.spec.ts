import { describe, before } from 'mocha';
import { expect } from 'chai';
import EthernetService from '../src/service/ethernet-service';
import Boards from '../src/model/boards';
import EthernetServiceOptions from '../src/interface/ethernet-service-options';
import fetch from 'node-fetch';

describe('Ethernet service', () => {
    let boards: Boards;
    let ethernetServiceOptions: EthernetServiceOptions;
    let ethernetService: EthernetService;

    before( () => {
        process.env.verbose = '';
        boards = new Boards();
        ethernetServiceOptions = {
            listenPort: 9000,
            startPort: 3000,
            endPort: 3100
        };
        ethernetService = new EthernetService( boards, ethernetServiceOptions );
    } );

    it( 'should instantiate properly', () => {
        expect(ethernetService).to.not.equal( null );
    } );

    // it( 'should return the correct amount of available ports', () => {
    //     expect( ethernetService.getNumberOfAvailablePorts() ).to.equal( ethernetServiceOptions.endPort - ethernetServiceOptions.startPort );
    //     ethernetService.stopService();
    //     ethernetServiceOptions.endPort = 3200;
    //     ethernetService = new EthernetService( boards, ethernetServiceOptions );
    //     expect( ethernetService.getNumberOfAvailablePorts() ).to.equal( ethernetServiceOptions.endPort - ethernetServiceOptions.startPort );
    // } );
    //
    // it( 'should have removed an available port', (done) => {
    //     const numberOfAvailablePorts = ethernetService.getNumberOfAvailablePorts();
    //     fetch('http://localhost:9000')
    //         .then( () => {
    //             expect( ethernetService.getNumberOfAvailablePorts() ).to.equal( numberOfAvailablePorts - 1 );
    //             done()
    //         } )
    //         .catch( err => {
    //             expect( ethernetService.getNumberOfAvailablePorts() ).to.equal( numberOfAvailablePorts - 1 );
    //             done();
    //         } );
    // } );
    //
    // it( 'should have made the previously removed port available again after connection timeout expired', ( done ) => {
    //     const numberOfAvailablePorts = ethernetService.getNumberOfAvailablePorts();
    //     setTimeout( () => {
    //         expect( ethernetService.getNumberOfAvailablePorts() ).to.equal( numberOfAvailablePorts + 1 );
    //         done();
    //     }, 10500 );
    // } ).timeout(15000);
} );