import { Injectable, Inject } from "@nestjs/common";
import { Database } from "sqlite3";
// import { ForecastDataDto } from "./dto/forecast-data.dto";

const convCoefficient = 100;
const batchesToTonsConv = (b: number) => Math.floor(b * convCoefficient);
//    tonsToBatchesConv = (b: number) => Math.floor(b / convCoefficient);

@Injectable()
export class ForecastService {
  constructor(@Inject("DATABASE_CONNECTION") private db: Database) {}

  private processRows(rows: any[], grade: any, i: any) {
    const key = "Grade_" + i + "_" + grade;
    const processedData: any[] = rows.map((row: any) => ({
      DateYearAndMonth: `${row.year}-${String(row.month).padStart(2, "0")}`,
      Forecast: "N",
      [key]: row.batches,
    }));

    if (rows.length > 0) return processedData;
    return [];
  }

  private forecastWithAverage(rows: any[], grade: string): number {
    const totalBatches = rows.reduce((acc, cur) => acc + (cur[grade] || 0), 0);
    const forecastBatches = Math.round(totalBatches / rows.length);
    return forecastBatches;
  }

  private forecastAndAppendToRows(rows: any[]) {
    if (rows.length === 0) return [];

    const firstRow = rows[0];
    const keys = Object.keys(firstRow).filter((k) => k.startsWith("Grade_"));

    if (keys.length === 0) return rows;

    const last = rows[rows.length - 1];
    const date = new Date(last.DateYearAndMonth);
    const newDate = new Date(date.setMonth(date.getMonth() + 1));
    const newDateY = newDate.getFullYear();
    const newDateM = newDate.getMonth();

    const forecastRow: { [key: string]: any } = {
      DateYearAndMonth: `${newDateY}-${String(newDateM + 1).padStart(2, "0")}`,
      Forecast: "Y",
    };

    for (const key of keys) {
      forecastRow[key] = this.forecastWithAverage(rows, key);
    }

    rows.push(forecastRow);
    return rows;
  }

  getForecast(grade: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
            year, month, batches
        FROM
            production_data
        WHERE
            grade = ?
        ORDER BY
            year, month
      `;
      this.db.all(sql, [grade], (err, rows: any[]) => {
        if (err) return reject(err);
        if (rows.length === 0) return resolve([]);

        const i = 0;
        const processedPr = this.processRows(rows, grade, i);
        const withForecast = this.forecastAndAppendToRows(processedPr);
        resolve(withForecast);
      });
    });
  }
}
