'use strict';

class Server {
  constructor() {
    this.http = require('http');
    // @todo improve it
    this.port = 8000;
    this.url = 'http://localhost:' + this.port;
    this.server = '';
  }

  createServer(callback) {
    if (this.server.length != 0) {
      throw 'Server already created.';
    }

    this.server = this.http.createServer(function(request, response) {
      callback(request, response);
    });

    this.server.listen(8000);
    console.log('Server is listening');
  }

  shutdown() {
    this.server.close();
  }
}

module.exports = Server;
