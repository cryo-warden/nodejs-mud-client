'use strict';

// This example ticker triggers every 60 sec to warn about the coming tick.
// MUD may have a random amount of seconds per tick, then it's useless

const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('ticker');
const out = require('./out');

// tick tracker can be initialized by one of these phrases
let triggerPhrases = [
  'The day has begun.',
  "The sun rises in the east.",
  "The sun slowly disappears in the west.",
  "The night has begun.",
  "The sky is getting cloudy.",
  "The clouds disappear",
  "Lightning flashes in the sky.",
  "The rain stopped.",
  "The lightning has stopped.",
  "You are hungry.",
  "You are famished!",
  "You are thirsty.",
  "Your mouth is parched!",
  "You are beginning to dehydrate!",
  "You shiver and suffer.",
  "The red glow of Lunitari rises over the horizon.",
  "The dim red haze of Lunitari rises into the night sky.",
  "The dim red haze of Lunitari dissapears from the night sky.",
  "The blood-red glow of Lunitari fades below the horizon.",
  "The silvery light of Solinari fades from the sky.",
  "Chiming bells ring through the streets as midnight passes.",
  "Lunitari's blood-red crescent shape disappears below the horizon.",
  "The silver light of Solinari's full moon fades into the horizon."
];

class Ticker extends EventEmitter {
  constructor(connector) {
    super();
    this.connector = connector;
    this.onReadlineServer = this.onReadlineServer.bind(this);
    this.onReadlineClient = this.onReadlineClient.bind(this);
    this.enable();
  }

  enable() {
    this.connector.on('readlineServer', this.onReadlineServer);
    this.connector.on('readlineClient', this.onReadlineClient);
  }

  disable() {
    this.connector.removeEventListener('readlineServer', this.onReadlineServer);
    this.connector.removeEventListener('readlineClient', this.onReadlineClient);

    clearTimeout(this.tickTimer);
    clearTimeout(this.beforeTickTimer);
    this.tickTimer = this.beforeTickTimer = null;
  }

  onReadlineClient(line, result) {
    if (line == '#tick') {
      result.handled = true;
      this.tick();
    }
  }

  tick() {

    out('gray', 'TICKER ENABLED');
    clearTimeout(this.tickTimer);
    clearTimeout(this.beforeTickTimer);

    let self = this;
    this.beforeTickTimer = setTimeout(function beforeTick() {
      self.emit('beforeTick');
      self.beforeTickTimer = setTimeout(beforeTick, 60e3);
    }, 50e3);
    this.tickTimer = setTimeout(function tick() {
      self.emit('tick');
      self.tickTimer = setTimeout(tick, 60e3);
    }, 60e3);
  }

  onReadlineServer(line) {
    console.log("---", JSON.stringify(line), triggerPhrases.indexOf(line) );
    if (triggerPhrases.indexOf(line) != -1) {
      this.tick();
    }

  }
}

module.exports = Ticker;
