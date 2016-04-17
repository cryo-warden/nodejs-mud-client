'use strict';

// Auto-mermaid-killing script

let co = require('co');

let kill = "cleave mermaid";
let there = "w2n2wnw3nw5nen";
let walk = "nnneewwwsesses";
let back = "sw8sesessse";

let prepare = [
  'stance off',
  'stance off',
  'bers',
  'warc',
  'adren'
];

const SpeedWalk = require('../lib/speedwalk');


const ConnectorHandler = require('../lib/connectorHandler');

class MermaidsScript extends ConnectorHandler {

  get connectorEvents() {
    return ['readlineServer'];
  }

  enable() {
    super.enable();

    for (let p of prepare) {
      this.connector.write(p);
    }

    co(this.run()).catch(console.error);

  }

  disable() {
    super.disable();
    this.stopRun = true;
  }

  onReadlineServer(line) {
    // guard agains starvation/dehydration
    if (line.includes('starv') || line.includes('dehyd')) {
      this.connector.write('quit');
      this.connector.disconnect();
    }
  }

  goThere() {
    let walks = SpeedWalk.split(there);
    for (let walk of walks) this.connector.write(walk, true);
  }

  goBack() {
    let walks = SpeedWalk.split(back);
    for (let walk of walks) this.connector.write(walk, true);
  }

  *run() {

    let connector = this.connector;
    while (!this.stopRun) { // forever

      this.goThere();
      let walks = walk.split('');

      while (true) { // walk


        while (true) { // one kill
          connector.write(kill);

          // true if killed, false otherwise
          let hasMore = yield function(callback) {
            connector.once('readlineServer', function onLine(line) {
              // console.log("ONLINE", JSON.stringify(line));
              if (line.includes('DEAD!!')) {
                callback(null, true);
              } else if (line.includes('in half with a clean cut!')) {
                connector.write('get all corp');
                connector.write('sac corp');
                callback(null, true);
              } else if (line.includes("They aren't here.")) {
                callback(null, false);
              } else {
                connector.once('readlineServer', onLine);
              }
            });
          };

          if (!hasMore) break;
        }

        if (!walks.length) {
          break;
        }

        connector.write('band');
        connector.write(walks.shift());

      }

      this.goBack();

      connector.character.eat();
      connector.character.drink();

      yield function(callback) {
        setTimeout(callback, 3 * 60 * 1000 + 1000);
      };
    }

  }


}

module.exports = MermaidsScript;
