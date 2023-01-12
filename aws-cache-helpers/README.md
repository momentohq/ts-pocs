# aws-cache-helpers

Various collection of JS utilities to help you enable caching with Momento in AWS. 

## Usage
### AWS JS SDK v3 Middleware
```javascript
import {NewCachingMiddleware} from '@gomomento-poc/aws-cache-helpers';

const authToken = 'REPLACE_ME';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
db.middlewareStack.use(NewCachingMiddleware({
    tableName: 'my-ddb-table',
    momentoAuthToken: authToken,
    defaultCacheTtl: 86400,
    cacheName: 'default'
  }
));
```

### AWS DynamoDB Stream Lambda Handler
```javascript
import {NewStreamCacheHandler} from '@gomomento-poc/aws-cache-helpers';

const authToken = 'REPLACE_ME';
export const handler = NewStreamCacheHandler({
  tableName: 'my-ddb-table',
  momentoAuthToken: authToken,
  defaultCacheTtl: 86400,
  cacheName: 'default' 
});
```