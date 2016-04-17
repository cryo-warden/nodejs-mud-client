'use strict';

let food = 'wafer';
let water = 'gourd';
let store = 'kna';

class Character {

  constructor(connector) {
    connector.character = this;
    this.connector = connector;
    this.stats = {};

    connector.on('prompt', prompt => {
      this.updateStats(prompt);
    });

    this.connector.on('readlineServer', line => {
      line = line.replace(/^<.*?>\s+/, '');
      if (line.startsWith('You go to sleep')) {
        this.state = this.SLEEPING;
      }
      if (line == "You rest.") {
        this.state = this.RESTING;
      }
      if (line.startsWith('You wake and stand') || line == "You stand up.") {
        this.state = this.STANDING;
      }
    })

  }

  updateStats(stats) {
    // console.log(stats);
    this.stats = stats;
    if (stats.battle && this.state != this.BATTLE) {
      this.state = this.BATTLE;
      // console.log("BATTLE START");
      this.connector.emit('battleStart', stats.battle);
    }

    if (!stats.battle && this.state == this.BATTLE) {
      this.state = this.STANDING;

      // console.log("BATTLE FINISH");
      this.connector.emit('battleFinish');
    }

    this.connector.emit('stats', stats);
  }

  // can be improved to track current character state to wake up/sleep
  eat() {
    let connector = this.connector;

    this.connector.write("wake");
    this.connector.write(`get ${food} ${store}`);
    this.connector.write(`eat ${food}`);


    // if too full in 5 seconds then put back
    connector.on('readlineServer', checkFull);

    setTimeout(() => {
      connector.removeListener('readlineServer', checkFull)
    }, 15000);

    function checkFull(line) {
      if (line.includes('You are too full to eat more.')) {
        connector.removeListener('readlineServer', checkFull);
        connector.write(`put ${food} ${store}`);
      }
    }

  }

  drink() {

    this.connector.write("wake");
    this.connector.write(`drink ${water}`);

    // if empty in 5 seconds then get new
    this.connector.on('readlineServer', checkEmpty);

    setTimeout(() => {
      this.connector.removeListener('readlineServer', checkEmpty)
    }, 15000);

    let connector = this.connector;
    function checkEmpty(line) {
      if (line.includes('It is already empty.')) {
        connector.removeListener('readlineServer', checkEmpty)
        connector.write(`drop ${water}`);
        connector.write(`sac ${water}`);
        connector.write(`get ${water} ${store}`);
        connector.write(`drink ${water}`);
      }
    }

  }
}
Character.prototype.STANDING = 1;
Character.prototype.RESTING = 2;
Character.prototype.SLEEPING = 3;
Character.prototype.BATTLE = 4;

module.exports = Character;
