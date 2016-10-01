
const flow = require('lodash/fp/flow')
const curry = require('lodash/fp/curry')

const specialFlow = function () {
  var args = null
  if (Array.isArray(arguments[0])) {
    args = arguments[0]
  } else {
    args = arguments
  }
  return (list) => [].reduce.call(args, (obj, fn, idx) => {
    var newList = fn(obj.list, (data) => { obj.store[idx] = data; return obj })
    return {list: newList, store: obj.store}
  }, {list, store: {}}).list
}

var cnt = 0

const addElem = curry((elem, list, ...args) => {
  if (!elem.id) {
    elem.id = cnt++
  }
  if (args[0]) {
    args[0](elem.id)
  }
  return list.concat([elem])
})

const addElemAt = curry((pos, elem, list, ...args) => {
  if (!elem.id) {
    elem.id = cnt++
  }
  if (args[0]) args[0](elem.id)
  return [].concat(list.slice(0, pos), [elem], list.slice(pos))
})

const getElem = curry((id, list) => {
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      return list[i]
    }
  }
  return
})

const removeElem = curry((id, list, ...args) => {
  if (args[0]) args[0](id)
  return list.filter((item) => item.id === id)
})

const removePos = curry((pos, list, ...args) => {
  console.log('remove id', list[pos].id)
  if (args[0]) args[0](list[pos].id)
  return list.filter((item) => item.id !== list[pos].id)
})

const setID = curry((node, id) => {
  node.id = id
  return node
})

const procFlow = (fn) =>
  (graph, objs) => {
    var o = objs()
    console.log('proc', o.store)
    return fn(o.store)(graph, objs)
  }
const store = (fn, name) =>
  (graph, objs) => {
    var o = objs().store
    return fn(graph, (store) => {
      o[name] = store
      return o
    })
  }

const replacePos = curry((pos, newElem, list) => {
  return specialFlow(
    store(removePos(pos), 'a'),
    procFlow((objs) => addElemAt(pos, setID(newElem, objs['a'])))
  )(list)
})

var res = flow(
  addElem({val: 1}),
  addElem({val: 5}),
  addElem({val: 2}),
  getElem(1)
)([])

console.log(res)

var res2 = specialFlow(
  addElem({val: 1}),
  addElem({val: 5}),
  addElem({val: 2}),
  replacePos(1, {val: 7})
)([])

console.log(res2)

var list = specialFlow(
  store(addElem({val: 1}), 'A'),
  store(addElem({val: 2}), 'B'),
  procFlow((objs) => addElem({a: objs['A'], b: objs['B']}))
)([])

console.log(list)

var list2 = specialFlow(
  addElem({val: 1}),
  addElem({val: 2}),
  procFlow((objs) => addElem({a: objs[0], b: objs[1]}))
)([])

console.log(list2)

