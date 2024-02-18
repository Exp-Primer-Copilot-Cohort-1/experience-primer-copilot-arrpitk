// Create web server
var http = require('http'); 
var fs = require('fs');
var url = require('url');
var path = require('path');
var comments = require('./comments');
var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css"
};
var server = http.createServer(function(req, res) {
  var uri = url.parse(req.url).pathname;
  var filename = path.join(process.cwd(), uri);
  fs.exists(filename, function(exists) {
    if(!exists) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      return;
    }
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }
      var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
      res.writeHead(200, {"Content-Type": mimeType});
      res.write(file, "binary");
      res.end();
    });
  });
});
var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket) {
  comments.getComments(function(data) {
    socket.emit('load', data);
  });
  socket.on('send', function(data) {
    comments.addComment(data, function() {
      io.sockets.emit('load', data);
    });
  });
});
server.listen(8080);
console.log("Server running at http://localhost:8080/");
// Path: comments.js
// Create comments module
var fs = require('fs');
var comments = [];
exports.getComments = function(callback) {
  fs.readFile('comments.txt', function(err, data) {
    if(err) throw err;
    comments = JSON.parse(data);
    callback(comments);
  });
};
exports.addComment = function(comment, callback) {
  comments.push(comment);
  fs.writeFile('comments.txt', JSON.stringify(comments), function(err) {
    if(err) throw err;
    callback();
  });
};

