'use strict';

// A simple auto-fighter affects script

const ConnectorHandler = require('../lib/connectorHandler');

class AutoBattleHandler extends ConnectorHandler {


  get connectorEvents() {
    return ['battleStart', 'readlineServer'];
  }

  // do action, repeat if repeatOn(line) == true
  constructor(connector, action, repeatOn) {
    super(connector);
    this.action = action;
    this.repeatOn = repeatOn;
  }

  onReadlineServer(line) {
    if (this.repeatOn(line)) {
      this.connector.write(this.action);
    }
  }

  onBattleStart() {
    this.connector.write(this.action);
  }

}

module.exports = AutoBattleHandler;
