var crypto = require("crypto"); //to gen random collections so they dont interfere
var expect = require('chai').expect;
var Db = require('tingodb')({
    memStore: true
}).Db;
var target = require("../database"); //the actual database we are testing

describe('basic database', function () {
    it('cars going in and out of garage', async () => {
        var db = new Db('db' + crypto.randomBytes(20).toString('hex'), {});
        target.initDatabaseAndListeners(db);

        time = target.getCurrentTime() - 10; //minus time for testing accuracy

        await target.addCar(true, 1, time + 1);
        await target.addCar(false, 1, time + 2);

        cars = await target.getCarsInGarage();
        expect(cars).to.be.equal(0);

        await target.addCar(true, 1, time + 3);
        await target.addCar(true, 1, time + 4);

        cars = await target.getCarsInGarage();
        expect(cars).to.be.equal(2);

        await target.addCar(false, 1, time + 5);
        await target.addCar(false, 1, time + 6);
        await target.addCar(true, 1, time + 7);


        return target.getCarsInGarage().then(function (cars) {
            expect(cars).to.be.equal(1);
        });
    });

    it('tests are independant', async () => {
        var db = new Db('db' + crypto.randomBytes(20).toString('hex'), {});
        target.initDatabaseAndListeners(db);
        cars = await target.getCarsInGarage();
        expect(cars).to.be.equal(0);
    });

    it('throughput', async () => {
        var db = new Db('db' + crypto.randomBytes(20).toString('hex'), {});
        target.initDatabaseAndListeners(db);

        //This test doesn't care about number of cars in garage thus time doesn't have to be actual
        await target.addCar(false, 1, 1);
        await target.addCar(false, 1, 2);
        await target.addCar(true, 1, 3);
        await target.addCar(false, 1, 4);
        await target.addCar(true, 1, 5);

        cars = await target.getCarThroughput(0, 5);
        expect(cars).to.be.equal(5);

        cars = await target.getCarThroughput(1, 4);
        expect(cars).to.be.equal(5);

        cars = await target.getCarThroughput(2, 2);
        expect(cars).to.be.equal(3);

        cars = await target.getCarThroughput(target.getCurrentTime(), 0);
        expect(cars).to.be.equal(-1);

        cars = await target.getCarThroughput(-3, 0);
        expect(cars).to.be.equal(-1);

        cars = await target.getCarThroughput(1, -2);
        expect(cars).to.be.equal(-1);

        cars = await target.getCarThroughput(target.getCurrentTime() - 1, 2); //should automaticly just assume to go to current time
        expect(cars).to.be.equal(0);
    });

    it("checkpoints", async () => {
        var db = new Db('db' + crypto.randomBytes(20).toString('hex'), {});
        target.initDatabaseAndListeners(db);

        time = target.getCurrentTime() - 400; // take some time off to make sure database is in order

        //add cars
        for (i = 0; i < 25; i++) {
            await target.addCar(true, 1, time + (i * 3) + 1);

            await target.addCar(true, 1, time + (i * 3) + 2);
            await target.addCar(false, 1, time + (i * 3) + 3);
        }

        //insure count without checkpoints is correct
        cars = await target.getCarsInGarage(true);
        expect(cars).to.be.equal(25);

        //insure count with checkpoints is correct
        cars = await target.getCarsInGarage(false);
        expect(cars).to.be.equal(25);


        time = time + 100;//move time forward a bit
        //add an insane amount of cars
        for (i = 0; i < 300; i++) {
            await target.addCar(true, 1, time + i);
        }

        return target.getCarsInGarage().then(function (cars) {
            expect(cars).to.be.equal(325);
        });
    });
})