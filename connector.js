'use strict';

const net = require('net');
const readline = require('readline');
const TelnetInput = require('telnet-stream').TelnetInput;
const TelnetOutput = require('telnet-stream').TelnetOutput;
const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('connector');
const through2 = require('through2');
const chalk = require('chalk');

/**
 * events:
 *  readlineServer - a line from server
 *  readlineClient - a line from client
 *  data - anything from a server
 */
class Connector extends EventEmitter {

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
      input: process.stdin
    });

    telnetInput.on('data', data => this.emit('dataServer', data));

    // prompt becomes a separate line always
    const promptNewLineStream = through2(function (chunk, enc, callback) {
      chunk = chunk.toString('utf-8').replace(/(\n|^)<.*?>/g, '$&\n');
      callback(null, chunk);
    });
    telnetInput.pipe(promptNewLineStream);

    telnetInput.pipe(process.stdout);

    this.readlineServer = readline.createInterface({
      input: promptNewLineStream
    });

    this.readlineServer.resume();
    this.readlineServer.on('line', line => {
      if (this.readlineServerDisabled) return;

      this.emit('readlineServer', chalk.stripColor(line.trim()));
      if (line.match(/(\n|^)<.*?>/g)) {
        this.emit('prompt');
      }


      debug("<--", line);
    });


    this.readlineClient.prompt();

    this.readlineClient.on('line', line => {
      let result = {};

      if (line[0] == '#') {
        let cmd = line.slice(1).split(' ');
        this.emit('command', cmd[0], cmd.slice(1).join(' ').trim());
      } else {
        this.emit('readlineClient', line, result);
        debug("-->", line);
        if (!result.handled) {
          telnetOutput.write(line + "\n");
        }
      }

      this.readlineClient.prompt();
    });
  }

  // Send something to MUD
  write(line) {
    process.stdout.write(line + '\n');
    this.telnetOutput.write(line + '\n')
  }


  disconnect() {
    this.socket.end();
  }

}

module.exports = Connector;
