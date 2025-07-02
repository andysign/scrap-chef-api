import { Controller, Get, Query } from "@nestjs/common";
import { AppService } from "./app.service";
import { ProductionDataDto } from "./dto/production-data.dto";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";
import { json2csv } from "csv42";

const GetProdDataApiQuery: ApiQueryOptions = {
  name: "fmt",
  required: false,
  description: "Set to 'csv' to receive data in CSV format.",
  enum: ["csv"],
};
const GetProdDataApiResponse: ApiResponseOptions = {
  status: 200,
  description: "A list of production data records.",
  type: [ProductionDataDto],
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  @ApiOperation({ summary: "ROOT" })
  getHello() {
    return "NestJs API. Go to /api/v0/ pls.";
  }

  @Get("/prod/data")
  @ApiOperation({ summary: "Get the complete production data" })
  @ApiQuery(GetProdDataApiQuery)
  @ApiResponse(GetProdDataApiResponse)
  getProdData(@Query("fmt") f: string): Promise<ProductionDataDto[] | string> {
    if (f == "csv") {
      return new Promise(async (res) => {
        res(json2csv(await this.appService.getProdData()));
      });
    }
    return this.appService.getProdData();
  }

  @ApiOperation({ summary: "Get the name of every single db table" })
  @Get("/list/tables")
  listTables() {
    return this.appService.listTables();
  }
}
