const expect = require('chai').expect;
const target = require('../database'); // the actual database we are testing

describe('per car in database', function() {
  it('simple test', async function() {
    await target.addCar(true, 0, target.getEpochXMinutesAgo(5));
    await target.addCar(true, 1, target.getEpochXMinutesAgo(5));
    await target.addCar(true, 2, target.getEpochXMinutesAgo(5));
    let cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 0, 2);
    expect(cars).to.be.equal(1);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 1, 2);
    expect(cars).to.be.equal(1);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 2, 2);
    expect(cars).to.be.equal(1);

    await target.addCar(false, 0, target.getEpochXMinutesAgo(4));
    await target.addCar(false, 1, target.getEpochXMinutesAgo(4));
    await target.addCar(false, 2, target.getEpochXMinutesAgo(4));
    // total
    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 0, 2);
    expect(cars).to.be.equal(2);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 1, 2);
    expect(cars).to.be.equal(2);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 2, 2);
    expect(cars).to.be.equal(2);

    // in
    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 0, 0);
    expect(cars).to.be.equal(1);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 1, 0);
    expect(cars).to.be.equal(1);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 2, 0);
    expect(cars).to.be.equal(1);

    // out
    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 0, 1);
    expect(cars).to.be.equal(1);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 1, 1);
    expect(cars).to.be.equal(1);

    cars = await target.getCarsUsingExit(target.getEpochXMinutesAgo(6), target.getXMinutesInEpoch(6), 2, 1);
    expect(cars).to.be.equal(1);
  });
});
