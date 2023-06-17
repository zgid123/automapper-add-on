import { map, type Observable } from 'rxjs';
import { InjectMapper } from '@automapper/nestjs';
import {
  mixin,
  Optional,
  type CallHandler,
  type NestInterceptor,
  type ExecutionContext,
} from '@nestjs/common';

import type {
  Mapper,
  Dictionary,
  MapOptions,
  ModelIdentifier,
} from '@automapper/core';

import {
  memoize,
  transformArray,
  getTransformOptions,
  shouldSkipTransform,
} from './utils';

import type { TMapperOptions } from './interface';

export const HAS_LOCAL_MAPPER = 'hasLocalMapper';

export const SKIP_MAPPER = 'needSkipMapper';

export const MapInterceptor: <
  TSource extends Dictionary<TSource>,
  TDestination extends Dictionary<TDestination>,
>(
  from: ModelIdentifier<TSource>,
  to: ModelIdentifier<TDestination>,
  options?: TMapperOptions<TSource, TDestination>,
) => NestInterceptor = memoize(createMapInterceptor);

function createMapInterceptor<
  TSource extends Dictionary<TSource>,
  TDestination extends Dictionary<TDestination>,
>(
  from: ModelIdentifier<TSource>,
  to: ModelIdentifier<TDestination>,
  options?: TMapperOptions<TSource, TDestination>,
): new (...args: unknown[]) => NestInterceptor {
  const { isArray, mapperName, transformedMapOptions } =
    getTransformOptions(options);

  class MixinMapInterceptor implements NestInterceptor {
    constructor(
      @Optional()
      /**
       * for some reason
       * InjectMapper encounters an error
       * Unable to resolve signature of parameter decorator when called as an expression.
       * Argument of type 'undefined' is not assignable to parameter of type 'string | symbol'
       * TODO: investigate and fix this issue
       */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      /* @ts-ignore */
      @InjectMapper(mapperName)
      private readonly mapper?: Mapper,
    ) {}

    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<unknown>> {
      const hasLocalMapper = Reflect.getMetadata(
        HAS_LOCAL_MAPPER,
        context.getHandler(),
      );

      const needSkipMapper = Reflect.getMetadata(
        SKIP_MAPPER,
        context.getHandler(),
      );

      if (hasLocalMapper || needSkipMapper) {
        return next.handle();
      }

      if (shouldSkipTransform(this.mapper, from, to)) {
        return next.handle();
      }

      try {
        return next.handle().pipe(
          map((response) => {
            if (isArray) {
              return transformArray(
                response,
                this.mapper,
                from,
                to,
                transformedMapOptions as unknown as MapOptions<
                  TSource[],
                  TDestination[]
                >,
              );
            }

            return this.mapper?.map(response, from, to, transformedMapOptions);
          }),
        );
      } catch {
        return next.handle();
      }
    }
  }

  return mixin(MixinMapInterceptor);
}
