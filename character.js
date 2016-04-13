'use strict';

const EventEmitter = require('events').EventEmitter;

let food = 'wafer';
let water = 'gourd';

class Character extends EventEmitter {

  constructor(connector) {
    super();
    connector.character = this;
    this.connector = connector;
    this.stats = {};

    // prompt <%h/%Hhp %m/%Mmana %v/%Vmv | %e>
    // battleprompt <%h/%Hhp %m/%Mmana %v/%Vmv %Xtnl | %e>%c< T: %n TC: %t   E: %N EC: %T >%c< >
    connector.on('readlineServer', (line) => {
      let reg = /(?:^|\n)<(-?\d+)\/(-?\d+)hp (-?\d+)\/(-?\d+)mana (-?\d+)\/(-?\d+)mv/g;
      let stats, match;

      while ((match = reg.exec(line)) !== null) {
        // look for last stats
        stats = match;
      }

      if (!stats) return;


      stats = {
        hp: +stats[1],
        hpMax: +stats[2],
        hpPercent: stats[1] / stats[2],
        mana: +stats[3],
        manaMax: +stats[4],
        manaPercent: stats[3] / stats[4],
        mv: +stats[5],
        mvMax: +stats[6],
        mvPercent: stats[5] / stats[6]
      };

      this.updateStats(stats);

    });
  }

  updateStats(stats) {
    this.stats = stats;
  }

  // can be improved to track current character state to wake up/sleep
  eat() {
    this.connector.write("wake");
    this.connector.write(`get ${food} kna`);
    this.connector.write(`eat ${food}`);
  }

  drink() {
    this.connector.write("wake");
    this.connector.write(`drink ${water}`);
  }
}

module.exports = Character;
