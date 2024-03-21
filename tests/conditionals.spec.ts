/* eslint-disable no-fallthrough */
import { generator } from '../generator'
import { test } from '@jest/globals'

const expected = 'arg1_greater_than_1'
/**
 * @link https://www.typescriptlang.org/play?target=1#code/GYVwdgxgLglg9mAVAAgOYFMwEYAUBDAJ1SwC5kwQBbAI3QIEpkBvAWAChlPkZhl8isyAHzIsjVhy5SAnjHQAbACbIARIWIB9VAXR4odDVAAWeMBqwqA3OykBfdraA
 */
function gen1 (this: any, arg1: number): ReturnType<typeof generator> {
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
  const iter = gen1(2)
  let value = iter.next()
  expect(value.done).toBe(false)
  expect(value.value).toBe(expected)
  value = iter.next()
  expect(value.done).toBe(true)
  expect(value.value).toBeUndefined()
})
