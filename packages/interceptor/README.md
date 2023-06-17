NestJS's interceptor for [@automapper](https://github.com/nartc/mapper).

# Install

```sh
npm install --save @automapper-add-on/interceptor

# or

yarn add @automapper-add-on/interceptor

# or

pnpm add @automapper-add-on/interceptor
```

# Usage

```ts
import { Get, Controller } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  SkipMapper,
  UseMapperInterceptor,
  UseLocalMapperInterceptor,
} from '@automapper-add-on/interceptor';

import type { EntityRepository } from '@mikro-orm/postgresql';

import { Post as PostModel } from 'db/models/Post';

import { PostVM } from './posts.vm';

// this will apply mapper for all actions
@UseMapperInterceptor(PostModel, PostVM)
@Controller('posts')
export class PostsController {
  public constructor(
    @InjectRepository(PostModel)
    private readonly postRepository: EntityRepository<PostModel>,
  ) {}

  // this will override the mapper for this action only
  @UseLocalMapperInterceptor(PostModel, PostVM, {
    mapperName: 'classes',
  })
  @Get()
  public all(): Promise<PostModel[]> {
    return this.postRepository.findAll();
  }

  @Get()
  public findOne(): Promise<PostModel> {
    return this.postRepository.findOneOrFail({
      id: 1,
    });
  }

  @SkipMapper()
  @Get('skip-mapper')
  public skipMapper(): string[] {
    return ['those value', 'wont be transformed'];
  }
}
```
