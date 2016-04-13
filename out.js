'use strict';

const chalk = require('chalk');
module.exports = function(color, line) {
    process.stdout.write(chalk[color](line + "\n"));
};