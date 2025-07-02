const parse = require('csv-parse/lib/sync');

function parseCsv(data) {
  return parse(data, {
    columns: header => header.map(col => col.trim()),
    skip_empty_lines: true,
    cast: value => value.trim()
  });
}

module.exports = { parseCsv };
