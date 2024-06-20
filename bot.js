var HTTPS = require('https');
var DetermineResponse = require('./DetermineResponse');

BOT_ID = "6042e89f9b62dead1af8f52f45";
ACCESS_TOKEN = "qR76YsuejjMMdk6F893IcbMoAtlrTiv5xp3QrNsM";
GROUP_ID = "87334434";

function respond() {
  var request = JSON.stringify(this.req.chunks[0]);
  var BotResponse = DetermineResponse.BotResponse(request);

  if (BotResponse.length > 0) {
    this.res.writeHead(200);
    console.log(this.req.chunks[1]);
    //setTimeout(postMessage(BotResponse), 3000);
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function postMessage(BotResponse) {
  var options, body, botReq;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : 	BOT_ID,
    "text" : BotResponse
  };

  console.log('sending ' + BotResponse + ' to ' + BOT_ID);

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

exports.respond = respond;