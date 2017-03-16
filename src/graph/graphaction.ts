import {Node} from '../node'

export type GraphCallback = (payload, g:Node) => Node

export type GraphAction = (graph: Node, ...callback: GraphCallback[]) => Node
