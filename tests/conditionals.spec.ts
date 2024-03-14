/* eslint-disable no-fallthrough */
import { generator } from '../generator'
import { test } from '@jest/globals'

const expected = 'arg1_greater_than_1'

function fun (this: any, arg1: number): ReturnType<typeof generator> {
  return generator(this, function (_a) {
    switch (_a.label) {
      case 0:
        if (!(arg1 > 1)) return [3 /* break */, 2]
        return [4 /* yield */, expected]
      case 1:
        _a.sent()
        _a.label = 2
      case 2: return [2]
    }
  })
}

test('A generator with a basic if true->yield', () => {
  const iter = fun(2)
  let value = iter.next()
  expect(value.done).toBe(false)
  expect(value.value).toBe(expected)
  value = iter.next()
  expect(value.done).toBe(true)
  expect(value.value).toBeUndefined()
})
