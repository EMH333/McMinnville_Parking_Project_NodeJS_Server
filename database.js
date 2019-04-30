const path = require('path');
const Db = require('tingodb')().Db;
const db = new Db(path.join(__dirname, 'db'), {});

const MAKE_CHECKPOINT_AT = 30; // events per checkpoint
const MAX_CHECKPOINT_AGE = 1 * 60 * 60; // in seconds

// var EPOCH = new Date("01-Jan-1970");//Not needed b/c of epoch change
let collection;
let eventsBeforeCheckpoint = MAKE_CHECKPOINT_AT; // number of cars in and out, used to create checkpoints

initDatabaseAndListeners(db); // make sure everything is initalized

/**
 * Initalizes database and the listeners
 * @param {*} database
 */
function initDatabaseAndListeners(database) {
  if (collection == null) {
    console.log('Initalized database and listeners');
  }
  collection = database.collection('traffic');
  // getCarsInGarage().then(cars => console.log("There are "+ cars + " cars in the garage right now"));
  // TODO implement serial from feather listeners
}

/**
 * @return {Number} time since epoch
 */
function getCurrentTime() {
  // returns in seconds. the system outputs data using minutes (preliminary 15 minute intervals)
  return Math.round((Date.now()) / 1000);
}

/**
 *
 * @param {Number} minutes number of minutes in the past
 * @return {Number} the time since epoch x minutes ago
 */
function getEpochXMinutesAgo(minutes) {
  return getCurrentTime() - getXMinutesInEpoch(minutes);
}

/**
 * Returns the duration of time in epoch
 * @param {Number} minutes
 * @return {Number} epoch 'ticks' of x minutes
 */
function getXMinutesInEpoch(minutes) {
  return (minutes * 60);
}


/*
    TODO FIXME
    left to implement:
    -per exit statistics
    -car 'events' in timeframe
    -in vs out differences
*/

/*
Data model:
{
    id: #auto,
    time: time from January 1st 1970 00:00. THIS IS DIFFERENT BECAUSE THIS WILL SIMPLIFY THINGS
    type: "entry", "exit", "checkpoint" or "log"

    for entry and exit:
        location: #corasponds to the enterance or exit used
    for checkpoint:
        totalCars: #total number of cars at that point in time
    for log:
        message: #string message
}

checkpoint data which contains current number of cars in garage at that time
A checkpoint is created every 20? or so events and isn't necececarly up to date and doesn't need to be
as the system automaticly goes from each checkpoint and ignores old ones.
Querys for info should ignore totally as they should all be relative
The only query that can use these is cars in the garage at a point in time which should use them to be faster
*/

// TODO don't allow car to be added at time previous to last checkpoint
/**
 * adds a car to the garage
 * @param {boolean} isEntry
 * @param {number} location
 * @param {number} time Time since EPOCH
 */
async function addCar(isEntry, location, time) {
  if (isEntry) {
    collection.insert({
      'time': time,
      'type': 'entry',
      'location': location,
    });
  } else {
    collection.insert({
      'time': time,
      'type': 'exit',
      'location': location,
    });
  }

  // only create checkpoints when a car enters
  if (eventsBeforeCheckpoint <= 0 && isEntry) {
    // find checkpoints at the current time created previously
    const previousCheckpointAtTime = await new Promise((resolve) => {
      collection.find({
        type: 'checkpoint',
        time: time,
      }).count(false, function(error, num) {
        resolve(num);
      });
    });

    // if a checkpoint with this time exists, then don't create a new one
    if (previousCheckpointAtTime < 0) {
      const totalCars = await getCarsInGarage(true);
      collection.insert({
        'time': time, // created at same time as car to make sure database stays consistant
        'type': 'checkpoint',
        'totalCars': totalCars,
      });
      // console.log("Making checkpoint with " + totalCars + " cars");
    }
    eventsBeforeCheckpoint = MAKE_CHECKPOINT_AT;
  }
  eventsBeforeCheckpoint--;
}

/**
 * @param {boolean} ignoreCheckpoints when true the database counts from scratch
 * @return {number}
 */
async function getCarsInGarage(ignoreCheckpoints) {
  let checkpoint = {
    time: 0,
    totalCars: 0,
  };
    // if ignoring checkpoints, create a dummy checkpoint
  if (ignoreCheckpoints) {
    checkpoint = {
      time: 0,
      totalCars: 0,
    };
  } else {
    checkpoint = await new Promise((resolve) => {
      // get checkpoint that is relitivly current to insure any errors don't remain too long
      collection.find({
        type: 'checkpoint',
        time: {
          $gte: getCurrentTime() - MAX_CHECKPOINT_AGE,
        },
      }, {
        'sort': [
          ['time', 'desc'],
        ],
      }).nextObject(function(err, doc) {
        if (doc != null) {
          // console.log("using check with " + doc.totalCars + " cars")
          resolve(doc);
        } else {
          // create a false checkpoint and tell system to create a new one
          eventsBeforeCheckpoint = 0;
          resolve({
            time: 0,
            totalCars: 0,
          });
        }
      });
    }); // gets checkpoint info
  }

  let carsIn = await new Promise((resolve) => {
    collection.find({
      type: 'entry',
      time: {
        $gte: checkpoint.time,
      },
    }).count(false, function(error, num) {
      resolve(num);
    });
  }); // cars in resolves to the number of cars that went into the garage
  const carsOut = await new Promise((resolve) => {
    collection.find({
      type: 'exit',
      time: {
        $gte: checkpoint.time,
      },
    }).count(false, function(error, num) {
      resolve(num);
    });
  }); // resolves to the number of cars that have exited the garage

  // we can assume we are using a checkpoint and thus should subtract one car from total
  // this prevents problems when multiple cars enter at the time a checkpoint is created
  if (checkpoint.time > 0) {
    carsIn--;
  }

  return checkpoint.totalCars + (carsIn - carsOut);
}

/**
 * How many cars come both in and out of the parking garage each hour
 * (sucessfull parking experiances)
 *
 * @param {number} startTime the start time in seconds from EPOCH to start from
 * @param {number} offset the offset from the start time to go to, startTime+offset should not exceed current time
 * @return {number} number of cars that went both in and out during that time
 */
async function getCarThroughput(startTime, offset) {
  // can't exist
  if (startTime >= getCurrentTime() || startTime < 0 || offset < 0) {
    return new Promise((resolve) => resolve(-1)); // TODO change this to actually fail
  }

  if (startTime + offset > getCurrentTime()) {
    offset = getCurrentTime - startTime;
  }

  const carsIn = await new Promise((resolve) => {
    collection.find({
      type: 'entry',
      time: {
        $gte: startTime,
        $lte: startTime + offset,
      },
    }).count(false, function(error, num) {
      resolve(num);
    });
  });

  const carsOut = await new Promise((resolve) => {
    collection.find({
      type: 'exit',
      time: {
        $gte: startTime,
        $lte: startTime + offset,
      },
    }).count(false, function(error, num) {
      resolve(num);
    });
  });

  const extraCars = carsIn - carsOut;
  return carsIn - extraCars;
}

module.exports = {
  addCar,
  getCarsInGarage,
  initDatabaseAndListeners,
  getCurrentTime,
  getEpochXMinutesAgo,
  getXMinutesInEpoch,
  getCarThroughput,
};
