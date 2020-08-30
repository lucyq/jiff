
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
    var recipient_party = 1
    var party_ids = [];
    for (var i = 1; i < party_count; i++) {
        party_ids.push(i);
    }
    var keyShares = [];

    for (var i = 0; i < keysize; i++) {
      keyShares[i] =  new jiff_instance.SecretShare(input[i], party_ids, threshold, zp)
    }

    var p = jiff_instance.share_array(r_input, keysize, threshold, party_ids, [party_count]);

    if (party_id !== party_count) {
      p.then(function(rShares) {
        var xored = [];
        for (var i = 0; i < keysize; i++) {
          xored.push(rShares[party_count][i].xor_bit(keyShares[i]));
        }
        p = jiff_instance.open_array(xored, [recipient_party]);
        if (party_id == recipient_party) {
          p.then(function(values) {
            console.log("VALUES", JSON.stringify(values));
            jiff_instance.disconnect(true, true);
          });
        } else {
          jiff_instance.disconnect(true, true);
        }
      });
    } else {
      jiff_instance.disconnect(true, true);
    }
  }
}((typeof exports === 'undefined' ? this.mpc = {} : exports), typeof exports !== 'undefined'));
  