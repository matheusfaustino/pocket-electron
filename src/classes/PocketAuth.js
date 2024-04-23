'use strict';

class PocketAuth {
  constructor(consumerKey) {
    let pocketApiUrlClass = require('./PocketApiUrl.js');

    this.request = require('request');
    this.pocketApiUrl = new pocketApiUrlClass();
    this.consumerKey = consumerKey;
    this.requestToken = '';
  }

  getRequestToken(redirect_uri, callback) {
    if(redirect_uri.length == 0) {
      throw 'Redirect not passed';
    }

    var options = {
      url: this.pocketApiUrl.getRequestToken(),
      formData: {
        consumer_key: this.consumerKey,
        redirect_uri: redirect_uri
      },
      headers: {'X-Accept': 'application/json'}
    };

    this.request.post(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let bodyJSON = JSON.parse(body);
        this.requestToken = bodyJSON.code;
        callback(this.requestToken);
      } else {
        console.error(response.statusCode);
        console.error(response.headers['x-error']);
        console.error(response.headers['x-error-code']);
      }
    });
  }

  getPocketAcess(callback) {
    var options = {
      url: this.pocketApiUrl.getPocketAccess(),
      formData: {
        code: this.requestToken,
        consumer_key: this.consumerKey
      },
      headers: {'X-Accept': 'application/json'}
    };

    let localCookieElectron = this.cookieElectron;
    this.request.post(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var bodyJSON = JSON.parse(body);

        callback(bodyJSON.access_token, bodyJSON.username);
      } else {
        console.log(response.statusCode);
        console.log(response.headers['x-error']);
        console.log(response.headers['x-error-code']);
      }
    });
  }

}

module.exports = PocketAuth;
