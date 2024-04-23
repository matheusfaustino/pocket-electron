'use strict';

class CookieElectron {

  constructor() {
    this.session = require('electron').session;
    let serverClass = require('./Server.js');
    let server = new serverClass();
    // improve it
    this.url = server.url;
    // @todo put a dynamic date
    this.expirationDate = new Date();
    this.expirationDate.setFullYear(this.expirationDate.getFullYear() + 1);
  }

  setCookie(name, value) {
    let options = {
      url : this.url,
      name: name,
      value: value,
      expirationDate: Math.floor(this.expirationDate.getTime()/1000) // unix timestamp (seconds)
    };

    this.session.defaultSession.cookies.set(options, function(error) {
      if (error)
        console.error(error);
    });
  }

  getCookie(name, callback) {
    this.session.defaultSession.cookies.get({name: name}, function(error, cookies) {
      callback(error, cookies);
    });
  }

  clearCookies(callback) {
    var functionRemoveCookie = this.removeCookie;
    var sessionUseFunction = this.session;
    this.session.defaultSession.cookies.get({}, function(error, cookies) {
      if (error)
        throw error;

      if(cookies) {
        for (let cookie of cookies) {
          let url = 'http' + (cookie.httpOnly ? '' : 's') + '://' + cookie.domain +cookie.path;
          sessionUseFunction.defaultSession.cookies.remove(url, cookie.name, function(error){
            if (error)
              console.error(error);
          });
        }
        // its not really a callback, but cleaning multiples cookies, it's impossible to have just one callback
        callback();
      }
    });
  }
}

module.exports = CookieElectron;
