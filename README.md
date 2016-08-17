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
  "Nodes": [
    {"ref": "<meta-id>", "id": "<some-unique-id>"},
    {"id": "<u-id>", "version": "<semver-version>", "meta": "<meta-id>",
     "ports": [{"name": "<port-name>", "kind": "input|output", "type": "number"}],
     "atomic": "true", "meta": {"some-key": "some-value"}},
    {"id": "<u-id>", "version": "<semver-version>",
     "ports": [{"name": "<port-name>", "kind": "input|output", "type": "number"}],
     "implementation": <Graph>, "meta": {"some-key": "some-value"}},
  ],
  "Edges": [
    {"from": "<node-id>:<port-name>", "to": "<node-id>:<port-name>"}
  ],
  "version": "<semver-version of graph API>",
  "Components": [
    {"meta": "<meta-id>", "ports": [...], "atomic": true},
    {"meta": "<meta-id>", "ports": [...], "implementation": <Graph>}
  ]
  "meta": {"some-key": "some-value"}
}
```
