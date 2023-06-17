import { MapInterceptor as MapperMapInterceptor } from '@automapper/nestjs';
import {
  SetMetadata,
  UseInterceptors,
  type CustomDecorator,
} from '@nestjs/common';

import type { Dictionary, ModelIdentifier } from '@automapper/core';

import {
  SKIP_MAPPER,
  MapInterceptor,
  HAS_LOCAL_MAPPER,
} from './MapInterceptor';

import type { TMapperOptions } from './interface';

export function UseMapperInterceptor<
  TSource extends Dictionary<TSource>,
  TDestination extends Dictionary<TDestination>,
>(
  from: ModelIdentifier<TSource>,
  to: ModelIdentifier<TDestination>,
  options: TMapperOptions<TSource, TDestination> = {},
): MethodDecorator & ClassDecorator {
  return UseInterceptors(MapInterceptor(from, to, options));
}

export function UseLocalMapperInterceptor<
  TSource extends Dictionary<TSource>,
  TDestination extends Dictionary<TDestination>,
>(
  from: ModelIdentifier<TSource>,
  to: ModelIdentifier<TDestination>,
  options: TMapperOptions<TSource, TDestination> = {},
): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(HAS_LOCAL_MAPPER, true, descriptor.value);
    }

    return UseInterceptors(MapperMapInterceptor(from, to, options))(
      target,
      key,
      descriptor,
    );
  };
}

export function SkipMapper(): CustomDecorator<string> {
  return SetMetadata(SKIP_MAPPER, true);
}
