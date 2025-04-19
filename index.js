var bot, require, http, router, server, port;

http        = require('http');
director    = require('director');
bot         = require('./bot.js');


router = new director.http.Router({
  '/' : {
    post: bot.respond,
    get: ping
  }
});

server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

port = process.env.PORT;
server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Greetings, I'm Trollbot");
}