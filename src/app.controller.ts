import { Controller, Get, Query } from "@nestjs/common";
import { AppService } from "./app.service";
import { ProductionDataDto } from "./dto/production-data.dto";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  getHello() {
    return "NestJs API. Go to /api/v0/ pls.";
  }

  @Get("/prod/data")
  @ApiOperation({ summary: "Get the complete production data" })
  @ApiQuery({
    name: "fmt",
    required: false,
    description: "Set to 'csv' or 'tsv' to receive data in CSV or TSV format.",
    enum: ["csv", "tsv"],
  })
  @ApiResponse({
    status: 200,
    description: "A list of production data records.",
    type: [ProductionDataDto],
  })
  getProdData(@Query("fmt") f: string): Promise<ProductionDataDto[] | string> {
    console.log({ f });
    if (f == "csv") {
      return new Promise((resolve) => resolve("foo"));
    } else if (f == "tsv") {
      return new Promise((resolve) => resolve("var"));
    }
    return this.appService.getProdData();
  }

  @Get("list/tables")
  listTables() {
    return this.appService.listTables();
  }
}
