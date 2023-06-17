MikroORM's preMap for [@automapper](https://github.com/nartc/mapper).

# Install

```sh
npm install --save @automapper-add-on/mikro-premap

# or

yarn add @automapper-add-on/mikro-premap

# or

pnpm add @automapper-add-on/mikro-premap
```

# Usage

```ts
import { MikroORM } from '@mikro-orm/core';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { mikro } from '@automapper-add-on/mikro-premap';
import { MikroOrmMiddleware, MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Module,
  type NestModule,
  type OnModuleInit,
  type MiddlewareConsumer,
} from '@nestjs/common';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    AutomapperModule.forRoot([
      {
        name: 'default',
        strategyInitializer: mikro(),
      },
      {
        name: 'classes',
        strategyInitializer: classes(),
      },
    ]),
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  async onModuleInit(): Promise<void> {
    await this.orm.getMigrator().up();
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MikroOrmMiddleware).forRoutes('*');
  }
}
```
