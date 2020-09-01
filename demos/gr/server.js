var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var JIFFServer = require('../../lib/jiff-server');
new JIFFServer(http, { logs:true });


const remote = process.argv[2];

var port = 8083;

if (remote == "remote") {
  port = 80;
}

// Serve static files.
app.use('/demos', express.static(path.join(__dirname, '..', '..', 'demos')));
app.use('/dist', express.static(path.join(__dirname, '..', '..', 'dist')));
app.use('/lib/ext', express.static(path.join(__dirname, '..', '..', 'lib', 'ext')));
http.listen(port, function () {
  console.log('listening on *:', port);
});