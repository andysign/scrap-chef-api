import * as parse from "csv-parse/lib/sync";

export function parseCsv(data: string): any[] {
  return parse(data, {
    columns: (header) => header.map((col) => col.trim()),
    skip_empty_lines: true,
    cast: (value) => value.trim(),
  });
}
