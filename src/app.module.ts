import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database.module";
import { memoryStorage as mem } from "multer";

@Module({
  imports: [DatabaseModule, MulterModule.register({ storage: mem() })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
