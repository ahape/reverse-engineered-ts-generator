/* eslint-disable no-fallthrough */
import { generator } from '../generator'
// import { helper } from './helper'

const expected = 'arg1_greater_than_1'

function gen1 (this: any, arg1: number): ReturnType<typeof generator> {
  return generator(this, function (_a: any) {
    switch (_a.label) {
      case 0:
        if (!(arg1 > 1)) return [3 /* break */, 2]
        return [4 /* yield */, 'arg1_greater_than_1']
      case 1:
        _a.sent()
        _a.label = 2
      case 2: return [2]
    }
  })
}

/**
 * @link https://www.typescriptlang.org/play?target=1#code/GYVwdgxgLglg9mAVAAgOYFMwEYAUBDAJ1SwC5kwQBbAI3QIEoy8wBPZAbwFgAoZP5GMGT4iWZAD5kWehx795yFjHQAbACbIARIWIB9VAXR4odXVAAWzXVk0BuOfwC+PZ9x6hIsBCgxQATCLEZBQ0dDJcvPyCwjpiktKykQqKyuo+mLix9A58ro5AA
 */
function gen2 (this: any, arg1: number): ReturnType<typeof generator> {
  return generator(this, function (_a: any) {
    switch (_a.label) {
      case 0:
        if (!(arg1 > 1)) return [3 /* break */, 2]
        return [5 /* yield**/, gen1(arg1)]
      case 1:
        _a.sent()
        _a.label = 2
      case 2: return [2]
    }
  })
}

test('A generator that yields a sub-iterator', () => {
  const iter = gen2(2)
  let res = iter.next()
  expect(res.done).toBe(false)
  expect(res.value).toBe(expected)
  res = iter.next()
  expect(res.done).toBe(true)
  expect(res.value).toBeUndefined()
})
