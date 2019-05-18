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
  nodes: [
    {
      id: 2,
      name: 'Test 2',
    },
    {
      id: 0,
      name: 'Test 0',
    },
    {
      id: 1,
      name: 'Test 1',
    },
    /*
    {
      id: 3,
      name: 'Actual',
    },
    {
      id: 4,
      name: 'Actual',
    },
    {
      id: 5,
      name: 'Actual',
    },
    {
      id: 6,
      name: 'Actual',
    },
    */
  ],
};
