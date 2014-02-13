var tilelivestream = require('tilelivestreams');
var fs = require('fs');
var es = require('event-stream');
var mbtiles = require('mbtiles');
var mkdirp = require('mkdirp');

module.exports = function(inTile, outPath, max, mbutilMode, callback) {
  if (outPath[0] !== '/') {
    outPath = outPath + '/';
  }
  var infoName = typeof mbutilMode !== 'undefined' ? 'metadata.json' : "info.json";
  max = parseInt(max, 10);
  var current = 0;
  new mbtiles(inTile, function(err, tiles) {
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
        if (current >= max) {
          tileStream.pause();
        }
        var path, outData;
        if (data.tile || data.grid) {
          path = outPath + data.z + '/' + data.x + '/';
          mkdirp(path, function (err) {
            if (err) {
              return cb(err);
            }
            var fullpath, outdata, options = {};
            if (data.tile) {
              fullpath = path + data.y + '.png';
              outdata = data.tile;
            } else if (data.grid) {
              fullpath = path + data.y + ".grid.json";
               if (mbutilMode) {
                outdata = 'typeof '+ mbutilMode + " === 'function' && " + mbutilMode + '(' + JSON.stringify(data) + ');';
              } else {
                outdata = JSON.stringify(data);
              }
              options.encoding = 'utf8';
            }
            fs.writeFile(fullpath, outdata, options, function (err) {
              if (err) {
                return cb(err);
              }
              current--;
              if (current<max) {
                tileStream.resume();
              }
            });
          });
        } else if (data.name) {
          fs.writeFile(outPath + infoName, JSON.stringify(data), {encoding: 'utf8'}, cb);
        }
      }));
      writing.on('error', callback);
      writing.on('end', function() {
        callback();
      });
    });
  });
};