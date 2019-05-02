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

/**
 * @return {Number} the epoch value at the start of the day
 */
function getTodaysEpoch() {
  const day = new Date();
  day.setHours(0);
  day.setMinutes(0);
  return Math.round(day.getTime()/1000);
}

module.exports = {
  getCurrentTime,
  getEpochXMinutesAgo,
  getXMinutesInEpoch,
  getTodaysEpoch,
};
