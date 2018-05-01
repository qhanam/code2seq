const fs = require("fs");
const esprima = require("esprima");
const applyDepthAbstraction = require("./depth-abstraction.js");
const applyVocabAbstraction = require("./vocab-abstraction.js"); 

function Code2Seq () {

	let vocab = new Set();

	/**
	 * Helper function for checking if the AST includes one function.
	 */
	function isFunctionAnalysis(ast) {
		return ast.body.length === 1 && ast.body[0].type === 'FunctionDeclaration';
	}

	/**
	 * Converts an AST to a sequence of words.
	 * @param ast The AST to convert
	 * @param topN The top N non-reserved words as an array
	 * @param vocab The vocabulary including reserved and non-reserved words.
	 */
	this.ast2Seq = function (ast, topN) {

		/* Set the abstraction depth. */
		let abstractionDepth = 0;
		if(isFunctionAnalysis(ast)) {
			abstractionDepth = 1;
		}

		/* Abstract nested functions and object literals. */
		applyDepthAbstraction(ast, {
			FunctionDeclaration: { type: 'Identifier', name: '@function' },
			FunctionExpression: { type: 'Identifier', name: '@function' },
			ObjectExpression: { type: 'Identifier', name: '@objectlit' }
		}, abstractionDepth)

		/* Abstract terms not in the vocabulary. */
		if(topN) applyVocabAbstraction(ast, new Set(topN));

	}

	/**
	 * @return the vocab, which includes reserved and non-reserved words.
	 */
	this.getVocab = function() {
		return vocab;
	}

}

module.exports = Code2Seq;
