var path = require("path");
var Db = require('tingodb')().Db;
var db = new Db(path.join(__dirname, 'db'), {});

initDatabaseAndListeners(db);


var collection;
function initDatabaseAndListeners(database) {
    console.log("Initalized database and listeners");
    collection = database.collection("traffic");
    //getCarsInGarage().then(cars => console.log("There are "+ cars + " cars in the garage right now"));
    //TODO implement serial from feather listeners 
}

/*
Data model:
{
    id: #auto,
    time: time from January 1st 2019 00:00. THIS MAY CHANGE IF WE MOVE EPOCH TO MATCH LINUX
    type: "entry", "exit", "checkpoint" or "log"
    
    for entry and exit:
        location: #corasponds to the enterance or exit used
    for checkpoint:
        total: #total number of cars at that point in time
    for log:
        message: #string message
}

checkpoint data which contains current number of cars in garage at that time
A checkpoint is created every 20? or so events and isn't necececarly up to date and doesn't need to be
as the system automaticly goes from each checkpoint and ignores old ones. Querys for info should ignore totally as they should all be relative
The only query that can use these is cars in the garage at a point in time which should use them to be faster
*/

/**
 * adds a car to the garage
 * @param {boolean} isEntry 
 * @param {number} location 
 * @param {number} time Time since EPOCH
 */
function addCar(isEntry, location, time) {
    if (isEntry) {
        collection.insert({
            "time": time,
            "type": "entry",
            "location": location
        })
    } else {
        collection.insert({
            "time": time,
            "type": "exit",
            "location": location
        })
    }
}

/**
 * @returns {Promise<number>}
 */
async function getCarsInGarage() {
    carsIn = new Promise(resolve => {
        collection.find({
            type: "entry"
        }).count(false, function (error, num) { resolve(num) });
      });//cars in resolves to the number of cars that went into the garage
      carsOut = new Promise(resolve => {
        out = 0;
        collection.find({
            type: "exit"
        }).count(false, function (error, num) { resolve(num) });
      });//resolves to the number of cars that have exited the garage
    /*carsIn = collection.find({
        "type": "entry"
    }).count();
    carsOut = collection.find({
        "type": "exit"
    }).count();*/
   
    return carsIn.then(function(cIn){
        return carsOut.then(function (cOut) { return cIn - cOut; })
    });
}

module.exports = {
    addCar,
    getCarsInGarage,
    initDatabaseAndListeners
};