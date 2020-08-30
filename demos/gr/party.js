const fs = require('fs');
var crypto = require('crypto');


function hexStrToBinaryStr(hex){
  var binString = "";
  for (var i = 0; i < hex.length/2; i++) {
    var substr = (parseInt(hex[i], 16).toString(2)).padStart(8, '0');
    binString += substr;
  }
  return binString;
}

function toHexString(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
  return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}



process.on('uncaughtException', function (err) {
    console.log('Uncaught Exception!');
    console.log(err);
    throw err;
  });
  process.on('unhandledRejection', function (reason) {
    console.log('Unhandled Rejection', reason);
  });
  
  /**
   * Do not change this unless you have to.
   * This code parses input command line arguments,
   * and calls the appropriate initialization and MPC protocol from ./mpc.js
   */
  
  console.log('Command line arguments: <input> [<party count> [<computation_id> [<party id>]]]]');
  
  var mpc = require('./mpc');
  
  // Read Command line arguments
  var input =process.argv[2];

  var party_count = process.argv[3];
  if (party_count == null) {
    party_count = 2;
  } else {
    party_count = parseInt(party_count);
  }
  
  var computation_id = process.argv[4];
  if (computation_id == null) {
    computation_id = 'test';
  }
  
  var party_id = process.argv[5];
  if (party_id != null) {
    party_id = parseInt(party_id, 10);
  }

  var isShare = process.argv[6];
  if (isShare == null) {
      return;
  }

  

  var threshold = 2;
  var keysize = 256;
  // JIFF options
  var options = {party_count: party_count, party_id: party_id};
  options.onConnect = function (jiff_instance) {
    if (isShare == 'share') {


        var binaryString = hexStrToBinaryStr(input);
        var input_arr = [];
        for (var i = 0; i < binaryString.length; i++) {
            input_arr[i] = parseInt(binaryString[i]);
        }
        console.log('input', binaryString, input_arr);
        var promise = mpc.shareKey(input_arr, threshold, party_count, party_id, jiff_instance);
    
        promise.then(function (v) {
            console.log(v)

          var keyholder = party_count.toString();

          var values = [];
          var promises = [];
          for (var i = 0; i < keysize; i++) {
            promises.push(v[keyholder][i].value);
          }

          Promise.all(promises).then((values) => {
            console.log(values)
            fs.writeFile('demos/gr/shares' + party_id.toString() + '.txt', JSON.stringify(values), function(err) {
              if (err) {
                  console.log('error', err);
              }
              jiff_instance.disconnect(true, true);
            });
          });
      });
    } else if (isShare == 'reconstruct') {
      fs.readFile('demos/gr/shares' + party_id + '.txt', function (err,data) {
        if (err) {
          console.log(err);
        }
        var input_arr = JSON.parse(data.toString());
        var r_input = [];

        if (party_id == party_count) {
          r_input = new Uint8Array(crypto.randomBytes(32));
        }

        var r = hexStrToBinaryStr(toHexString(r_input))


        var r_arr = []
        for (var i = 0; i < r.length; i++) {
          r_arr[i] = parseInt(r[i]);
        }
        mpc.reconstructKey(input_arr, r_arr, threshold, party_count, party_id, jiff_instance);
      });
    }
 };

  
  // Connect
  mpc.connect('http://localhost:8080', computation_id, options);
  