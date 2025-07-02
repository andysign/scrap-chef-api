import { Controller, Get, Delete } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { ApiResponseOptions } from "@nestjs/swagger";

const GetDbListTablesResponse: ApiResponseOptions = {
  status: 200,
  schema: { type: "array", items: { type: "string" } },
};

@ApiTags("DbManagement")
@Controller("")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: "Get the name of every single db table" })
  @Get("/db/list/tables")
  @ApiResponse(GetDbListTablesResponse)
  listTables() {
    return this.adminService.listTables();
  }

  @Delete("/db/reset")
  @ApiOperation({ summary: "Reset the database to its initial state" })
  @ApiResponse({ status: 200, description: "Database reset successfully." })
  resetDatabase(): Promise<any> {
    return this.adminService.resetDatabase();
  }
}
