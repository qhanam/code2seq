(function () {
	'use strict';

	var statementGenerator,
		expressionGenerator;

	/**
	 * Adds values of 'b' to array 'a'.
	 */
	function join(a, b) {
		 Array.prototype.push.apply(a, b);
		 return a;
 	}

	statementGenerator = {

		Program: function(node) {
			
			let seq = [];

			for(let i = 0; i < node.body.length; i++) {
				join(seq, statementGenerator[node.body[i].type](node.body[i]));
			}

			return seq;

		},

		Block: function(node) {
			return ['{', 'statements', '}'];
		},

		VariableDeclaration: function(node) {

			let seq = [];

			for(let i = 0; i < node.declarations.length; i++) {
				let declarator = node.declarations[i];
				join(seq, expressionGenerator[declarator.type](declarator));
				if(i !== node.declarations.length - 1) seq.push(',');
			}

			seq.unshift('var');
			seq.push(';');

			return seq

		}

	};

	expressionGenerator = {

		VariableDeclarator: function(node) {
			let id, init;
			id = expressionGenerator[node.id.type](node.id);
			if(node.init === null) return [id];
			id.push('=');
			init = expressionGenerator[node.init.type](node.init);
			return join(id, init);
		},

		Identifier: function(node) {
			return [node.name];	
		},

		Literal: function(node) {
			return [node.raw];
		},

		ArrayExpression: function(node) {
			let seq = ['['];
			for(let i = 0; i < node.elements.length; i++) {
				let element = node.elements[i];	
				join(seq, expressionGenerator[element.type](element));
				if(i !== node.elements.length - 1) seq.push(',');
			}
			seq.push(']');
			return seq;
		}

	};

	function generate(node) { 

		/* TODO: Recursively generate sequence for node. */
		return statementGenerator[node.type](node).join(' ');
	
	}

	exports.generate = generate;

}());
