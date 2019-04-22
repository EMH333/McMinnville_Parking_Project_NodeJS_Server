var dotenv = require("dotenv")
// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {

  // This error should crash whole process

  throw new Error('⚠️  Couldn\'t find .env file  ⚠️')
}

//the default settings
module.exports = {
  /**
   * Your favorite port
   */
port: parseInt(process.env.PORT,10) || 3000,

numberOfNodes: parseInt(process.env.NUM_OF_NODES) || 5
}