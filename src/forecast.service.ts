import { Injectable, Inject } from "@nestjs/common";
import { Database } from "sqlite3";
// import { ForecastDataDto } from "./dto/forecast-data.dto";

const convCoefficient = 100;
const batchesToTonsConv = (b: number) => Math.floor(b * convCoefficient);
const tonsToBatchesConv = (b: number) => Math.floor(b / convCoefficient);

@Injectable()
export class ForecastService {
  constructor(@Inject("DATABASE_CONNECTION") private db: Database) {}

  private processRows(rows: any[], grade: string) {
    const g = grade;
    const key = "SteelGrade_" + g;
    const processedData: any[] = rows.map((row: any) => ({
      DateYearAndMonth: `${row.year}-${String(row.month).padStart(2, "0")}`,
      Forecast: "N",
      // Grade: grade,
      [key]: row.batches,
      // Tons: batchesToTonsConv(row.batches),
    }));

    if (rows.length > 0) {
      const lastMonth = rows[rows.length - 1];
      const nextMonth = new Date(lastMonth.year, lastMonth.month, 1);
      nextMonth.setMonth(nextMonth.getMonth());
      return processedData;
    }
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

        const processedData = this.processRows(rows, grade);

        console.log(Object.entries(processedData));
        resolve(processedData);
      });
    });
  }
}
