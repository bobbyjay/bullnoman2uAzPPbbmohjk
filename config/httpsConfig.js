const fs = require('fs');

function getHttpsOptions() {
  try {
    const key = fs.readFileSync('./certs/server.key');
    const cert = fs.readFileSync('./certs/server.cert');
    return { key, cert };
  } catch (err) {
    return null;
  }
}

module.exports = getHttpsOptions;
