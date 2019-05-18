// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/*
const dotenv = require('dotenv');
const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error('⚠️  Couldn\'t find .env file  ⚠️');
}
*/

// the default settings
module.exports = {
  env: process.env.NODE_ENV,
  databaseStorageLocation: '/parallel/database',

  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10) || 3000,
  totalSpots: 212,
  nodes: {
    2: {
      name: 'Test 2',
    },
    3: {
      name: 'Test 3',
    },
    4: {
      name: 'Test 4',
    },
    5: {
      name: 'Test 5',
    },
    6: {
      name: 'Test 6',
    },
  },
};
