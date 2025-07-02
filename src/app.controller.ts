import { Controller, Get, Post, Query } from "@nestjs/common";
import { UploadedFile, UploadedFiles } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { UseInterceptors } from "@nestjs/common";
import { AppService } from "./app.service";
import { ProductionDataDto } from "./dto/production-data.dto";
import { GroupGradeDto } from "./dto/group-grade.dto";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";
import { ApiConsumes } from "@nestjs/swagger";
import { ApiBody } from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { json2csv } from "csv42";

//

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

const PostProductionT1ApiQuery: ApiQueryOptions = {
  schema: {
    type: "object",
    properties: {
      files: {
        description: "Files required: sequence.csv and groups.csv (optional)",
        type: "array",
        items: { type: "string", format: "binary" },
        minItems: 1,
        maxItems: 2,
      },
    },
  },
};
const PostProductionT1ApiResponse: ApiResponseOptions = {
  status: 200,
  description: "CSV data processed successfully.",
  schema: {
    type: "object",
    properties: {
      response: { type: "file", example: "OK" },
    },
  },
};

const PostProductionT2ApiQuery: ApiQueryOptions = {
  schema: {
    type: "object",
    properties: {
      csvFile: { type: "string", format: "binary" },
    },
  },
};
const PostProductionT2ApiResponse: ApiResponseOptions = {
  status: 200,
  description: "CSV data processed successfully.",
  schema: {
    type: "object",
    properties: {
      response: {
        type: "string",
        example: "OK",
      },
    },
  },
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

const GetDbListTablesResponse: ApiResponseOptions = {
  status: 200,
  schema: { type: "array", items: { type: "string" } },
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

  @Post("/prod/data/type-one")
  @ApiOperation({ summary: "Upload a sequence of heats of specified grades" })
  @ApiConsumes("multipart/form-data")
  @ApiBody(PostProductionT1ApiQuery)
  @ApiResponse(PostProductionT1ApiResponse)
  @ApiResponse({ status: 400, description: "Invalid CSV data provided." })
  @UseInterceptors(FilesInterceptor("files"))
  postProdDataT1(@UploadedFiles() files: any): Promise<object> {
    let sequenceFile: File | null = null;
    let groupsFile: File | null = null;

    const filesLen = files.length;
    if (filesLen < 1) throw new BadRequestException("Attach min 1 item(s)");
    if (filesLen > 2) throw new BadRequestException("Attach max 2 item(s)");

    if (filesLen >= 1 && files[0].size) sequenceFile = files[0];
    if (filesLen > 1 && files[1].size) groupsFile = files[1];

    return new Promise((res) => {
      console.log(sequenceFile, groupsFile);
      res({ response: "OK" });
    });
  }

  @Post("/prod/data/type-two")
  @ApiOperation({ summary: "Upload coarse breakdown into dif product groups" })
  @ApiConsumes("multipart/form-data")
  @ApiBody(PostProductionT2ApiQuery)
  @ApiResponse(PostProductionT2ApiResponse)
  @ApiResponse({ status: 400, description: "Invalid CSV data provided." })
  @UseInterceptors(FileInterceptor("csvFile"))
  postProdDataT2(@UploadedFile() file: Express.Multer.File): Promise<object> {
    return this.appService.uploadProdDataT2(file);
  }

  @Get("/prod/data")
  @ApiOperation({ summary: "Get the production table" })
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
  getGroupsData(@Query("fmt") f: string): Promise<GroupGradeDto[] | string> {
    if (f == "csv") {
      return new Promise(async (res) => {
        res(json2csv(await this.appService.getGroupsData()));
      });
    }
    return this.appService.getGroupsData();
  }

  @ApiOperation({ summary: "Get the name of every single db table" })
  @Get("/db/list/tables")
  @ApiResponse(GetDbListTablesResponse)
  listTables() {
    return this.appService.listTables();
  }
}
