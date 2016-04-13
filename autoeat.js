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

module.exports = function(connector) {

  connector.on('readlineServer', function (line) {
    if (eat.indexOf(line) != -1) {
      connector.character.eat();
    }

    if (drink.indexOf(line) != -1) {
      connector.character.drink();
    }
  });
  
};
