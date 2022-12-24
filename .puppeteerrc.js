const path = require('path');
const fs = require('fs');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: __dirname
  // Changes the location of the Chromium executable.
};