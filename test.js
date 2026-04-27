const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/seller/dashboard',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data.length > 0 ? "Server is responding" : "No response");
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
