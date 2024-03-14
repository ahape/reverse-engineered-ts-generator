/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-fallthrough */
// import { generator } from '../generator'
import { helper } from './helper'
import { test } from '@jest/globals'

const expected1 = 'arg1_greater_than_1'
const expected2 = 'done'

function willThrow (): boolean { throw new Error() }
function fun (this: any, arg1: number): Iterator<number> {
  let e_1
  return helper(this, function (_a: any) {
    switch (_a.label) {
      case 0:
        _a.trys.push([0, 5, 6, 8])
        if (!(arg1 > 1)) return [3 /* break */, 2]
        return [4 /* yield */, 'arg1_greater_than_1']
      case 1:
        _a.sent()
        _a.label = 2
      case 2:
        if (!willThrow()) return [3 /* break */, 4]
        return [4 /* yield */, 'never']
      case 3:
        _a.sent()
        _a.label = 4
      case 4: return [3 /* break */, 8]
      case 5:
        e_1 = _a.sent()
        console.log(e_1)
        return [3 /* break */, 8]
      case 6: return [4 /* yield */, 'done']
      case 7:
        _a.sent()
        return [7]
      case 8: return [2]
    }
  })
}

test('A generator with try/catch/finally blocks', () => {
  const iter = fun(2)
  let value = iter.next()
  expect(value.done).toBe(false)
  expect(value.value).toBe(expected1)
  value = iter.next()
  expect(value.done).toBe(false)
  expect(value.value).toBe(expected2)
  value = iter.next()
  expect(value.done).toBe(true)
  expect(value.value).toBeUndefined()
})
