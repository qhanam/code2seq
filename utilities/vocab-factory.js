/* Tracks common vocab. */

const esprima = require("esprima");
const walk = require("estree-walk");
const TrieHeap = require("./trietree.js");
const Code2Seq = require("./abstraction-factory.js");

function Vocab (vocabSize) {

	let topvocab = new TrieHeap(vocabSize);
	let code2seq = new Code2Seq();
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
					topvocab.incrementWordCount(node.raw.replace(/\s+/g, '_'));
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

			let pair = comfile.sliceChangePair[j],
				beforeAST = pair['before-ast'],
				afterAST = pair['after-ast'];

			/* The vocab should specialize in sequences with try statements. */
			if(!pair.labels.includes("MUTATION_CANDIDATE")) continue;

			code2seq.ast2Seq(afterAST, null);

			this.add(afterAST);

		}
	}

}

module.exports = Vocab;
