'use strict';

const config = require('./config');
const Connector = require('./connector');
const Character = require('./character');
const out = require('./out');


let connector = new Connector();
connector.connect(config);

let character = new Character(connector);

// #off disables all actions 
connector.on('command', function(cmd, args) {
  if (cmd == 'off') {
    connector.readlineServerDisabled = true;
  }
});

// Autorepeat command:
// #10 say Boo!
require('./autorepeat')(connector);

require('./autoeat')(connector);
require('./autoprac')(connector);

// A simple autofighting script
connector.on('readlineServer', function(line) {
  if (line.includes("Kef's backstab")) {
    connector.write("resc kef");
    connector.write("resc kef");
    connector.write("resc kef");
    connector.write("dirt");
  }
});
