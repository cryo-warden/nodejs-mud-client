'use strict';

// notify on interaction

const notifier = require('node-notifier');


const ConnectorHandler = require('../lib/connectorHandler');

class InteractionNotifier extends ConnectorHandler {



  get connectorEvents() {
    return ['readlineServer'];
  }

  onReadlineServer(line) {
    if (line.match(/^\w+ tells the group, /)
      || line.match(/^\w+ tells you, /)
      || line.match(/^\w+ (roars|says), /)
      || line.match(/looks at/)
    ) {
      notifier.notify({
        message: line,
        sound: true
      });
    }
  }

}

module.exports = InteractionNotifier;

