var path = require('path');
var expect = require('chai').expect;
var Db = require('tingodb')({
    memStore: true
}).Db;
var target = require("../database"); //the actual database we are testing

describe('basic database', function () {
    var db = new Db(path.join(__dirname, 'db'), {});
    
    it('cars going in and out of garage', async () => {
        target.initDatabaseAndListeners(db);
        target.addCar(true, 1, 1);
        target.addCar(false, 1, 2);
        
        cars = await target.getCarsInGarage();
        expect(cars).to.be.equal(0);


        target.addCar(true, 1, 3);
        target.addCar(true, 1, 4);

        cars = await target.getCarsInGarage();
        expect(cars).to.be.equal(2);

        target.addCar(false, 1, 4);
        target.addCar(false, 1, 5);
        
        //FIXME NOT WORKING B/C PROMISES SUCK
        return target.getCarsInGarage().then(function (cars) { expect(cars).to.be.equal(0); });
    });

    it('tests are independant', async () =>{
        target.initDatabaseAndListeners(db);
        cars = await target.getCarsInGarage();
        expect(cars).to.be.equal(0);
    });
})