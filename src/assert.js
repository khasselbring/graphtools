
import stackTrace from 'stack-trace'

class InvalidArgumentException extends Error {
  constructor (message, functionname) {
    super(message)
    const strace = stackTrace.parse(this)
    this.message = this.message.replace('%function', functionname || strace[3].getFunctionName() || (strace[3].getFileName() + ':' + strace[3].getLineNumber()))
  }
}

export function assertGraph (graph, argnum, functionname) {
  if (typeof (graph) !== 'object') {
    throw new InvalidArgumentException('Input ' + argnum + ' is not a graph (it is a ' + typeof (graph) + ') in %function', functionname)
  }
}
