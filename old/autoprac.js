'use strict';

// A simple auto-recasting script

let action = "c slow self";

let prepare = [
  'wake',
  'get ale kna',
  'drink ale',
  'drink ale',
  'drink ale',
  'drink ale',
  'drop ale',
  'sac ale'
];

let prac = [
  'c cancell self',
  'c "dispel magic" self',
  'c sanc',
  'c astral',
  'c "faerie fire" self',
  'c spellturn'
];

module.exports = function(connector) {
  // guard agains starvation/dehydration
  connector.on('readlineServer', function(line) {
    if (line.includes('starv') || line.includes('dehyd')) {
      connector.write('quit');
    }
  });

  connector.character.on('stats', function cast(stats) {
    if (stats.manaPercent > 0.9) {
      connector.character.removeListener('stats', cast);
      for (let i = 0; i < prepare.length; i++) {
        let cmd = prepare[i];
        connector.write(cmd);
      }
      let loops = 5;
      for (let l = 0; l < loops; l++) {
        for (let i = 0; i < prac.length; i++) {
          let cmd = prac[i];
          connector.write(cmd);
        }
      }
      connector.write('sleep rug');
      connector.write('sleep');

      connector.on('readlineServer', function reset(line) {
        line = line.replace(/^<.*?>\s+/, '');

        if (line.startsWith('You go to sleep')) {
          connector.character.on('stats', cast);
          connector.removeListener('readlineServer', reset);
        }
      });
    }

  });

  // renew prompt
  setInterval(function() {
    connector.write('');
  }, 10e3);

};
