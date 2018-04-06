/* Tracks common vocab. */

const esprima = require("esprima");
const walk = require("estree-walk");
const TrieHeap = require("./trietree.js");

function Vocab (vocabSize) {

	let topvocab = new TrieHeap(vocabSize);
	let ctr = 0;

	/**
	 * Add the vocab from the AST to the vocab map.
	 */
	this.add = function(ast) {
		walk(ast, {
				Identifier: function(node, stop) { 
					topvocab.incrementWordCount(node.name);
				},
				Literal: function(node, stop) { 
					if(node.value === Object(node.value)) return; // Avoid RegEx
					topvocab.incrementWordCount(node.raw);
				}
			});
	}

	/**
	 * @return the vocabulary as a string.
	 */
	this.print = function() {
		topvocab.printHeap();
	}

	/**
	 * @return the top entries in the vocab.
	 */
	this.getTopN = function() {
		let topN = [];
		topvocab.forEach(function (word) {
			topN.push(word);
		});
		return topN;
	}

	/**
	 * Add the vocab from the commit-file to the vocab map.
	 */
	this.addCommitFile = function(comfile) {

		ctr++;
		console.log("%d: %s - %s", ctr, comfile.url, comfile.fileName);

		/* Iterate through code pairs. */
		for(let j = 0; j < comfile.sliceChangePair.length; j++) {

			let pair = comfile.sliceChangePair[j];
			let beforeAST = null;
			let afterAST = null;

			if(pair.type !== "MUTANT_REPAIR") continue; // The vocab should specialize in the repair sequences

			try {
				afterAST = esprima.parse(pair.after);
			} catch (e) {
				continue; // Skip stuff that can't be parsed.
			}

			this.add(afterAST);

		}
	}

}

module.exports = Vocab;
