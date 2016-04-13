'use strict';

// #10 do smth -> 10 times do smth

module.exports = function(connector) {
  connector.on('command', function (command, args) {
    let count = +command;
    if (!count) return;

    for (let i = 0; i < count; i++) {
      connector.write(args);
    }
  });
};
