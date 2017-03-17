import * as graph from '../../graph'
import Graph from '../Graph'

export default class FlowGraph {
  private flowChain = []

  constructor (private data: object) {
  }

  private pushAction (action) {
    this.flowChain.push(action)
    return this
  }

  addComponent (component: any) {
    return this.pushAction(graph.addComponent(component))
  }

  addNode (node: Node, fn: (node: Node, graph: Graph) => Graph) {
    return this.pushAction(graph.addNode(node, fn))
  }

  value () {
    return new Graph(graph.flow(this.flowChain)(this.data))
  }
}
