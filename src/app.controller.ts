import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  getHello() {
    return this.appService.getHello();
  }

  @Get("prod/data")
  getProdData() {
    return this.appService.getProdData();
  }

  @Get("list/tables")
  listTables() {
    return this.appService.listTables();
  }
}
