/* Replaces nodes of certain types with a new abstract node.
 * Adapted from https://github.com/jamen/estree-walk/blob/master/index.js */

module.exports = walk;
walk.step = step;

const blacklistedKeys = [
  'parent',
];

const incDepthStmt = new Set([ 
	'BlockStatement',
	'ObjectExpression'
]);

function walk (node, abstractions, minDepth) {
	
	// Track our depth in the AST with a queue
	var depth;
	var depthQueue = [0];

	minDepth = minDepth ? minDepth : 0;

  for (var queue = [node]; queue.length;) {
    node = queue.shift()
		depth = depthQueue.shift();

    // Skip a missing node
    if (!node) continue

    // Continue walking
    step(node, depth, queue, depthQueue, abstractions, minDepth)
  }
}

function step (node, depth, queue, depthQueue, abstractions, minDepth) {
  var before = queue.length

  // Enumerate keys for possible children
  for (var key in node) {
    if (blacklistedKeys.indexOf(key) >= 0) continue

    var child = node[key]

    if (child && child.type) {
			if(abstractions[child.type] && depth >= minDepth) {
				/* Replace if the type should be abstracted. */
				node[key] = abstractions[child.type];
			}
			else {
				/* Otherwise push the node. */
				queue.push(child)
				incDepthStmt.has(child.type) && depth++;
				depthQueue.push(depth);
			}
    }

    if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++) {
        var item = child[i]
        if (item && item.type) {
					if(abstractions[item.type] && depth >= minDepth) {
						/* Replace if the type should be abstracted. */
						child[i] = abstractions[item.type];
					}
					else {
						/* Otherwise push the node. */
						queue.push(item)
						incDepthStmt.has(item.type) && depth++;
						depthQueue.push(depth);
					}
        }
      }
    }
  }

  // Return whether any children were pushed
  return queue.length !== before
}
