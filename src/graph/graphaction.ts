import {Portgraph} from './graph'

export type GraphCallback = (payload, g:Portgraph) => Portgraph

export type GraphAction = (graph: Portgraph, ...callback: GraphCallback[]) => Portgraph
