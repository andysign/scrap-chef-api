import { ApiProperty } from "@nestjs/swagger";

export class ProductionDataDto {
  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ example: 6 })
  month: number;

  @ApiProperty({ example: "Rebar" })
  group_name: string;

  @ApiProperty({ example: "B500A" })
  grade: string;

  @ApiProperty({ example: 123 })
  batches: number;
}
