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
				let stmt = node.body[i];
				join(seq, statementGenerator[stmt.type](stmt));
			}

			return seq;

		},

		BlockStatement: function(node) {
			let seq = ['{'];
			for(let i = 0; i < node.body.length; i++) {
				let stmt = node.body[i];
				join(seq, statementGenerator[stmt.type](stmt));
			}
			seq.push('}');
			return seq;
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

		},

		ExpressionStatement: function(node) {
			let expression = node.expression;
			let seq = expressionGenerator[expression.type](expression);
			seq.push(';');
			return seq;
		},

		BreakStatement: function(node) {
			let seq = ['break'], label = node.label;
			if(label !== null) join(seq,expressionGenerator[label.type](label));
			seq.push(';');
			return seq;
		},

		ContinueStatement: function(node) {
			let seq = ['continue'], label = node.label;
			if(label !== null) join(seq,expressionGenerator[label.type](label));
			seq.push(';');
			return seq;
		},

		WhileStatement: function(node) {
			let seq = ['while','('], 
				test = node.test, 
				body = node.body;
			join(seq, expressionGenerator[test.type](test));
			seq.push(')');
			join(seq, statementGenerator[body.type](body));
			return seq;
		},

		DoWhileStatement: function(node) {
			let seq = ['do'],
				test = node.test,
				body = node.body;
			join(seq, statementGenerator[body.type](body));
			join(seq, ['while','(']);
			join(seq, expressionGenerator[test.type](test));
			seq.push(')');
			return seq;
		},

		EmptyStatement: function(node) {
			return [';'];
		},

		LabeledStatement: function(node) {
			let seq = [],
				label = node.label,
				body = node.body;
			join(seq, expressionGenerator[label.type](label));
			seq.push(':');
			join(seq, statementGenerator[body.type](body));
			return seq;
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
		},

		AssignmentExpression: function(node) {
			let left = node.left, right = node.right, seq = [];
			join(seq, expressionGenerator[left.type](left));
			seq.push(node.operator);
			join(seq, expressionGenerator[right.type](right));
			return seq;
		},

		ConditionalExpression: function(node) {
			let seq = [],
				test = node.test,
				consequent = node.consequent,
				alternate = node.alternate;
			join(seq, expressionGenerator[test.type](test));
			seq.push('?');
			join(seq, expressionGenerator[consequent.type](consequent));
			seq.push(':');
			join(seq, expressionGenerator[alternate.type](alternate));
			return seq;
		}

	};

	function generate(node) { 

		/* TODO: Recursively generate sequence for node. */
		return statementGenerator[node.type](node).join(' ');
	
	}

	exports.generate = generate;

}());
