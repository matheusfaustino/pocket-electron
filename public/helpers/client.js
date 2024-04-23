import Axios from 'axios'

export default class Client {

  /**
   * Sets initial variable e configs
   */
  constructor() {
    this.client = Axios.create({
      baseURL: 'https://getpocket.com/v3/',
      timeout: 10000
    });

    this.client.defaults.headers.post['X-Accept'] = 'application/json';
    this.token = this.consumerKey = '';

    let _this = this;
    this.client.interceptors.request.use(function(config) {
      config.data.access_token = _this.token;
      config.data.consumer_key = _this.consumerKey;
      console.log("token", _this.token);

      return config;
    });
  }

  /**
   * Set access token for request
   * @param {string} token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set consumer key for request
   * @param {string} consumer_key
   */
  setConsumerKey(consumer_key) {
    this.consumerKey = consumer_key;
  }

  /**
   * To debug the request
   * @param  {Axios.Response} error
   */
  fullError(error) {
    if (error.response) {
      // The request was made, but the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log(error.config);
  }

  /**
   * Get the list of itens
   * @param  {Object} userOptions Object with options following API schema
   * @return {Axios.Response}
   */
  getItens(userOptions) {
    if (userOptions && typeof userOptions !== 'object') {
      return Promise.reject(new Error('You must pass an array'));
    }

    /* @task: move the count to config */
    let defaultOptions = {
      offset: 0,
      count: 24,
      detailType: 'complete',
      sort: 'newest'
    };

    let options = Object.assign({}, defaultOptions, userOptions);

    return this.client.post('/get', options);
  }

  modifyItem(action, id, params) {
    if (!action || !id) {
      return Promise.reject(new Error('You must provide modification action and item id'));
    }

    let defaultOptions = {
      action: action,
      item_id: id
    };

    let options = Object.assign({}, defaultOptions, params);

    return this.client.post('/send', {
      actions: [options]
    });
  }

  saveItem(userOptions) {
    if (userOptions && typeof userOptions !== 'object')
      return Promise.reject(new Error('You must pass an array'));

    if (!userOptions.url)
      return Promise.reject(new Error('You must provide at least an URL'));

    return this.client.post('/add', userOptions);
  }

  removeItem(id) {
    if (!id) {
      return Promise.reject(new Error('You must provide item id'));
    }

    return this.modifyItem('delete', id);
  }
}
