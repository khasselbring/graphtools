# Buggy graphtools

This package contains the graph API for Buggy graphs.

# Graph structure

A graph in Buggy is a directed, multigraph that allows compounds. Compounds are
subgraphs in a node of the graph itself. You can picture it like this:

![A compound node that contains another graph.](doc/compound.png)

Each node in the graph also has to have at least one port. Ports
are divided into input (green) and output ports (red). The format
for a graph is JSON which contains five basic fields:

```json
{
  "nodes": [
    {"ref": "<meta-id>", "id": "<some-unique-id>"},
    {"id": "<u-id>", "version": "<semver-version>", "componentId": "<component-id>",
     "ports": [{"port": "<port-name>", "kind": "input|output", "type": "number"}],
     "atomic": "true", "metaInformation": {"some-key": "some-value"}},
    {"id": "<u-id>", "version": "<semver-version>", "atomic": false,
     "ports": [{"port": "<port-name>", "kind": "input|output", "type": "number"}],
     "nodes": <Sub-Nodes>, "edges": <Sub-Edges>, "metaInformation": {"some-key": "some-value"}},
  ],
  "edges": [
    {"from": "<node-id>:<port-name>", "to": "<node-id>:<port-name>", "layer": "dataflow"}
  ],
  "version": "<semver-version of graph API>",
  "components": [
    {"componentId": "<component-id>", "ports": [...], "atomic": true},
    {"componentId": "<component-id>", "ports": [...], "nodes": <Sub-Nodes>, "edges": <Sub-Edges>}
  ],
  "metaInformation": {"some-key": "some-value"}
}
```

# Usage

```
import * as Graph from '@buggorg/graphtools'

Graph.nodes(graph)
Graph.Node.id(graph)
```

You can find the JSDoc documentation [here](https://buggyorg.github.io/graphtools/index.html)
