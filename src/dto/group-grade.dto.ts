import { ApiProperty } from "@nestjs/swagger";

export class GroupGradeDto {
  @ApiProperty({ example: "B500A" })
  grade: string;

  @ApiProperty({ example: "Rebar" })
  group_name: string;
}
