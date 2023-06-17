import { isEmpty } from '@automapper/core';
import { classes } from '@automapper/classes';
import { Reference, Utils, wrap, type AnyEntity } from '@mikro-orm/core';
import {
  defaultStrategyInitializerOptions,
  type Mapping,
  type Dictionary,
  type Constructor,
  type MetadataIdentifier,
  type MappingStrategyInitializer,
  type MappingStrategyInitializerOptions,
} from '@automapper/core';

import type { IWrappedEntityInternal } from '@mikro-orm/core/typings';

export function mikro(
  options: MappingStrategyInitializerOptions = {},
): MappingStrategyInitializer<Constructor> {
  const mergedOptions = {
    ...defaultStrategyInitializerOptions,
    destinationConstructor: (
      _: Dictionary<object>,
      destinationIdentifier: MetadataIdentifier,
    ) => new (destinationIdentifier as Constructor)(),
    ...options,
  };

  if (mergedOptions.preMap === defaultStrategyInitializerOptions.preMap) {
    mergedOptions.preMap = <
      TSource extends Dictionary<TSource>,
      TDestination extends Dictionary<TDestination>,
    >(
      source: TSource,
      mapping: Mapping<TSource, TDestination>,
    ) => {
      const [sourceMetadataObject] = mapping[1];
      return serializeEntity(source, sourceMetadataObject) as TSource;
    };
  }

  return classes(mergedOptions);
}

const excluded = [
  '__gettersDefined',
  '__entity',
  '__meta',
  '__platform',
  '__helper',
  '__factory',
];

function serializeEntity(
  item: AnyEntity,
  itemMetadata: Record<string, unknown> | undefined,
  toPojo = false,
  memorized = new Map<AnyEntity, Record<string, unknown>>(),
  skipCheckExisting = false,
) {
  if (!Utils.isEntity(item)) return item;
  if (toPojo) return wrap(item).toPOJO();

  const result = {} as Record<string | symbol, unknown>;
  const keys = Object.keys(
    (wrap(item) as IWrappedEntityInternal<AnyEntity>).__meta.properties,
  );
  for (const key of keys) {
    if (typeof key === 'symbol' || excluded.includes(key)) {
      continue;
    }

    const value = item[key];
    const keyMetadata =
      itemMetadata && (itemMetadata[key] as Record<string, unknown>);

    if (Utils.isCollection(value)) {
      result[key] = (value.getSnapshot() || []).map((snapshot) => {
        return serializeEntity(
          snapshot as AnyEntity,
          keyMetadata,
          true,
          memorized,
          true,
        );
      });
      continue;
    }

    if (Reference.isReference(value)) {
      const isExisting = memorized.has(value);

      if (!skipCheckExisting && isExisting) {
        result[key] = memorized.get(value);
        continue;
      }

      if (!value.isInitialized()) {
        memorized.set(value, wrap(value).toPOJO());
        result[key] = serializeEntity(
          wrap(value).toPOJO(),
          keyMetadata,
          false,
          memorized,
          !isExisting,
        );
        continue;
      }

      memorized.set(value, value.getEntity() as Record<string, unknown>);
      result[key] = serializeEntity(
        value.getEntity(),
        keyMetadata,
        typeof keyMetadata === 'object' && isEmpty(keyMetadata),
        memorized,
        !isExisting,
      );
      continue;
    }

    result[key] = serializeEntity(value, keyMetadata, false, memorized, false);
  }

  if (result['id'] == null && item['id'] != null) {
    result['id'] = item['id'];
  }

  return result;
}
