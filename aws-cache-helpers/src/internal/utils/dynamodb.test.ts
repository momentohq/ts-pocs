import {AttributeValue} from 'aws-lambda';
import {
  normalizeKeysFromAttributeValue,
  normalizeKeysFromRequestValue,
} from './dynamodb';

describe('dynamodb.test.ts', () => {
  it('should be able to parse a map of AttributeValues into consistent cache keys', () => {
    const tests: Array<{
      input: {[key: string]: AttributeValue};
      expectedOutput: string;
    }> = [
      {
        input: {
          foo: {
            S: 'bar',
          },
        },
        expectedOutput: 'foobar',
      },
      {
        input: {
          testSortKey: {
            S: 'testSortKeyValue',
          },
          testPrimaryKey: {
            S: 'testPrimaryKey',
          },
        },
        expectedOutput:
          'testSortKeytestSortKeyValuetestPrimaryKeytestPrimaryKey',
      },
      {
        input: {
          Id: {
            N: '101',
          },
        },
        expectedOutput: 'Id101',
      },
      {
        input: {
          'Group-': {
            NULL: true,
          },
          Id: {
            N: '101',
          },
        },
        expectedOutput: 'Group-nullId101',
      },
      {
        input: {
          PrimaryKey: {
            L: [
              {
                S: 'idOne',
              },
              {
                S: 'idTwo',
              },
            ],
          },
          SecondaryKey: {
            L: [
              {
                S: 'idThree',
              },
              {
                S: 'idFour',
              },
            ],
          },
        },
        expectedOutput:
          'PrimaryKey["idOne","idTwo"]SecondaryKey["idThree","idFour"]',
      },
      {
        input: {
          Sk: {
            M: {'1': {S: 'foo'}, '2': {S: 'bar'}},
          },
          Pk: {
            BOOL: true,
          },
        },
        expectedOutput: 'Sk{"1":"foo","2":"bar"}Pktrue',
      },
      {
        input: {
          Sk: {
            NS: ['1', '2', '3'],
          },
          Pk: {
            BOOL: true,
          },
        },
        expectedOutput: 'Sk1,2,3Pktrue',
      },
    ];
    tests.forEach(test => {
      expect(normalizeKeysFromAttributeValue(test.input)).toBe(
        test.expectedOutput
      );
    });
  });
  it('should be able to parse an inbound request keys object into consistent cache keys', () => {
    const tests: Array<{
      input: {[key: string]: any};
      expectedOutput: string;
    }> = [
      {
        input: {
          foo: 'bar',
        },
        expectedOutput: 'foobar',
      },
      {
        input: {
          testSortKey: 'testSortKeyValue',
          testPrimaryKey: 'testPrimaryKey',
        },
        expectedOutput:
          'testSortKeytestSortKeyValuetestPrimaryKeytestPrimaryKey',
      },
      {
        input: {
          Id: 101,
        },
        expectedOutput: 'Id101',
      },
      {
        input: {
          'Group-': null,
          Id: 101,
        },
        expectedOutput: 'Group-nullId101',
      },
      {
        input: {
          PrimaryKey: ['idOne', 'idTwo'],
          SecondaryKey: ['idThree', 'idFour'],
        },
        expectedOutput:
          'PrimaryKey["idOne","idTwo"]SecondaryKey["idThree","idFour"]',
      },
      {
        input: {
          'Sk-': new Set(['one', 'two', 'three']),
          'Pk-': true,
        },
        expectedOutput: 'Sk-one,two,threePk-true',
      },
      {
        input: {
          Sk: {
            idOne: 'foo',
            idTwo: 'bar',
          },
          Pk: new Map([
            ['idThree', 'val1'],
            ['idFour', 'val2'],
            ['idFive', 'val3'],
          ]),
        },
        expectedOutput:
          'Sk{"idOne":"foo","idTwo":"bar"}PkidThree,val1,idFour,val2,idFive,val3',
      },
    ];
    tests.forEach(test => {
      expect(normalizeKeysFromRequestValue(test.input)).toBe(
        test.expectedOutput
      );
    });
  });
});
