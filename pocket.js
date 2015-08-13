var request = require('request');

//module.exports = function() {
//  this.body = function() {
//    request('http://google.com', function(error, response, body) {
//      return response.body;
      //if (!error && response.statusCode == 200) {
      //  return body;
      //}
      //return response;
    //})
  //}
//}

exports.terminal = function(msg) {
  console.log('dentro do terminal');
  request('http://google.com', function(error, response, body) {
    console.log(!error && response.statusCode == 200);
    if (!error && response.statusCode == 200) {
      console.log('dentro do if');
      //console.log(body);
      return 'terminal';
    }
    //return response;
  })
};
