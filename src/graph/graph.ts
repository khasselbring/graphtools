import { Compound, ConcreteNode } from '../node'
import { Component } from '../component'

export interface Portgraph extends Compound {
  components: Component<ConcreteNode>[]
}
