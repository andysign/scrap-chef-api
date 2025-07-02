import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix("/api/v0", { exclude: ["/", "/health"] });
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("API")
      .setDescription("The Backend API")
      .setVersion("1.0")
      .addTag("App")
      .build(),
  );
  const documentFactory = () => SwaggerModule.createDocument(app, document);
  const SwaggerCustomOpt = { jsonDocumentUrl: "json", yamlDocumentUrl: "yaml" };
  SwaggerModule.setup("/api/v0", app, documentFactory, SwaggerCustomOpt);
  await app.listen(3000);
}
bootstrap();
