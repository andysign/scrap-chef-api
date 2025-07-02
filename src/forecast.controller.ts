import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ForecastService } from "./forecast.service";

@ApiTags("Forecast")
@Controller("")
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get("/test")
  test() {
    return "this.forecastService.test()";
  }
}
