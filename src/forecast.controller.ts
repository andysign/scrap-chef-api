import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";
import { ForecastService } from "./forecast.service";
import { ForecastDataDto } from "./dto/forecast-data.dto";
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
  description: "The grade(s) to forecast (comma-separated).",
  example: "B500A,A36",
};
const GetForecastApiResponse: ApiResponseOptions = {
  status: 200,
  description: "Historical data followed by a one-month forecast.",
  type: [ForecastDataDto],
};

const GetForecastApiQueryGroup: ApiQueryOptions = {
  name: "group",
  required: true,
  description: "The group to forecast.",
  example: "Rebar",
};

@ApiTags("Forecast")
@Controller("")
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get("/prod/forecast")
  @ApiOperation({ summary: "Get hist months & a forecast one for all grades" })
  @ApiQuery(GetForecastApiQueryFmt)
  @ApiResponse(GetForecastApiResponse)
  getFrAll(@Query("fmt") f: any): Promise<any[] | string> {
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.forecastService.getForecastAllGrades();
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.forecastService.getForecastAllGrades();
  }

  @Get("/prod/forecast-by-grades")
  @ApiOperation({ summary: "Get hist months followed by and a forecasted one" })
  @ApiQuery(GetForecastApiQueryFmt)
  @ApiQuery(GetForecastApiQueryGrade)
  @ApiResponse(GetForecastApiResponse)
  getFr(@Query("fmt") f: any, @Query("grade") g: any): Promise<any[] | string> {
    const grades = g?.split(",");
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.forecastService.getForecastByGrades(grades);
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.forecastService.getForecastByGrades(grades);
  }

  @Get("/prod/forecast-by-groups")
  @ApiOperation({ summary: "Get hist months & a forecast one for a group" })
  @ApiQuery(GetForecastApiQueryFmt)
  @ApiQuery(GetForecastApiQueryGroup)
  @ApiResponse(GetForecastApiResponse)
  getFG(@Query("fmt") f: any, @Query("group") g: any): Promise<any[] | string> {
    const group = g;
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.forecastService.getForecastByGroup(group);
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.forecastService.getForecastByGroup(group);
  }
}
