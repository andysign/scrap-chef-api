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
      // Grade: grade,
      [key]: row.batches,
    }));

    if (rows.length > 0) {
      return processedData;
    }
    return [];
  }

  private forecastAndAppendToRows(rows: any, k: any) {
    if (rows.length === 0) return [];
    const key = k;
    const forecastBatches = Math.round(
      rows.reduce((acc: any, cur: any) => acc + cur[key], 0) / rows.length,
    );
    const last = rows[rows.length - 1];
    const date = new Date(last.DateYearAndMonth);
    const newDate = new Date(date.setMonth(date.getMonth() + 1));
    rows.push({
      DateYearAndMonth: `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`,
      Forecast: "Y",
      [key]: forecastBatches,
    });
    return rows;
  }

  getForecast(grade: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
            year,
            month,
            batches
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
        resolve(processedPr);
      });
    });
  }
}
