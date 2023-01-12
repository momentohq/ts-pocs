import {DynamoDBStreamEvent} from 'aws-lambda';
import {normalizeKeysFromAttributeValue} from '../internal/utils/dynamodb';
import {
  CacheDelete,
  CacheSet,
  LogFormat,
  LogLevel,
  SimpleCacheClient,
  getLogger,
} from '@gomomento/sdk';

export interface StreamHandlerOptions {
  tableName: string;
  momentoAuthToken: string;
  defaultCacheTtl: number;
  cacheName: string;
}
export const NewStreamCacheHandler = ({
  tableName,
  momentoAuthToken,
  defaultCacheTtl,
  cacheName,
}: StreamHandlerOptions) => {
  const momento = new SimpleCacheClient(momentoAuthToken, defaultCacheTtl, {
    loggerOptions: {
      level: LogLevel.INFO,
      format: LogFormat.JSON,
    },
  });
  const logger = getLogger('StreamCacheHandler');

  return async (event: DynamoDBStreamEvent): Promise<any> => {
    for (const r of event.Records) {
      if (r.dynamodb && r.dynamodb.Keys) {
        const recordKey =
          tableName + normalizeKeysFromAttributeValue(r.dynamodb.Keys);
        switch (r.eventName) {
          case 'INSERT':
          case 'MODIFY': {
            const setRsp = await momento.set(
              cacheName,
              recordKey,
              JSON.stringify(r.dynamodb.NewImage),
              defaultCacheTtl
            );
            if (setRsp instanceof CacheSet.Error) {
              logger.error(
                `error setting item in cache err=${setRsp.message()}`
              );
            }
            break;
          }
          case 'REMOVE': {
            const deleteRsp = await momento.delete(cacheName, recordKey);
            if (deleteRsp instanceof CacheDelete.Error) {
              logger.error(
                `error deleting item in cache err=${deleteRsp.message()}`
              );
            }
          }
        }
      }
    }
    logger.info(`successfully processed ${event.Records.length} event records`);
  };
};
