import { Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UploadedFile, UploadedFiles } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { UseInterceptors } from "@nestjs/common";
import { ProductionService } from "./production.service";
import { ProductionDataDto } from "./dto/production-data.dto";
import { GroupGradeDto } from "./dto/group-grade.dto";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";
import { ApiConsumes } from "@nestjs/swagger";
import { ApiBody } from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { json2csv as j2c } from "csv42";
import * as c2md from "csv-to-markdown-table";

//

const GetProdDataApiQuery: ApiQueryOptions = {
  name: "fmt",
  required: false,
  description: "Set to 'csv' or 'md' to receive data in the respective format.",
  enum: ["csv", "md"],
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
        description:
          "Files: sequence.csv (daily sequence for an entire month) and groups.csv (optional)",
        type: "array",
        items: { type: "file" },
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
  description: "Set to 'csv' or 'md' to receive data in the respective format.",
  enum: ["csv", "md"],
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

@ApiTags("Production")
@Controller()
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

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
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.productionService.getProdDataWithGroups();
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.productionService.getProdDataWithGroups();
  }

  @Post("/prod/data/type-one")
  @ApiOperation({ summary: "Upload a sequence of heats of specified grades" })
  @ApiConsumes("multipart/form-data")
  @ApiBody(PostProductionT1ApiQuery)
  @ApiResponse(PostProductionT1ApiResponse)
  @ApiResponse({ status: 400, description: "Invalid CSV data provided." })
  @UseInterceptors(FilesInterceptor("files"))
  postProdDataT1(@UploadedFiles() files: any): Promise<object> {
    let sequenceFile: File = null;
    let groupsFile: File | null = null;

    const filesLen = files.length;
    if (filesLen < 1) throw new BadRequestException("Attach min 1 item(s)");
    if (filesLen > 2) throw new BadRequestException("Attach max 2 item(s)");

    if (filesLen >= 1 && files[0].size) sequenceFile = files[0];
    if (filesLen > 1 && files[1].size) groupsFile = files[1];

    return this.productionService.uploadProdDataT1(sequenceFile, groupsFile);
  }

  @Post("/prod/data/type-two")
  @ApiOperation({ summary: "Upload coarse breakdown into dif product groups" })
  @ApiConsumes("multipart/form-data")
  @ApiBody(PostProductionT2ApiQuery)
  @ApiResponse(PostProductionT2ApiResponse)
  @ApiResponse({ status: 400, description: "Invalid CSV data provided." })
  @UseInterceptors(FileInterceptor("csvFile"))
  postProdDataT2(@UploadedFile() file: Express.Multer.File): Promise<object> {
    return this.productionService.uploadProdDataT2(file);
  }

  @Get("/prod/data")
  @ApiOperation({ summary: "Get the production table" })
  @ApiQuery(GetProdDataApiQuery)
  @ApiResponse(GetProdDataApiResponse)
  getProdData(@Query("fmt") f: string): Promise<ProductionDataDto[] | string> {
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.productionService.getProdData();
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.productionService.getProdData();
  }

  @Post("/prod/groups")
  @ApiOperation({ summary: "Upload CSV data to update/insert prod groups" })
  @ApiConsumes("multipart/form-data")
  @ApiBody(PostGroupsBodyObj)
  @ApiResponse(PostGroupsResponse)
  @UseInterceptors(FileInterceptor("file"))
  postGroups(@UploadedFile() file: Express.Multer.File): Promise<object> {
    return this.productionService.uploadGroups(file);
  }

  @Get("/prod/groups")
  @ApiOperation({ summary: "Get all groups and their connected steel grades" })
  @ApiQuery(GetGroupsApiQuery)
  @ApiResponse(GetGroupsApiResponse)
  getGroupsData(@Query("fmt") f: string): Promise<GroupGradeDto[] | string> {
    if (f === "csv" || f === "md") {
      return new Promise(async (res) => {
        const data = await this.productionService.getGroupsData();
        if (f === "csv") {
          res(j2c(data));
        } else {
          res(c2md(j2c(data, { eol: "\n" }).trimEnd(), ",", true));
        }
      });
    }
    return this.productionService.getGroupsData();
  }
}
