'use strict';

/**
 * Pocket API
 */
class PocketApiUrl {
  constructor() {
    this.baseUrl = 'https://getpocket.com/v3/';
  }

  getRequestToken() {
    return this.baseUrl + 'oauth/request';
  }

  getPocketAccess() {
    return this.baseUrl + 'oauth/authorize';
  }

  getAuthorize(requestToken, redirectUri) {
    return 'https://getpocket.com/auth/authorize?request_token='+ requestToken +'&redirect_uri='+ redirectUri;
  }

  getRetrieve() {
    return this.baseUrl + 'get';
  }

  getAdd() {
    return this.baseUrl + 'add';
  }

  getModify() {
    return this.baseUrl + 'send';
  }
}

module.exports = PocketApiUrl;
