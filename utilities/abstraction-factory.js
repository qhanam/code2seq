const fs = require("fs");
const esprima = require("esprima");
const applyDepthAbstraction = require("./depth-abstraction.js");
const applyVocabAbstraction = require("./vocab-abstraction.js"); 
const escodegen = require("escodegen");

function Code2Seq (topN) {

	let vocab = new Set();

	/**
	 * Helper function for converting a list of tokens to a sequence of words.
	 */
	function tokens2Sequence(tokens, vocab) {
		let sequence = [];
		for(let i = 0; i < tokens.length; i++) {
			let token = tokens[i].value.replace("__abs__", "@").replace(/__\d+__/, "");
			sequence.push(token);
			vocab.add(token);
		}
		return sequence.join(" ") + "\n";
	}

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
			FunctionDeclaration: { type: 'Identifier', name: '__abs__function' },
			FunctionExpression: { type: 'Identifier', name: '__abs__function' },
			ObjectExpression: { type: 'Identifier', name: '__abs__objectlit' }
		}, abstractionDepth)

		/* Abstract terms not in the vocabulary. */
		applyVocabAbstraction(ast, new Set(topN));

		let code = escodegen.generate(ast);

		/* Generate the sequences. */
		try {
			ast = esprima.parse(code, { tokens: true });
		} catch (e) {
			console.log("error parsing abstracted code");
			return null;
		}

		return tokens2Sequence(ast.tokens, vocab);

	}

	/**
	 * @return the vocab, which includes reserved and non-reserved words.
	 */
	this.getVocab = function() {
		return vocab;
	}

}

module.exports = Code2Seq;
