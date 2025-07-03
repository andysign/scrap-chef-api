import { Injectable, Inject } from "@nestjs/common";
import { Database } from "sqlite3";

const convFactor = 100;

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

  // private forecastWithAverage(rows: any[], grade: string): number {
  //   const totalBatches = rows.reduce((acc, cur) => acc + (cur[grade] || 0), 0);
  //   const forecastBatches = Math.round(totalBatches / rows.length);
  //   return forecastBatches;
  // }

  private simpleMovingAverage(vals: number[], periods: number): number | null {
    if (vals.length < periods) return null;
    const sum = vals.slice(-periods).reduce((a, v) => a + v, 0);
    return sum / periods;
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
      const values = rows.map((r) => r[key]);
      const sma = this.simpleMovingAverage(values, values.length);
      forecastRow[key] = sma !== null ? Math.round(sma) : 0;
    }

    rows.push(forecastRow);

    rows.forEach((row) => {
      for (const key of keys) {
        row[key] = `${row[key]} (${row[key] * convFactor} Tons)`;
      }
    });

    return rows;
  }

  getForecastAllGrades(): Promise<any[]> {
    const sql = `SELECT DISTINCT grade FROM production_data`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows: any[]) => {
        if (err) return reject(err);
        const grades = rows?.map(({ grade }) => grade);

        if (!grades || grades.length === 0) resolve([]);

        const placeholders = grades?.map(() => "?").join(",");
        const sql = `
          SELECT year, month, grade, batches
          FROM production_data
          WHERE grade IN (${placeholders})
          ORDER BY year, month
        `;

        this.db.all(sql, grades, (err, rows: any[]) => {
          if (err) return reject(err);
          if (rows.length === 0) return resolve([]);

          const dataByMonth = this.processDataByMonth(rows, grades);
          const result = this.forecastAndAppendToRows(
            Object.values(dataByMonth),
          );
          resolve(result);
        });
      });
    });
  }

  getForecastByGrades(grades: string[]): Promise<any[]> {
    const placeholders = grades?.map(() => "?").join(",");
    const sql = `
      SELECT year, month, grade, batches
      FROM production_data
      WHERE grade IN (${placeholders})
      ORDER BY year, month
    `;

    return new Promise((resolve, reject) => {
      if (!grades || grades.length === 0) resolve([]);
      this.db.all(sql, grades, (err, rows: any[]) => {
        if (err) return reject(err);
        if (rows.length === 0) return resolve([]);

        const dataByMonth = this.processDataByMonth(rows, grades);
        const result = this.forecastAndAppendToRows(Object.values(dataByMonth));
        resolve(result);
      });
    });
  }

  getForecastByGroup(group: string): Promise<any[]> {
    const sql = `SELECT grade FROM groups_data WHERE group_name = ?`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, [group], (err, rows: any[]) => {
        if (err) return reject(err);
        const grades = rows?.map((r) => r.grade);

        if (!grades || grades.length === 0) resolve([]);

        const placeholders = grades.map(() => "?").join(",");
        const sql = `
          SELECT year, month, grade, batches
          FROM production_data
          WHERE grade IN (${placeholders})
          ORDER BY year, month
        `;

        this.db.all(sql, grades, (err, rows: any[]) => {
          if (err) return reject(err);
          if (rows.length === 0) return resolve([]);

          const dataByMonth = this.processDataByMonth(rows, grades);
          Object.keys(dataByMonth).forEach((d) => {
            const { DateYearAndMonth, Forecast, ...rest } = dataByMonth[d];
            const vals = Object.values(rest);
            const sum = vals.reduce((a: number, b: number) => a + b);
            dataByMonth[d] = {
              DateYearAndMonth,
              Forecast,
              Grade_Grades_Grouped: sum,
            };
          });

          const result = this.forecastAndAppendToRows(
            Object.values(dataByMonth),
          );
          resolve(result);
        });
      });
    });
  }
}
