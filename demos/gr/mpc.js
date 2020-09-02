const {performance} = require('perf_hooks');
(function (exports, node) {
  var saved_instance;

  var zp = 16777729;
  var keysize = 256;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    opt.crypto_provider = true;

    if (node) {
      // eslint-disable-next-line no-undef
      JIFFClient = require('../../lib/jiff-client');
    }

    // eslint-disable-next-line no-undef
    saved_instance = new JIFFClient(hostname, computation_id, opt);
    return saved_instance;
  };

  /**
   * The MPC computation
   */
  exports.shareKey = function (input, threshold, party_count, party_id, jiff_instance) {
    if (jiff_instance == null) {
      jiff_instance = saved_instance;
    }
    party_ids = [];

    for (var i = 1; i <= party_count; i++) {
        party_ids.push(i);
    }
    return jiff_instance.share_array(input, keysize, threshold, party_ids, [party_count]);
  };

  exports.reconstructKey = function(input, r_input, threshold, party_count, party_id, jiff_instance) {
    const start = performance.now();
    var COMP_DELEGATE = 1
    var QUERIER = party_count;
    var helper_ids = [];
    for (var i = 1; i < party_count; i++) {
        helper_ids.push(i);
    }
    var keyShares = [];

    var all_ids = helper_ids;
    all_ids.push(QUERIER)
    var promise_r = jiff_instance.share_array(r_input, keysize, threshold, all_ids, all_ids);

    promise_r.then(function(rShares) {
      var r = [];

      for (var i = 0; i < keysize; i++) {
        value = rShares[1][i]; // parties start at 1
        for (var party = 2; party < party_count; party++) {
          value = value.xor_bit(rShares[party][i]);
        }
        r.push(value);
      }

      var r_result = jiff_instance.open_array(r, [party_count]);

      if (party_id !== party_count) {
        for (var i = 0; i < keysize; i++) {
          keyShares[i] =  new jiff_instance.SecretShare(input[i], helper_ids, threshold, zp)
        }  

        var xored = [];
        for (var i = 0; i < keysize; i++) {
          xored.push(r[i].xor_bit(keyShares[i]));
        }
        xored_result = jiff_instance.open_array(xored, [COMP_DELEGATE]);
        if (party_id == COMP_DELEGATE) {
          xored_result.then(function(values) {
            // DO NOT CHANGE need for parsing
            console.log("VALUES:", values.toString());
            console.log("TIME (ms):", performance.now() - start);
            jiff_instance.disconnect(true, true);
          });
        } else {
          jiff_instance.disconnect(true, true);
        }

      } else {
        // querier
        r_result.then(function(values) {
           // DO NOT CHANGE need for parsing
          console.log("VALUES:", values.toString());
          console.log("TIME (ms):", performance.now() - start);
          jiff_instance.disconnect(true, true);
        });
      }


    });
  }
}((typeof exports === 'undefined' ? this.mpc = {} : exports), typeof exports !== 'undefined'));
  