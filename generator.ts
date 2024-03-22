/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/space-before-function-paren */
// NOTES
// -----
// One way to think about this is that a "generator" is the abstraction (function*)
// that returns an "iterator" for every occurrence of the "yield" keyword.
// An "iterator" is the lower level object that allows you (via "next()") to continue
// execution of the generator from wherever the last stopping point was. "next()" will
// also return an object (and "iterator result") with the value of what's been yielded, as well
// as a flag ("done") that tells you if you can keep going within the generator.

/** The instruction to handle within the generator's engine */
enum Opcode {
  NEXT /********/ = 0b000,
  THROW /*******/ = 0b001,
  RETURN /******/ = 0b010,
  BREAK /*******/ = 0b011,
  YIELD /*******/ = 0b100,
  YIELDSTAR /***/ = 0b101,
  CATCH /*******/ = 0b110,
  ENDFINALLY /**/ = 0b111,
}
type IteratorNextArgs = Parameters<Iterator<Result>['next']>
type IteratorThrowArgs = Error
type IteratorReturnArgs = Result
/** This is the data returned from the iterator */
type Result = any
type Func = (...args: any[]) => any
/** A "program counter" for a location w/in a generator body */
type Label = number
type ResultIterator = Iterator<Result>
/** next() or throw() or return() */
type IteratorFunction = (
  args: IteratorNextArgs | IteratorThrowArgs | IteratorReturnArgs,
) => IteratorResult<Result>
type OpcodeAndResult = [Opcode, Result]
interface TryCatchFinallyLabels {
  try: Label
  catch: Label
  finally: Label
  endfinally: Label
}
/**
 * Persistent state for the generator that is shared between the generator's
 * internals as well as the generator body
 */
class State {
  /** The next location to resume evaluation of the generator body */
  label: Label = 0
  sendArg?: OpcodeAndResult
  /** A method that returns or throws the current completion value */
  sent(): Result {
    const arg = this.sendArg
    if (arg == null) {
      return new Error('Nothing to send')
    }
    const [opcode, result] = arg
    if (opContains(opcode, Opcode.THROW)) {
      throw result
    }
    return result
  }

  /** A stack of try/catch/finally/endfinally labels */
  trys: Array<
  [
    Label,
    Label | undefined, // There may be no "catch" block
    Label | undefined, // There may be no "finally" block
    Label,
  ]
  > = []

  /** A stack of pending instructions when inside of a finally block */
  ops: OpcodeAndResult[] = []
}

class GeneratorCore {
  isGeneratorExecuting: boolean = false
  state: State | undefined = new State()
  subIterator: ResultIterator | undefined

  constructor (
    public thisArg: any,
    public body: Func
  ) {
    /* ... */
  }

  public step (op: OpcodeAndResult): IteratorResult<Result> {
    if (this.isGeneratorExecuting) {
      throw new Error('Generator is already executing')
    }
    return this.stepEngine(op)
  }

  private stepEngine (op: OpcodeAndResult): IteratorResult<Result> {
    // break:
    //     will exit the switch and execute the generator body
    // continue:
    //     will re-run the engine (usually after another opcode is set)
    // return:
    //     will output designated iter result. This is essentially the
    //     return value of iter.next()
    while (this.state) {
      try {
        this.isGeneratorExecuting = true

        const subIteratorResult = this.tryRunSubIterator(op)
        if (subIteratorResult) {
          if (subIteratorResult.done) {
            return subIteratorResult
          }
          op = [opContains(op[0], Opcode.RETURN), subIteratorResult.value]
        }
        let tcfLabels: TryCatchFinallyLabels | undefined
        const opcode = op[0]
        switch (opcode) {
          // NEXT and THROW both queue up the state.sent() value and
          // skip to executing the generator body.
          // Note that this will modify "op" and potentially "state",
          // and the loop will restart
          case Opcode.NEXT:
          case Opcode.THROW:
            this.state.sendArg = op
            break // Go to next label in the generator body

          // YIELD will return the value, and increment the label
          case Opcode.YIELD:
            this.state.label++
            // Return result to caller of generator
            return {
              value: op[1],
              done: false
            }

          // YIELDSTAR will restart the loop, and increment the label.
          // In the subsequent iteration, the sub-iterator will be run
          case Opcode.YIELDSTAR:
            this.state.label++
            this.subIterator = op[1] as ResultIterator
            op = [Opcode.NEXT, undefined]
            continue // Re-enter engine with next op

          // ENDFINALLY marks the exit of a try/catch/finally. "op" will
          // be set to the label right after the finally block
          case Opcode.ENDFINALLY:
            op = this.state.ops.pop()!
            this.state.trys.pop()
            continue // Re-enter engine with next op

          default:
            tcfLabels = this.getTcfLabels()

            // If there's no more t/c/f entries, and we're
            // this is a CATCH or RETURN, then it's time to
            // kill the loop and return the result
            if (
              !tcfLabels &&
              (opEquals(opcode, Opcode.CATCH) ||
                opEquals(opcode, Opcode.RETURN))
            ) {
              this.setWhileLoopConditionToEvaluateFalse()
              continue // Think of this as a "break" for the while loop
            }

            // BREAK op will return the next label (program counter)
            if (opEquals(opcode, Opcode.BREAK)) {
              const nextLabel = op[1] as Label
              if (
                // If this is a normal BREAK (not within t/c/f)
                !tcfLabels || // ...or...
                // If we're within a t/c/f, only set the next label if we're
                // between (not inclusive) the "try" and "finally" labels
                (nextLabel > tcfLabels.try && nextLabel < tcfLabels.endfinally)
              ) {
                // Set the next location to go to in the generator body
                this.state.label = nextLabel
                break // Go to next label in the generator body
              }
            }

            // If we're within a t/c/f
            if (tcfLabels) {
              // (At this point, we've determined that opcode is not BREAK)

              if (
                // If an error occurred while running the generator body
                opEquals(opcode, Opcode.CATCH) && // ...and...
                // If we have a "catch" block available to go to
                this.state.label < tcfLabels.catch
              ) {
                this.state.label = tcfLabels.catch
                this.state.sendArg = op
                break // Go to next label in the generator body
              }

              // (At this point, we've determined that opcode is not CATCH)

              // If we have a finally, and we're not there yet, then let's enter it
              if (this.state.label < tcfLabels.finally) {
                this.state.label = tcfLabels.finally
                this.state.ops.push(op)
                break // Go to next label in the generator body
              }
              // TODO explain this
              // The only place we handle queued ops is w/in ENDFINALLY (?)
              if (tcfLabels.finally) {
                this.state.ops.pop()
              }
            }
            this.state.trys.pop()
            // TODO what reaches this?
            continue // Re-enter engine with next op
        }
        op = this.body.call(this.thisArg, this.state)
      } catch (e) {
        op = [Opcode.CATCH, e]
        this.subIterator = undefined
      } finally {
        if (this.state) {
          this.state.sendArg = undefined
        }
        this.isGeneratorExecuting = false
      }
    }
    if (opContains(op[0], Opcode.YIELDSTAR)) {
      throw op[1]
    }
    // Return result to caller of generator
    return {
      value: opNotNext(op[0]) ? op[1] : undefined,
      done: true
    }
  }

  private getTcfLabels (): TryCatchFinallyLabels | undefined {
    const tcfStacks = this.state?.trys.length ?? 0
    if (tcfStacks) {
      const [t, c, f, endfinally] = this.state!.trys[tcfStacks - 1]
      return {
        try: t,
        catch: c ?? 0,
        finally: f ?? 0,
        endfinally
      }
    }
    return undefined
  }

  private setWhileLoopConditionToEvaluateFalse (): void {
    this.state = undefined
  }

  private tryRunSubIterator (
    op: OpcodeAndResult
  ): IteratorResult<Result> | undefined {
    let result: IteratorResult<Result> | undefined
    if (this.subIterator) {
      result = this.runSubIterator(op).result
    }
    this.subIterator = undefined
    return result
  }

  private runSubIterator (op: OpcodeAndResult): {
    return: boolean
    result?: Result
  } {
    const opcode = op[0]
    if (!this.subIterator) {
      throw new Error('resultIterator not defined')
    }
    let iteratorFn: IteratorFunction | undefined
    if (opContains(opcode, Opcode.RETURN)) {
      iteratorFn = this.subIterator.return?.bind(this.subIterator)
    } else if (opNotNext(opcode)) {
      if (this.subIterator.throw) {
        iteratorFn = this.subIterator.throw.bind(this.subIterator)
      } else {
        this.subIterator.return?.()
      }
    } else {
      iteratorFn = this.subIterator.next.bind(this.subIterator)
    }
    const result = iteratorFn?.(op[1])
    return {
      result,
      return: !(result?.done)
    }
  }
}

function opEquals (a: Opcode, b: Opcode): boolean {
  return a === b
}

// TODO
// Verify that the AND-ed bits really mean something
// when compared to other opcodes bits
function opContains (a: Opcode, b: Opcode): number {
  return a & b
}

function opNotNext (opcode: Opcode): boolean {
  return opcode > Opcode.NEXT
}

export const generator = (thisArg: any, body: Func): ResultIterator => {
  const core = new GeneratorCore(thisArg, body)
  return {
    next: (val?: Result) => core.step([Opcode.NEXT, val])
  }
}
