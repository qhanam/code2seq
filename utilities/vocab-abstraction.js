/* Replaces identifiers and literals that aren't in the vocabulary with a new abstract node. */

const walk = require("estree-walk");

const blacklistedKeys = [
  'parent',
];

module.exports = applyvocab;

function applyvocab (node, topn) {

  for (var queue = [node]; queue.length;) {
    node = queue.shift()

    // Skip a missing node
    if (!node) continue

    // Continue walking
    step(node, queue, topn)
  }

}

function step (node, queue, topn) {
  var before = queue.length

	let abstractNodes = {
		Identifier: { type: 'Identifier', name: '@identifier' },
		NumberLiteral: { type: 'Identifier', name: '@numlit' },
		StringLiteral: { type: 'Identifier', name: '@stringlit' },
		RegExLiteral: { type: 'Identifier', name: '@regexlit' }
	}

  // Enumerate keys for possible children
  for (var key in node) {
    if (blacklistedKeys.indexOf(key) >= 0) continue

    var child = node[key]

    if (child && child.type) {

			if(child.type === "Identifier" && !topn.has(child.name)) {
				node[key] = Object.assign({}, abstractNodes.Identifier);
			}
			else if(child.type === "Literal" 
				&& !topn.has(child.raw.replace(/\s+/g, '_'))) {
				if(typeof child.value === 'number') node[key] = abstractNodes.NumberLiteral;
				if(typeof child.value === 'string') node[key] = abstractNodes.StringLiteral;
				if(typeof child.value === 'object') node[key] = abstractNodes.RegExLiteral;
			}
			else {
				/* Otherwise push the node. */
				queue.push(child)
			}

    }

    if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++) {
        var item = child[i]
        if (item && item.type) {

					if(item.type === "Identifier" && !topn.has(item.name)) {
						child[i] = Object.assign({}, abstractNodes.Identifier);
					}
					else if(item.type === "Literal" 
						&& !topn.has(item.raw.replace(/\s+/g, '_'))) {
						if(typeof item.value === 'number') child[i] = abstractNodes.NumberLiteral;
						if(typeof item.value === 'string') child[i] = abstractNodes.StringLiteral;
						if(typeof item.value === 'object') child[i] = abstractNodes.RegExLiteral;
					}
					else {
						/* Otherwise push the node. */
						queue.push(item)
					}

        }
      }
    }
  }

  // Return whether any children were pushed
  return queue.length !== before
}

