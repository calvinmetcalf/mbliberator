var tilelivestream = require('tilelivestreams');
var fs = require('fs');
var through = require('through2');
var mbtiles = require('mbtiles');
var mkdirp = require('mkdirp');

module.exports = function(inTile, outPath, mbutilMode, callback) {
  if (outPath.slice(-1) !== '/') {
    outPath = outPath + '/';
  }
  var infoName = typeof mbutilMode !== 'undefined' ? 'metadata.json' : "info.json";
  new mbtiles(inTile, function(err, tiles) {
    if (err) {
      return callback(err);
    }
    var tileStream = tilelivestream(tiles);
    mkdirp(outPath, function (err) {
      if (err) {
        return callback(err);
      }
      var writing = tileStream.pipe(through.obj(function (data, _, cb) {
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
                outdata = 'typeof '+ mbutilMode + " === 'function' && " + mbutilMode + '(' + JSON.stringify(data.grid) + ');';
              } else {
                outdata = JSON.stringify(data.grid);
              }
              options.encoding = 'utf8';
            }
            fs.writeFile(fullpath, outdata, options, cb);
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
