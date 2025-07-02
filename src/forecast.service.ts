import { Injectable, Inject } from "@nestjs/common";
import { Database } from "sqlite3";

// const convCoefficient = 100;
// const batchesToTonsConv = (b: number) => Math.floor(b * convCoefficient);

@Injectable()
export class ForecastService {
  constructor(@Inject("DATABASE_CONNECTION") private db: Database) {}

  private processDataByMonth(rows: any[], grades: any[]) {
    const dataByMonth: { [key: string]: any } = {};

    rows.forEach((row) => {
      const yearMonthKey = `${row.year}-${String(row.month).padStart(2, "0")}`;
      if (!dataByMonth[yearMonthKey]) {
        dataByMonth[yearMonthKey] = {
          DateYearAndMonth: yearMonthKey,
          Forecast: "N",
        };
      }
    });

    grades.forEach((grade, i) => {
      const gradeRows = rows.filter((r) => r.grade === grade);
      const batchesByYearMonth: { [key: string]: number } = {};
      gradeRows.forEach((row) => {
        const yearMonthKey = `${row.year}-${String(row.month).padStart(2, "0")}`;
        batchesByYearMonth[yearMonthKey] = row.batches;
      });

      for (const yearMonthKey in dataByMonth) {
        dataByMonth[yearMonthKey][`Grade_${i}_${grade}`] =
          batchesByYearMonth[yearMonthKey] || 0;
      }
    });

    return dataByMonth;
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

  async getForecast(grades: string[]): Promise<any[]> {
    if (!grades || grades.length === 0) return [];

    const placeholders = grades.map(() => "?").join(",");
    const sql = `
      SELECT year, month, grade, batches
      FROM production_data
      WHERE grade IN (${placeholders})
      ORDER BY year, month
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, grades, (err, rows: any[]) => {
        if (err) return reject(err);
        if (rows.length === 0) return resolve([]);

        const dataByMonth = this.processDataByMonth(rows, grades);
        const result = this.forecastAndAppendToRows(Object.values(dataByMonth));
        resolve(result);
      });
    });
  }
}
