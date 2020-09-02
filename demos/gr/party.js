const fs = require('fs');
var crypto = require('crypto');
const {performance} = require('perf_hooks');


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
  var input = process.argv[2];

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

  var threshold = 3;
  var keysize = 256;
  // JIFF options
  
  var options = {party_count: party_count, party_id: party_id};
  options.onConnect = function (jiff_instance) {

    if (isShare == 'share') {
      const start = performance.now()
      let binaryString = input;
        var input_arr = [];
        for (var i = 0; i < binaryString.length; i++) {
            input_arr[i] = parseInt(binaryString[i]);
        }
        var promise = mpc.shareKey(input_arr, threshold, party_count, party_id, jiff_instance);
    
        if (party_id !== party_count) {
          promise.then(function (v) {
            var keyholder = party_count.toString();
  
            var values = [];
            var promises = [];
            for (var i = 0; i < keysize; i++) {
              promises.push(v[keyholder][i].value);
            }
  
            Promise.all(promises).then((values) => {
              console.log("TIME (ms): ", performance.now()-start)
              fs.writeFile('demos/gr/shares' + party_id.toString() + '.txt', JSON.stringify(values), function(err) {
                if (err) {
                    console.log('error', err);
                }
                jiff_instance.disconnect(true, true);
              });
            });
          });
        } else {
          jiff_instance.disconnect(true, true);
        }
    } else if (isShare == 'reconstruct') {
      if (party_id != party_count) {
        fs.readFile('demos/gr/shares' + party_id + '.txt', function (err,data) {
          if (err) {
            console.log(err);
          }

          var r_arr = []
          for (var i = 0; i < input.length; i++) {
            r_arr[i] = parseInt(input[i]);
          }

          var share_arr = JSON.parse(data.toString());
          mpc.reconstructKey(share_arr, r_arr, threshold, party_count, party_id, jiff_instance);
        });
      } else {
        var r_arr = []
        for (var i = 0; i < input.length; i++) {
          r_arr[i] = parseInt(input[i]);
        }
        // console.log("Reconstruct",  r_arr, threshold, party_count, party_id,)
        mpc.reconstructKey([], r_arr, threshold, party_count, party_id, jiff_instance);
      }
    }
 };

  
 // Connect
mpc.connect("http://localhost:8083" , computation_id, options);

 // mpc.connect("http://3.131.169.43" , computation_id, options);
  