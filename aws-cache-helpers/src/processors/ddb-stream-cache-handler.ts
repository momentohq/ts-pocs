import {DynamoDBStreamEvent} from 'aws-lambda';
import {normalizeKeysFromAttributeValue} from '../internal/utils/dynamodb';
import {
  CacheClient,
  CacheDelete,
  CacheSet,
  DefaultMomentoLogger,
  DefaultMomentoLoggerLevel,
} from '@gomomento/sdk';

export interface StreamHandlerOptions {
  tableName: string;
  cacheName: string;
  cacheClient: CacheClient;
}

export const NewStreamCacheHandler = ({
  tableName,
  cacheName,
  cacheClient,
}: StreamHandlerOptions) => {
  const momento = cacheClient;
  const logger = new DefaultMomentoLogger(
    'StreamCacheHandler',
    DefaultMomentoLoggerLevel.WARN
  );

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
              JSON.stringify(r.dynamodb.NewImage)
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
