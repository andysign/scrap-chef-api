import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  getProdData() {
    return "hello world";
  }

  @Get("list/tables")
  listTables() {
    return this.appService.listTables();
  }
}
