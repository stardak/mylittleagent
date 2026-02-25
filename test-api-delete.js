const http = require('http');

const id = 'cm7k7j7w0000abcde'; // dummy, it doesn't matter, we want to see the status code
const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/campaigns/${id}`,
  method: 'DELETE',
  headers: {
    // We need cookies to be authenticated as the user!
  }
};
