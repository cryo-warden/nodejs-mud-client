'use strict';

const config = require('./config');
const Connector = require('./connector');
const Character = require('./character');

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

//connector.loadHandler('./commands/repeat');

// require('./autoeat')(connector);
// require('./autoprac')(connector);

connector.loadHandler('./lib/speedwalk');
connector.loadHandler('./commands/back');
connector.loadHandler('./commands/repeat');
connector.loadHandler('./commands/load');
connector.loadHandler('./commands/unload');
connector.loadHandler('./triggers/fighter');
connector.loadHandler('./triggers/pincer');
connector.loadHandler('./notifiers/interaction');


