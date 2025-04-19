var HTTPS = require('https');
var bot_response = require('./make_response.js');

async function respond() {
  var request = JSON.parse(this.req.chunks[0]);
  console.log("=======================");
  console.log("Receiving message " + request.text);
  var response = await bot_response.response(request);

  if (response.answer){
    console.log("I will respond");
    this.res.writeHead(200);
    setTimeout(function(){
      postMessage(response.text, response.attach_url);
    }, 3000);
    this.res.end();
  } else {
    console.log("Not responding");
    this.res.writeHead(200);
    this.res.end();
  } 
  console.log("=======================\r\n");
}

function postMessage(text, attach_url) {
  var options, body, botReq;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : 	process.env.BOT_ID,
    "text" : text,
    "attachments" : [
      {
        "type"  : "image",
        "url"   : attach_url
      }
    ]
  };


  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
  
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