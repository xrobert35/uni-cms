import { Config } from './config/config';
Config.init();

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { WinLogger } from './common/logger/winlogger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClientServer } from './client.server';
import { RendererServer } from './renderer.server';

const logger = WinLogger.get('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger : WinLogger.get('nest'),
  });

  const swaggerActivated = Config.get().SWAGGER_ACTIVATED;
  if (swaggerActivated) {
    const packageJson = require('../../../package.json');

    const options = new DocumentBuilder()
      .setTitle(packageJson.name)
      .setDescription(packageJson.description)
      .setVersion(packageJson.version)
      .setBasePath(Config.get().SERVER_PATH)
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(`${Config.get().SERVER_PATH}/swagger`, app, document);
  }

  const serverPort = Config.get().SERVER_PORT;
  app.setGlobalPrefix(`${Config.get().SERVER_PATH}`);

  await app.listen(Config.get().SERVER_PORT);

  let clientStarted = false;
  if (Config.get().CLIENT_ACTIVATED) {
    await ClientServer.bootstrap(app);
    clientStarted = true;
  }

  let rendererStarted = false;
  if (Config.get().RENDERER_ACTIVATED) {
    await RendererServer.bootstrap(app);
    rendererStarted = true;
  }

  if (clientStarted) {
    logger.info(`Client server listening on http://localhost:${Config.get().CLIENT_PORT}`);
  }
  if (rendererStarted) {
    logger.info(`Renderer server listening on http://localhost:${Config.get().RENDERER_PORT}`);
  }
  logger.info(`Server started on port ${serverPort}`);
  if (swaggerActivated) {
    logger.info('Swagger is activated and is accessible on /api/swagger');
  }
}
bootstrap();
