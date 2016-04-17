'use strict';

// Auto-eat/drink

let eat = [
  "You are hungry.",
  "You are famished!"
];

let drink = [
  "You are thirsty.",
  "Your mouth is parched!",
  "You are beginning to dehydrate!"
];

const ConnectorHandler = require('../lib/connectorHandler');

class AutoEatTriggers extends ConnectorHandler {


  get connectorEvents() {
    return ['readlineServer'];
  }

  onReadlineServer(line) {

    let connector = this.connector;

    if (eat.indexOf(line) != -1) {
      connector.character.eat();
    }

    if (drink.indexOf(line) != -1) {
      connector.character.drink();
    }

  }


}

module.exports = AutoEatTriggers;

