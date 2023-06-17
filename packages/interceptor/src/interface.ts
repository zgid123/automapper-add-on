import type { MapOptions } from '@automapper/core';

export type TMapperOptions<TSource, TDestination> = {
  isArray?: boolean;
  mapperName?: string;
} & MapOptions<TSource, TDestination>;
