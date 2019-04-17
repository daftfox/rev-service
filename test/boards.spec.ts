import { describe } from 'mocha';
import Boards from '../src/model/boards';
import { expect } from 'chai';

describe( 'Boards model', () => {

    let model: Boards;

    before( () => {
        model = new Boards();
    } );

    it( 'should have instantiated properly', () => {
        expect( model ).to.not.equal( null );
    } );
} );