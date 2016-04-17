'use strict';

const ConnectorHandler = require('./connectorHandler');

// speedwalk 13wn4w4s5wdd
class SpeedWalk extends ConnectorHandler {

  get connectorEvents() {
    return ['readlineClient'];
  }

  onReadlineClient(line, result) {
    if (line.match(/^[0-9neswud]+$/)) {
      result.handled = true;
      let walks = this.constructor.split(line);
      for (let i = 0; i < walks.length; i++) {
        this.connector.write(walks[i], true);
      }
    }
  }

  static split(speedwalk) {
    let items = [];
    let walks = speedwalk.match(/\d*[neswud]/g);

    for (let i = 0; i < walks.length; i++) {
      let walk = walks[i]; // 13w
      let direction = walk[walk.length - 1];
      let count = parseInt(walk) || 1;
      for (let j = 0; j < count; j++) {
        items.push(direction);
      }
    }

    return items;
  }

}


module.exports = SpeedWalk;
