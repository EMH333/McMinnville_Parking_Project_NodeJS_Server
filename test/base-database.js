const crypto = require('crypto'); // to gen random collections so they dont interfere
const expect = require('chai').expect;
const Db = require('tingodb')({
  memStore: true,
}).Db;
const target = require('../database'); // the actual database we are testing

beforeEach(async function() {
  // create a new database and initialize it for each test (in entire test suite)
  const db = new Db('db' + crypto.randomBytes(20).toString('hex'), {});
  target.initDatabaseAndListeners(db);
});

describe('basic database', function() {
  it('cars going in and out of garage', async function() {
    time = target.getCurrentTime() - 10; // minus time for testing accuracy

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


    return target.getCarsInGarage().then(function(cars) {
      expect(cars).to.be.equal(1);
    });
  });

  it('tests are independant', async function() {
    cars = await target.getCarsInGarage();
    expect(cars).to.be.equal(0);
  });

  it('throughput', async function() {
    // This test doesn't care about number of cars in garage thus time doesn't have to be actual
    await target.addCar(true, 1, 1);
    await target.addCar(true, 1, 2);
    await target.addCar(false, 1, 3);
    await target.addCar(true, 1, 4);
    await target.addCar(false, 1, 5);

    cars = await target.getCarThroughput(0, 5);
    expect(cars).to.be.equal(2);

    cars = await target.getCarThroughput(1, 4);
    expect(cars).to.be.equal(2);

    cars = await target.getCarThroughput(2, 2);
    expect(cars).to.be.equal(1);

    cars = await target.getCarThroughput(target.getCurrentTime(), 0);
    expect(cars).to.be.equal(-1);

    cars = await target.getCarThroughput(-3, 0);
    expect(cars).to.be.equal(-1);

    cars = await target.getCarThroughput(1, -2);
    expect(cars).to.be.equal(-1);

    // should automaticly just assume to go to current time
    cars = await target.getCarThroughput(target.getCurrentTime() - 1, 2);
    expect(cars).to.be.equal(0);
  });

  it('checkpoints', async function() {
    // eslint-disable-next-line no-invalid-this
    this.slow(200); // only give a time warning if this takes more than 200 millis
    time = target.getCurrentTime() - 400; // take some time off to make sure database is in order

    // add cars
    for (i = 0; i < 25; i++) {
      await target.addCar(true, 1, time + (i * 3) + 1);

      await target.addCar(true, 1, time + (i * 3) + 2);
      await target.addCar(false, 1, time + (i * 3) + 3);
    }

    // insure count without checkpoints is correct
    cars = await target.getCarsInGarage(true);
    expect(cars).to.be.equal(25);

    // insure count with checkpoints is correct
    cars = await target.getCarsInGarage(false);
    expect(cars).to.be.equal(25);


    time = time + 100; // move time forward a bit
    // add an insane amount of cars
    for (i = 0; i < 300; i++) {
      await target.addCar(true, 1, time + i);
    }

    return target.getCarsInGarage().then(function(cars) {
      expect(cars).to.be.equal(325);
    });
  });


  it('multiple cars at same time', async function() {
    time = target.getCurrentTime();

    // add cars
    for (i = 0; i < 25; i++) {
      await target.addCar(true, 1, time);

      await target.addCar(true, 1, time);
      await target.addCar(false, 1, time);
    }

    return target.getCarsInGarage().then(function(cars) {
      expect(cars).to.be.equal(25);
    });
  });

  it('many cars', async function() {
    time = target.getCurrentTime() - 2000;

    // add cars
    for (i = 0; i < 1000; i++) {
      await target.addCar(true, 1, time + (i * 2));
      await target.addCar(false, 1, time + (i * 2) + 1);
    }

    // might as well test throughput
    cars = await target.getCarThroughput(time, 2000);
    expect(cars).to.be.equal(1000);

    return target.getCarsInGarage().then(function(cars) {
      expect(cars).to.be.equal(0);
    });
  });

  it('current cars funtion handles points in time', async function() {
    time = target.getCurrentTime() - 2000;
    await target.addCar(true, 0, time);// one car at time
    await target.addCar(true, 0, time+100);// 2
    await target.addCar(true, 0, time+200);// 3
    await target.addCar(true, 0, time+300);// 4
    await target.addCar(false, 0, time+400);// 3
    await target.addCar(false, 0, time+500);// 2

    cars = await target.getCarsInGarage();
    expect(cars).to.be.equal(2);
    cars = await target.getCarsInGarage(false, time+201);
    expect(cars).to.be.equal(3);
    cars = await target.getCarsInGarage(false, time+301);
    expect(cars).to.be.equal(4);
    cars = await target.getCarsInGarage(false, time+401);
    expect(cars).to.be.equal(3);


    cars = await target.getCarsInGarage(false, time-1);
    expect(cars).to.be.equal(0);
    cars = await target.getCarsInGarage(false, time);
    expect(cars).to.be.equal(1);
  });

  it('offsets', async function() {
    time = target.getCurrentTime() - 2000;
    await target.addCar(true, 0, time);// one car at time
    await target.addCar(true, 0, time+100);// 2
    await target.addCar(true, 0, time+200);// 3
    await target.addCar(true, 0, time+300);// 4
    await target.addCar(false, 0, time+400);// 3

    // inital
    let cars = await target.getCarsInGarage(false, time+2000);
    expect(cars).to.be.equal(3);
    let through = await target.getCarThroughput(time, 2000);
    expect(through).to.be.equal(1);


    // positive offset
    await target.setCarsInGarage(4);
    cars = await target.getCarsInGarage(false, time+2000);
    expect(cars).to.be.equal(4);
    through = await target.getCarThroughput(time, 2000);
    expect(through).to.be.equal(1);

    // negitive offset
    await target.setCarsInGarage(2);
    cars = await target.getCarsInGarage(false, time+2000);
    expect(cars).to.be.equal(2);
    through = await target.getCarThroughput(time, 2000);
    expect(through).to.be.equal(1);

    // crazy offset
    await target.setCarsInGarage(200);
    cars = await target.getCarsInGarage(false, time+2000);
    expect(cars).to.be.equal(200);
    through = await target.getCarThroughput(time, 2000);
    expect(through).to.be.equal(1);
  });
});
