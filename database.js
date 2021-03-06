let config = require('./config');
const time = require('./webDev/shared/time.js');
const Db = require('tingodb')().Db;
const db = new Db(config.databaseStorageLocation, {});
let raspi;
let Serial;
let Gpio;
let buffer; // buffer used for serial communication
let gettingData = false;

let offset = -333;


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

  // only run this on the raspberry pi
  if (config.env === 'production') {
    raspi = require('raspi');
    Serial = require('raspi-serial').Serial;
    Gpio = require('onoff').Gpio;

    if (!Gpio.accessible) {
      throw new Error('GPIO ERROR');
    }

    raspi.init(() => {
      const serial = new Serial({
        portId: '/dev/serial0',
        dataBits: 7,
      });
      // eslint-disable-next-line prefer-const
      let output = new Gpio(17, 'out'); // raw pin 17 also known as GPIO0 //see https://pinout.xyz
      output.writeSync(0); // turn off to begin
      serial.open(() => {
        serial.on('data', (data) => {
          // process.stdout.write(data);
          buffer += data;
          if (buffer.indexOf('DATA.') !== -1) {
            buffer = '';
            serial.flush();
            output.writeSync(1);
            gettingData = true;
            process.stdout.write('Trying to get data\n');
          }
          if (gettingData && buffer.length == 13) {
            output.writeSync(0);
            const process = buffer;
            console.log('Got car going direction ' + process[0] + ' from node ' + process[2]);

            // actually add car to database
            if (process[0] === '1') {
              addCar(true, parseInt(process[2]), time.getCurrentTime());
            } else {
              addCar(false, parseInt(process[2]), time.getCurrentTime());
            }
            gettingData = false;
          }
        });
      });
    });
  }
}

/**
 * @deprecated
 * @return {Number} time since epoch
 */
function getCurrentTime() {
  // returns in seconds. the system outputs data using minutes (preliminary 15 minute intervals)
  return Math.round((Date.now()) / 1000);
}

/**
 *@deprecated
 * @param {Number} minutes number of minutes in the past
 * @return {Number} the time since epoch x minutes ago
 */
function getEpochXMinutesAgo(minutes) {
  return getCurrentTime() - getXMinutesInEpoch(minutes);
}

/**
 * Returns the duration of time in epoch
 * @deprecated
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
    type: "entry", "exit", "checkpoint", "offset" or "log"

    for entry and exit:
        location: #corasponds to the enterance or exit used
    for checkpoint:
        totalCars: #total number of cars at that point in time
    for log:
        message: #string message
    for offset:
        offset: #number of cars to offset by for all measurements. Designed to help set how many cars are in garage
        # at one point in time
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
    const previousCheckpointAtTime = await makeQuery('checkpoint', time, '');

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
 * updates the number of cars currently in the garage
 * @param {Number} num
 */
async function setCarsInGarage(num) {
  await loadOffset();
  const total = parseInt(num);
  const off = total + offset - await getCarsInGarage();
  offset = off;
  collection.insert({
    'time': time.getCurrentTime(),
    'type': 'offset',
    'offset': off,
  });
}

/**
 * @param {boolean} ignoreCheckpoints when true the database counts from scratch
 * @param {number} pointInTime used to set the point in time to find the cars in the garage, is optional
 * @return {number}
 */
async function getCarsInGarage(ignoreCheckpoints, pointInTime) {
  if (!pointInTime) {
    pointInTime = time.getCurrentTime();
  }
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
          $gte: pointInTime - MAX_CHECKPOINT_AGE,
          $lte: pointInTime,
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

  let carsIn = await makeQuery('entry', {
    $gte: checkpoint.time,
    $lte: pointInTime,
  }, null); // cars in resolves to the number of cars that went into the garage
  const carsOut = await makeQuery('exit', {
    $gte: checkpoint.time,
    $lte: pointInTime,
  }, null); // resolves to the number of cars that have exited the garage

  // we can assume we are using a checkpoint and thus should subtract one car from total
  // this prevents problems when multiple cars enter at the time a checkpoint is created
  if (checkpoint.time > 0) {
    carsIn--;
  }

  await loadOffset();

  return checkpoint.totalCars + (carsIn - carsOut) + offset;
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
  if (startTime >= time.getCurrentTime() || startTime < 0 || offset < 0) {
    return -1;
  }

  if (startTime + offset > time.getCurrentTime()) {
    offset = time.getCurrentTime() - startTime;
  }

  const carsIn = await makeQuery('entry', {
    $gte: startTime,
    $lte: startTime + offset,
  }, null);

  const carsOut = await makeQuery('exit', {
    $gte: startTime,
    $lte: startTime + offset,
  }, null);

  const extraCars = carsIn - carsOut;
  return carsIn - extraCars;
}


/**
 * returns how many cars used this enterance/exit in the set timeframe
 * @param {Number} startTime the start time in seconds from EPOCH to start from
 * @param {Number} offset the offset from the start time to go to, startTime+offset should not exceed current time
 * @param {Number} exitNumber what exit to find stats for
 * @param {Number} option 0 = cars in, 1 = cars out, 2 = total cars
 */
async function getCarsUsingExit(startTime, offset, exitNumber, option) {
  let ret = -1;

  // sanity checking for start and offset times
  if (startTime >= time.getCurrentTime() || startTime < 0 || offset < 0) {
    return -1;
  }
  if (startTime + offset > time.getCurrentTime()) {
    offset = time.getCurrentTime() - startTime;
  }

  // confirm node exists
  if (exitNumber < 0 || exitNumber > config.nodes.length) {
    return -1;
  }
  switch (option) {
    // cars in
    case 0:
      ret = await makeQuery('entry', {
        $gte: startTime,
        $lte: startTime + offset,
      }, exitNumber);
      break;

      // cars out
    case 1:
      ret = await makeQuery('exit', {
        $gte: startTime,
        $lte: startTime + offset,
      }, exitNumber);
      break;


      // total cars
    case 2:
      ret = await makeQuery(null, {
        $gte: startTime,
        $lte: startTime + offset,
      }, exitNumber);
      break;

    default:
      break;
  }
  return ret;
}

/**
 *
 * @param {*} c the configuration object
 */
function setConfig(c) {
  config = c;
}

/**
 * Makes query to database and returns number of results
 * @param {*} type
 * @param {*} time
 * @param {Number} location
 * @return {Promise} promise for answer to query
 */
function makeQuery(type, time, location) {
  // a non typed query with location
  if (type === null) {
    return new Promise((resolve) => {
      collection.find({
        time: time,
        location: location,
      }).count(false, function(error, num) {
        resolve(num);
      });
    });
  }

  // non location query
  if (location === null) {
    return new Promise((resolve) => {
      collection.find({
        type: type,
        time: time,
      }).count(false, function(error, num) {
        resolve(num);
      });
    });
  }

  // default query
  return new Promise((resolve) => {
    collection.find({
      type: type,
      time: time,
      location: location,
    }).count(false, function(error, num) {
      resolve(num);
    });
  });
}

/**
 * Loads the offset from memory if needed
 */
async function loadOffset() {
  // if offset is default value, get offset or just set it to zero
  if (offset === -333) {
    offset = await new Promise((resolve) => {
      // get checkpoint that is relitivly current to insure any errors don't remain too long
      collection.find({
        type: 'offset',
      }, {
        'sort': [
          ['time', 'desc'],
        ],
      }).nextObject(function(err, doc) {
        if (doc != null) {
          // if offset exists, deal with it
          resolve(doc.offset);
        } else {
          // create a false offset of zero and deal with it
          resolve(0);
        }
      });
    });
  }
}

module.exports = {
  addCar,
  getCarsInGarage,
  initDatabaseAndListeners,
  getCurrentTime,
  getEpochXMinutesAgo,
  getXMinutesInEpoch,
  getCarThroughput,
  getCarsUsingExit,
  setConfig,
  setCarsInGarage,
};
