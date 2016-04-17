'use strict';

const net = require('net');
const readline = require('readline');
const TelnetInput = require('telnet-stream').TelnetInput;
const TelnetOutput = require('telnet-stream').TelnetOutput;
const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('connector');
const through2 = require('through2');
const chalk = require('chalk');
const path = require('path');

/**
 * events:
 *  readlineServer - a line from server
 *  readlineClient - a line from client
 *  data - anything from a server
 */
class Connector extends EventEmitter {

  constructor() {
    super();
    this.handlers = {};
  }

  // connect to MUD via Telnet
  connect(config) {

    const telnetInput = this.telnetInput = new TelnetInput();
    const telnetOutput = this.telnetOutput = new TelnetOutput();

    this.socket = net.createConnection(config.port, config.host)
      .setKeepAlive(true)
      .setNoDelay(true);

    this.socket.pipe(telnetInput);
    telnetOutput.pipe(this.socket);

    this.socket.on('close', () => {
      this.socket.unpipe(telnetInput);
      telnetOutput.unpipe(this.socket);
      this.readlineServer.close();
      this.readlineClient.close();
    });

    this.readlineClient = readline.createInterface({
      input: process.stdin,
      output: process.stdout // need that for history and special keys to work
    });

    this.readlineClient.setPrompt('');

    telnetInput.on('data', data => this.emit('dataServer', data));

    /*
    // add \n to prompt unless it exists already or a battleprompt
    const promptNewLineStream = through2(function(chunk, enc, callback) {
      chunk = chunk.toString('utf-8');
      chunk = chunk.replace(/([\n\r]|^)<.*?>(?!\n)(?! \[)/g, '$&\n');
      // console.log("CHUNK", JSON.stringify(chunk));
      callback(null, chunk);
    });
    telnetInput.pipe(promptNewLineStream);

     */

    telnetInput.pipe(through2(function(chunk, enc, callback) {
      // remove ending newline from the prompt to show more nicely
      chunk = chunk.toString('utf-8');
      chunk = chunk.replace(/((?:[\n\r]|^)<.*?>)\n\r?/g, '$1 ');
      callback(null, chunk);
    })).pipe(process.stdout);

    this.readlineServer = readline.createInterface({
      input: telnetInput
    });

    this.readlineServer.resume();
    this.readlineServer.on('line', line => {

      if (this.readlineServerDisabled) return;

      line = chalk.stripColor(line.trim());

      // prompt <%h/%Hhp %m/%Mmana %v/%Vmv | %e>%c
      // battleprompt <%h/%Hhp %m/%Mmana %v/%Vmv | %e> [%n]: %t     [%N]: %T%c

      // console.log("LINE", JSON.stringify(line));

      if (this.processServerPrompt(line)) return;

      // otherwise
      this.emit('readlineServer', line);

      debug("<--", line);
    });


    this.readlineClient.prompt(true); // no reset cursor position @ prompt

    this.readlineClient.on('line', line => {
      line = line.trim();
      let result = {};

      debug("-->", line);

      this.processClientInput(line);

      this.readlineClient.prompt(true);
    });
  }


  processClientInput(line) {
    // no nested { } supported

    // #cmd {arg1;smth} {arg2}
    if (line[0] == '#') {
      let command = line.slice(1);
      let commandName = command.split(' ')[0];
      command = command.slice(commandName.length).trim(); // {arg1;smth} {arg2}

      let args = [];

      while (true) {
        let count = args.length;
        command = command.trim();
        if (!command) break;
        command = command.replace(/\{(.*?)\}|([a-zA-Z0-9-_\/.\\]+)/, function(match, bracketed, bare) {
          args.push(bracketed || bare);
          return '';
        });

        if (args.length == count) {
          // no new args found
          this.showError("Command fail to parse command: " + line);
          return;
        }
      }

      this.emit('command', commandName, args);
      return;
    }


    // a; b; c
    let parts = line.split(';');

    for (let i = 0; i < parts.length; i++) {
      let part = parts[i].trim();

      let result = {};
      this.emit('readlineClient', part, result);
      if (!result.handled) {
        this.write(part, true);
      }

    }


  }

  // process server line, try to see if it's a prompt
  // @returns true if it was a prompt
  processServerPrompt(line) {

    let reg = /(?:^|[\r\n])<(-?\d+)\/(-?\d+)hp (-?\d+)\/(-?\d+)mana (-?\d+)\/(-?\d+)mv \|([ a-zA-Z!]*)>(?: \[(.*?)\]: (.*?)\[(.*?)\]: (.*?)(?:$|[\r\n]))?/g;

    let prompt, match;

    while ((match = reg.exec(line)) !== null) {
      // look for last stats
      prompt = match;
    }

    if (!prompt) return false;

    prompt = {
      hp:          +prompt[1],
      hpMax:       +prompt[2],
      hpPercent:   prompt[1] / prompt[2],
      mana:        +prompt[3],
      manaMax:     +prompt[4],
      manaPercent: prompt[3] / prompt[4],
      mv:          +prompt[5],
      mvMax:       +prompt[6],
      mvPercent:   prompt[5] / prompt[6],
      exits:       prompt[7].trim(),
      battle:      prompt[8] ? {
        attacker:       prompt[8].trim(),
        attackerHealth: prompt[9].trim(),
        target:         prompt[10].trim(),
        targetHealth:   prompt[11].trim()
      } : null
    };

    this.emit('prompt', prompt);

    return true;
  }

  // Send something to MUD
  write(line, quiet) {
    if (!quiet) {
      // show to user
      // speedwalk doesn't do that
      this.show(line);
    }
    this.telnetOutput.write(line + '\n')
  }

  show(line) {
    process.stdout.write(line + '\n');
  }

  showError(line) {
    this.show(chalk.red("#" + line));
  }

  loadHandler(scriptPath) {
    scriptPath = path.resolve(scriptPath);
    delete require.cache[scriptPath];
    let HandlerClass = require(scriptPath);
    if (this.handlers[scriptPath]) {
      this.handlers[scriptPath].disable();
    }
    this.handlers[scriptPath] = new HandlerClass(this);
    this.handlers[scriptPath].enable();
    this.show("#Loaded " + scriptPath);
  }

  unloadHandler(scriptPath) {
    scriptPath = path.resolve(scriptPath);
    if (!this.handlers[scriptPath]) {
      this.showError("Not loaded " + scriptPath);
    } else {
      this.handlers[scriptPath].disable();
      delete this.handlers[scriptPath];

      this.show("#Unloaded " + scriptPath);
    }

  }

  disconnect() {
    this.socket.end();
  }

}

module.exports = Connector;
