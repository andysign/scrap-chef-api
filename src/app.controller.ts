import { Controller, Get, Post, Query, UploadedFile } from "@nestjs/common";
import { UseInterceptors } from "@nestjs/common";
import { AppService } from "./app.service";
import { ProductionDataDto } from "./dto/production-data.dto";
import { GroupGradeDto } from "./dto/group-grade.dto";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";
import { ApiConsumes } from "@nestjs/swagger";
import { ApiBody } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
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

const GetGroupsApiQuery: ApiQueryOptions = {
  name: "fmt",
  required: false,
  description: "Set to 'csv' to receive data in CSV format.",
  enum: ["csv"],
};
const GetGroupsApiResponse: ApiResponseOptions = {
  status: 200,
  description: "A list of db grades w their corresponding groups on the right.",
  type: [GroupGradeDto],
};

const PostGroupsBodyObj: ApiQueryOptions = {
  schema: {
    type: "object",
    properties: {
      file: { type: "string", format: "binary", description: "groups.csv" },
    },
    required: ["file"],
  },
};
const PostGroupsResponse: ApiResponseOptions = {
  status: 201,
  description: "Post groups OK response.",
  schema: {
    type: "object",
    example: { response: "OK" },
  },
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  @ApiOperation({ summary: "ROOT" })
  getHello() {
    return "NestJs API. Go to /api/v0/ pls.";
  }

  @Get("/prod/all")
  @ApiOperation({ summary: "Get the complete production data w/ groups" })
  @ApiQuery(GetProdDataApiQuery)
  @ApiResponse(GetProdDataApiResponse)
  prodDataWGrs(@Query("fmt") f: string): Promise<ProductionDataDto[] | string> {
    if (f == "csv") {
      return new Promise(async (res) => {
        res(json2csv(await this.appService.getProdDataWithGroups()));
      });
    }
    return this.appService.getProdDataWithGroups();
  }

  @Post("/prod/groups")
  @ApiOperation({ summary: "Upload CSV data to update/insert prod groups" })
  @ApiConsumes("multipart/form-data")
  @ApiBody(PostGroupsBodyObj)
  @ApiResponse(PostGroupsResponse)
  @UseInterceptors(FileInterceptor("file"))
  postGroups(@UploadedFile() file: Express.Multer.File): Promise<object> {
    return this.appService.uploadGroups(file);
  }

  @Get("/prod/groups")
  @ApiOperation({ summary: "Get all groups and their connected steel grades" })
  @ApiQuery(GetGroupsApiQuery)
  @ApiResponse(GetGroupsApiResponse)
  getGroups(@Query("fmt") f: string): Promise<GroupGradeDto[] | string> {
    if (f == "csv") {
      return new Promise(async (res) => {
        res(json2csv(await this.appService.getGroupsData()));
      });
    }
    return this.appService.getGroupsData();
  }

  @ApiOperation({ summary: "Get the name of every single db table" })
  @Get("/db/list/tables")
  listTables() {
    return this.appService.listTables();
  }
}
