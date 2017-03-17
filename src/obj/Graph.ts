import * as graph from '../graph'
import FlowGraph from './flow/FlowGraph'

class CompoundNode {
  constructor (protected data: object) {
  }
}

export default class Graph extends CompoundNode {
  constructor (data: object) {
    super(data)
  }

  flow (): FlowGraph {
    return new FlowGraph(this.toObject())
  }

  addComponent (component: any) {
    return new Graph(graph.addComponent(component, this.data))
  }

  addNode (node) {
    const result = graph.addNodeTuple(node, this.data)
    return {
      graph: result[0],
      node: result[1]
    }
  }

  toObject () {
    return Object.assign({}, this.data)
  }
}
