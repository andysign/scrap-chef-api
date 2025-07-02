import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";
import { ForecastService } from "./forecast.service";
import { json2csv as j2c } from "csv42";
import * as c2md from "csv-to-markdown-table";

const GetForecastApiQueryFmt: ApiQueryOptions = {
  name: "fmt",
  required: false,
  description: "Set to 'csv' / 'md' to retrieve in the respective format.",
  enum: ["csv", "md"],
};
const GetForecastApiQueryGrade: ApiQueryOptions = {
  name: "grade",
  required: true,
  description: "The grade to forecast",
  example: "B500A",
};
const GetForecastApiResponse: ApiResponseOptions = {
  status: 200,
  description: "Historical data followed by a one-month forecast.",
  schema: {
    type: "array",
    items: {
      type: "object",
      example: {},
    },
  },
};

@ApiTags("Forecast")
@Controller("")
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get("/prod/forecast")
  @ApiOperation({ summary: "Get hist months followed by and a forecasted one" })
  @ApiQuery(GetForecastApiQueryFmt)
  @ApiQuery(GetForecastApiQueryGrade)
  @ApiResponse(GetForecastApiResponse)
  getFr(@Query("fmt") f: any, @Query("grade") g: any): Promise<any[] | string> {
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.forecastService.getForecast(g);
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.forecastService.getForecast(g);
  }
}
