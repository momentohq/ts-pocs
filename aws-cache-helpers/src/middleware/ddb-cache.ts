import {
  CacheGet,
  CacheSet,
  getLogger,
  LogFormat,
  LogLevel,
  SimpleCacheClient,
} from '@gomomento/sdk';
import {normalizeKeysFromRequestValue} from '../internal/utils/dynamodb';
import {
  InitializeHandler,
  InitializeHandlerArguments,
  InitializeHandlerOutput,
  InitializeMiddleware,
  MetadataBearer,
  Pluggable,
} from '@aws-sdk/types';

const CommandCacheAllowList = ['GetItemCommand'];

export interface CacheMiddleWareOptions {
  tableName: string;
  momentoAuthToken: string;
  defaultCacheTtl: number;
  cacheName: string;
}

export const NewCachingMiddleware = (
  options: CacheMiddleWareOptions
): Pluggable<any, any> => ({
  applyToStack: clientStack => {
    clientStack.add(cachingMiddleware(options), {tags: ['CACHE']});
  },
});
export function cachingMiddleware(
  options: CacheMiddleWareOptions
): InitializeMiddleware<any, any> {
  const momento = new SimpleCacheClient(
    options.momentoAuthToken,
    options.defaultCacheTtl,
    {
      loggerOptions: {
        level: LogLevel.INFO,
        format: LogFormat.JSON,
      },
    }
  );
  const logger = getLogger('momentoCachingMiddleware');

  return <Output extends MetadataBearer>(
      next: InitializeHandler<any, Output>
    ): InitializeHandler<any, Output> =>
    async (
      args: InitializeHandlerArguments<any>
    ): Promise<InitializeHandlerOutput<Output>> => {
      // Check if we should cache this command
      if (CommandCacheAllowList.includes(args.constructor.name)) {
        // TODO right now this assumes GetItemCommand only we should make this more flexible in long run to
        //  support other types of AWS SDK api calls
        const itemCacheKey =
          options.tableName +
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          normalizeKeysFromRequestValue(args.input.Key as {[key: string]: any});
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!args.input.ConsistentRead) {
          // Check and see if we already have item in cache
          const getResponse = await momento.get(
            options.cacheName,
            itemCacheKey
          );
          if (getResponse instanceof CacheGet.Hit) {
            // If item found in cache return result and skip DDB call aka calling next
            logger.info('found item in momento cache skipping DDB lookup');
            return {
              // @ts-ignore we know we are spoofing a DynamoDb response here ignore the untyped MetadataBearer output
              output: {
                $metadata: {},
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                Item: JSON.parse(getResponse.valueString()),
              },
            };
          }
        }

        // If we didn't get cache hit let normal call path go through and then try cache result for next time
        const result = await next(args);
        // @ts-ignore we know we are handling a DynamoDb response here ignore the untyped MetadataBearer output
        if (result.output.Item !== undefined) {
          const setRsp = await momento.set(
            options.cacheName,
            itemCacheKey,
            // @ts-ignore we know we are handling a DDB response here ignore middleware untyped output
            JSON.stringify(result.output.Item)
          );
          if (setRsp instanceof CacheSet.Error) {
            logger.error(
              'error caching response from dynamodb err=' + setRsp.message()
            );
          }
        }
        return result;
      } else {
        return await next(args);
      }
    };
}
