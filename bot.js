var HTTPS = require('https');

BOT_ID = "6042e89f9b62dead1af8f52f45";
ACCESS_TOKEN = "qR76YsuejjMMdk6F893IcbMoAtlrTiv5xp3QrNsM";
GROUP_ID = "87334434";

function respond() {
  var request = JSON.stringify(this.req.chunks[0]);
  var total = count(request, 'posting up') + count (request, 'post up');

  if (total > 0) {
    this.res.writeHead(200);
    setTimeout(postMessage, 3000);
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function postMessage() {
  var botResponse, options, body, botReq;
  var rand = Math.random();

  botResponse = (rand < 0.05) ? "Don't say POSTING UP": "Don't say that";

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : 	BOT_ID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + BOT_ID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusMessage);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function count (str, find){
  return (str.toLowerCase().split(find).length) - 1;
}

exports.respond = respond;