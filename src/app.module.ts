import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { ProductionController } from "./production.controller";
import { ProductionService } from "./production.service";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { DatabaseModule } from "./database.module";
import { memoryStorage as mem } from "multer";

@Module({
  imports: [DatabaseModule, MulterModule.register({ storage: mem() })],
  controllers: [ProductionController, AdminController],
  providers: [ProductionService, AdminService],
})
export class AppModule {}
