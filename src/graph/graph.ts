import {ConcreteNode} from '../node'
import {Component} from '../component'

export interface Portgraph extends ConcreteNode {
  components: Component[]
}
