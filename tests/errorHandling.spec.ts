/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-fallthrough */
import { generator } from '../generator'
import { test } from '@jest/globals'

const expected1 = 'arg1_greater_than_1'
const expected2 = 'done'
function willThrow (): boolean { throw new Error() }
/**
 * @link https://www.typescriptlang.org/play?target=1#code/GYVwdgxgLglg9mABAdxgGzQFQBYCc7IAUAlAFyIBGccaApgIZKIDeiUeBiYtyiAorny4SiAL4BYAFChIsBACpEMwvVwBzAIzkwIALYVauYiymIzbXAE8Tk83cQxgiFeo2IAfIg3Hmp+-8sYWjQAE0QAIlVNAH01XAYoQ2j2RmiNcIBuP38JW38HJ0JUDBx8ImIfbPyzQOCw8O4AN0Nwqrtc9sQIeigIbGdaSrz-CAQAZxpaADo0ODVCQarRJRgwegxrX2H7WtCIkIRaVu3c0SA
 */
function gen1 (this: any, arg1: number): Iterator<number> {
  let e_1
  return generator(this, function (_a: any) {
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
        console.assert(e_1)
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
  const iter = gen1(2)
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
