import {unmarshall} from '@aws-sdk/util-dynamodb';
import {AttributeValue} from 'aws-lambda';

/**
 * Goes from DDB attribute schema keys to a normalized key we can use across various components in this library.
 * @param keys
 */
export const normalizeKeysFromAttributeValue = (keys: {
  [key: string]: AttributeValue;
}): string => {
  // @ts-ignore DDB responses give us {[key: string]: AttributeValue;} in their responses vs Record<string, AttributeValue> we know we can handle this.
  return normalizeKeysFromRequestValue(unmarshall(keys));
};
/**
 * Goes from raw DynamoDB request object Keys to a normalized key we can use across various components in this library.
 * @param keys
 */
export const normalizeKeysFromRequestValue = (keys: {
  [key: string]: any;
}): string => {
  let returnString = '';
  Object.keys(keys).forEach((k: string) => {
    const key: string = k;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value = keys[k];

    if (value instanceof Set || value instanceof Map) {
      returnString += `${key}${Array.from(value).toString()}`;
    } else if (value instanceof Object) {
      returnString += key + JSON.stringify(value);
    } else {
      // We force to just try to resolve key to string here
      // eslint-disable-next-line  @typescript-eslint/restrict-template-expressions
      returnString += `${key}${value}`;
    }
  });
  return returnString;
};
