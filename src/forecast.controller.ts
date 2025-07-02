import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ForecastService } from "./forecast.service";
import { json2csv as j2c } from "csv42";
import * as c2md from "csv-to-markdown-table";

// import { ForecastDataDto } from "./dto/forecast-data.dto";

@ApiTags("Forecast")
@Controller("")
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get("/prod/forecast")
  @ApiOperation({ summary: "Get hist months followed by and a forecasted one" })
  @ApiQuery({
    name: "fmt",
    required: false,
    description: "Set to 'csv' / 'md' to retrieve in the respective format.",
    enum: ["csv", "md"],
  })
  @ApiQuery({
    name: "grade",
    required: true,
    description: "The grade to forecast",
    example: "B500A",
  })
  @ApiResponse({
    status: 200,
    description: "Historical data and a one-month forecast.",
    // type: "object",
    // type: [ForecastDataDto],
    schema: {
      type: "array",
      items: {
        type: "array",
        example: [],
      },
    },
  })
  getForecast(
    @Query("fmt") f: string,
    @Query("grade") grade: string,
  ): Promise<any[] | string> {
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.forecastService.getForecast(grade);
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.forecastService.getForecast(grade);
  }
}
