var tilelivestream = require('tilelivestream');
var fs = require('fs');
var es = require('event-stream');
var mbtiles = require('mbtiles');
var mkdirp = require('mkdirp');

module.exports = function(inTile, outPath, max, callback) {
  if (outPath[0] !== '/') {
    outPath = outPath + '/';
  }
  var current = 0;

  new mbtiles('inTile', function(err, tiles) {
    if (err) {
      return callback(err);
    }
    var tileStream = tilelivestream(tiles);
    mkdirp(outPath, function (err) {
      if (err) {
        return callback(err);
      }
      var writing = tileStream.pipe(es.map(function (data, cb) {
        current++;
        if (current>=max) {
          tileStream.pause();
        }
        var path;
        if (data.tile || data.grid) {
          path = outPath + data.z + '/' + data.x + '/';
          mkdirp(path, function (err) {
            if (err) {
              return cb(err);
            }
            var fullpath, outdata;
            if (data.tile) {
              fullpath = path+data.y+'.png';
              outdata = date.tile;
            } else if (data.grid) {
              fullpath = path+data.y+".grid.json";
              outdata = JSON.stringify(data.grid); 
            }
            fs.writeFile(fullpath, outdata, function (err) {
              if (err) {
                return cb(err);
              }
              curent--;
              if (current<max) {
                tileStream.resume();
              }
            });
          });
        } if (data.name) {
          fs.writeFile(outPath+"info.json", JSON.stringify(data), {encoding: 'utf8'}, cb);
        }
      });
      writing.on('error', callback);
      writing.on('end', function() {
        callback();
      });
    });
  });
}