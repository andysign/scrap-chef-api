import { ApiProperty } from "@nestjs/swagger";

export class ForecastDataDto {
  @ApiProperty({
    example: "2024-06",
    description: "The year and month for the data row (YYYY-MM).",
  })
  DateYearAndMonth: string;

  @ApiProperty({
    example: "N",
    description: "Indicates if the row is a forecast or not (Y/N).",
    enum: ["Y", "N"],
  })
  Forecast: string;

  @ApiProperty({
    example: "N",
    description: "Show the historical or forecast val in batches and tons.",
    required: false,
  })
  Grade_Index_GradeName: string;
}
