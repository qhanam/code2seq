/* Replaces identifiers and literals that aren't in the vocabulary with a new abstract node. */

const walk = require("estree-walk");

const blacklistedKeys = [
  'parent',
];

let unique = 0; // Unique ID so identifiers are unique

module.exports = applyvocab;

function applyvocab (node, topn) {

	unique = 0; // Reset for new code
	
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
		Identifier: { type: 'Identifier', name: '__abs__identifier' },
		NumberLiteral: { type: 'Identifier', name: '__abs__numlit' },
		StringLiteral: { type: 'Identifier', name: '__abs__stringlit' },
		RegExLiteral: { type: 'Identifier', name: '__abs__regexlit' }
	}

  // Enumerate keys for possible children
  for (var key in node) {
    if (blacklistedKeys.indexOf(key) >= 0) continue

    var child = node[key]

    if (child && child.type) {

			if(child.type === "Identifier" && !topn.has(child.name)) {
				unique++;
				node[key] = Object.assign({}, abstractNodes.Identifier);
				node[key].name += "__" + unique + "__";
			}
			else if(child.type === "Literal" 
				&& !topn.has(child.raw)) {
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
						child[i].name += "__" + unique + "__";
					}
					else if(item.type === "Literal" 
						&& !topn.has(item.raw)) {
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

