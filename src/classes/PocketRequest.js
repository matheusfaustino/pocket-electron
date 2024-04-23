'use strict';

class PocketRequest {
  constructor(pocketAuth) {
    let pocketApiUrlClass = require('./PocketApiUrl.js');
    let cookieElectronClass = require('./CookieElectron.js');

    this.request = require('request');
    this.pocketApiUrl = new pocketApiUrlClass();
    this.cookieElectron = new cookieElectronClass();

    this.pocketAuth = pocketAuth;
  }

  getItems(optionsApi, callback) {
    var pocketApiUrl = this.pocketApiUrl;
    var pocketAuth = this.pocketAuth;
    var request = this.request;
    var cookieElectron = this.cookieElectron;

    cookieElectron.getCookie('last_request', function(error_last_request, cookies_last_request) {
      // getting the unix timestamp of the last request
      var last_request = '';
      if (cookies_last_request.length) {
        last_request = cookies_last_request[0].value;
      }

      cookieElectron.getCookie('access_token', function(error, cookies) {
        let access_token = '';
        if (cookies.length) {
          access_token = cookies[0].value;
        } else { throw 'access_token'; }

        let options = {
          url: pocketApiUrl.getRetrieve(),
          formData: {
            access_token: access_token,
            consumer_key: pocketAuth.consumerKey,
            count: optionsApi.count,
            detailType: 'complete',
            sort: 'newest',
            offset: optionsApi.offset
          },
          headers: {'X-Accept': 'application/json'}
        };

        // sets the timestamp of the last request if it exists
        // just do it when it has the since flag
        if (last_request.length && optionsApi.since) {
          options.formData.since = last_request;
        }

        if (optionsApi.search.length) {
          options.formData.search = optionsApi.search;
        }

        // makes request
        request.post(options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            let bodyJSON = JSON.parse(body);

            // sets last_request
            let now = Math.floor((new Date()).getTime()/1000);
            // it should be passed like string, otherwise it is not going to be saved
            cookieElectron.setCookie('last_request', now.toString());

            callback(bodyJSON);
          } else {
            console.log(response.statusCode);
            console.log(response.headers['x-error']);
            console.log(response.headers['x-error-code']);
          }
        });
      });
    });
  }

  saveItem(optionsApi, callback) {
    var pocketApiUrl = this.pocketApiUrl;
    var pocketAuth = this.pocketAuth;
    var request = this.request;

    this.cookieElectron.getCookie('access_token', function(error, cookies) {
      let access_token = '';
      if (cookies.length) {
        access_token = cookies[0].value;
      } else { throw 'access_token'; }

      let options = {
        url: pocketApiUrl.getAdd(),
        formData: {
          access_token: access_token,
          consumer_key: pocketAuth.consumerKey,
          url: optionsApi.url,
          title: optionsApi.title ? optionsApi.title : '',
          tags: optionsApi.tags ? optionsApi.tags : ''
        },
        headers: {'X-Accept': 'application/json'}
      };

      request.post(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          let bodyJSON = JSON.parse(body);

          callback(bodyJSON);
        } else {
          console.log(response.statusCode);
          console.log(response.headers['x-error']);
          console.log(response.headers['x-error-code']);
        }
      });
    });
  }

  modifyItem(optionsApi, callback) {
    if (!optionsApi.action) {
      throw 'You must pass an action';
    }

    if (!optionsApi.item_id) {
      throw 'You must pass an item id';
    }

    var pocketApiUrl = this.pocketApiUrl;
    var pocketAuth = this.pocketAuth;
    var request = this.request;

    this.cookieElectron.getCookie('access_token', function(error, cookies) {
      let access_token = '';
      if (cookies.length) {
        access_token = cookies[0].value;
      } else { throw 'access_token'; }

      let options = {
        url: pocketApiUrl.getModify(),
        formData: {
          access_token: access_token,
          consumer_key: pocketAuth.consumerKey,
          actions: [{
            item_id: optionsApi.item_id,
            action: optionsApi.action
          }]
        },
        headers: {'X-Accept': 'application/json'}
      };

      // @todo tag requests are different
      if ('tags_replace' == optionsApi.action) {
        options.formData.actions[0].tags = optionsApi.tags;
      }

      // sending JSON
      options.formData.actions = JSON.stringify(options.formData.actions);
      console.log(options.formData);

      request.post(options, function(error, response, body) {
        console.log(error);
        if (!error && response.statusCode == 200) {
          let bodyJSON = JSON.parse(body);

          callback(bodyJSON);
        } else {
          console.log(response.statusCode);
          console.log(response.headers['x-error']);
          console.log(response.headers['x-error-code']);
        }
      });
    });
  }
}

module.exports = PocketRequest;

