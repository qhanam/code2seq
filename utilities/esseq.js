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

	/* Functions for turning statements into sequences. */
	statementGenerator = {

		Program: function(node) {
			
			let seq = [];

			for(let i = 0; i < node.body.length; i++) {
				let stmt = node.body[i];
				join(seq, generateStatement(stmt));
			}

			return seq;

		},

		BlockStatement: function(node) {
			let seq = ['{'];
			for(let i = 0; i < node.body.length; i++) {
				let stmt = node.body[i];
				join(seq, generateStatement(stmt));
			}
			seq.push('}');
			return seq;
		},

		VariableDeclaration: function(node) {
			let seq = expressionGenerator.VariableDeclaration(node);
			seq.push(';');
			return seq;
		},

		FunctionDeclaration: function(node) {
			let seq = expressionGenerator.FunctionExpression(node);
			return seq;
		},

		ExpressionStatement: function(node) {
			let expression = node.expression;
			let seq = generateExpression(expression);
			seq.push(';');
			return seq;
		},

		BreakStatement: function(node) {
			let seq = ['break'], label = node.label;
			if(label !== null) join(seq, generateExpression(label));
			seq.push(';');
			return seq;
		},

		ContinueStatement: function(node) {
			let seq = ['continue'], label = node.label;
			if(label !== null) join(seq, generateExpression(label));
			seq.push(';');
			return seq;
		},

		WhileStatement: function(node) {
			let seq = ['while','('], 
				test = node.test, 
				body = node.body;
			join(seq, generateExpression(test));
			seq.push(')');
			join(seq, generateStatement(body));
			return seq;
		},

		DoWhileStatement: function(node) {
			let seq = ['do'],
				test = node.test,
				body = node.body;
			join(seq, generateStatement(body));
			join(seq, ['while','(']);
			join(seq, generateExpression(test));
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
			join(seq, generateExpression(label));
			seq.push(':');
			join(seq, generateStatement(body));
			return seq;
		},

		ForStatement: function(node) {
			let seq = ['for','('],
				init = node.init,
				test = node.test,
				update = node.update,
				body = node.body;
			if(init !== null) join(seq, generateExpression(init));
			seq.push(';');
			if(test !== null) join(seq, generateExpression(test));
			seq.push(';');
			if(update !== null) join(seq, generateExpression(update));
			seq.push(')');
			join(seq, generateStatement(body));
			return seq;
		},

		ForInStatement: function(node) {
			let seq = ['for','('],
				left = node.left,
				right = node.right,
				body = node.body;
			join(seq, generateExpression(left));
			seq.push('in');
			join(seq, generateExpression(right));
			seq.push(')');
			join(seq, generateStatement(body));
			return seq;
		},

		IfStatement: function(node) {
			let seq = ['if','('],
				test = node.test,
				consequent = node.consequent,
				alternate = node.alternate;
			join(seq, generateExpression(test));
			seq.push(')');
			join(seq, generateStatement(consequent));
			if(alternate !== null) {
				seq.push('else');
				join(seq, generateStatement(alternate));
			}
			return seq;
		},

		DebuggerStatement: function(node) {
			return ['debugger',';'];
		},

		ReturnStatement: function(node) {
			let seq = ['return'],
				argument = node.argument;
			if(argument !== null) join(seq, generateExpression(argument));
			seq.push(';');
			return seq;
		},

		SwitchStatement: function(node) {
			let seq = ['switch','('],
				discriminant = node.discriminant,
				cases = node.cases;
			join(seq, generateExpression(discriminant));
			seq.push(')');
			seq.push('{');
			for(let i = 0; i < cases.length; i++) {
				let cas = cases[i];
				join(seq, generateExpression(cas));
			}
			seq.push('}');
			return seq;
		},

		ThrowStatement: function(node) {
			let seq = ['throw'],
				argument = node.argument;
			join(seq, generateExpression(argument));
			seq.push(';');
			return seq;
		},

		TryStatement: function(node) {
			let seq = ['try'],
				block = node.block,
				handler = node.handler,
				finalizer = node.finalizer;
			join(seq, generateStatement(block));
			join(seq, generateExpression(handler));
			if(finalizer !== null) {
				seq.push('finally');
				join(seq, generateStatement(finalizer));
			}
			return seq;
		},

		Identifier: function(node) {
			return expressionGenerator.Identifier(node);
		}

	};

	/* Functions for turning expressions into sequences. */
	expressionGenerator = {

		VariableDeclarator: function(node) {
			let seq = [], 
				id = node.id,
				init = node.init;
			join(seq, generateExpression(id));
			if(init !== null) {
				seq.push('=');
				join(seq, generateExpression(init));
			}
			return seq;
		},

		Identifier: function(node) {
			return [node.name];
		},

		Literal: function(node) {
			return [node.raw.replace(/\s+/g, '_')];
		},

		ArrayExpression: function(node) {
			let seq = ['['];
			for(let i = 0; i < node.elements.length; i++) {
				let element = node.elements[i];	
				join(seq, generateExpression(element));
				if(i !== node.elements.length - 1) seq.push(',');
			}
			seq.push(']');
			return seq;
		},

		AssignmentExpression: function(node) {
			let left = node.left, right = node.right, seq = [];
			join(seq, generateExpression(left));
			seq.push(node.operator);
			join(seq, generateExpression(right));
			return seq;
		},

		ConditionalExpression: function(node) {
			let seq = [],
				test = node.test,
				consequent = node.consequent,
				alternate = node.alternate;
			join(seq, generateExpression(test));
			seq.push('?');
			join(seq, generateExpression(consequent));
			seq.push(':');
			join(seq, generateExpression(alternate));
			return seq;
		},

		EmptyExpression: function(node) {
			return [];
		},

		EmptyStatement: function(node) {
			return expressionGenerator.EmptyExpression(node);
		},

		MemberExpression: function(node) {
			let seq = [],
				object = node.object,
				property = node.property;
			join(seq, generateExpression(object));
			if(node.computed) {
				seq.push('[');
				join(seq, generateExpression(property));
				seq.push(']');
			}
			else {
				seq.push('.');
				join(seq, generateExpression(property));
			}
			return seq;
		},

		VariableDeclaration: function(node) {

			let seq = [node.kind];

			for(let i = 0; i < node.declarations.length; i++) {
				let declarator = node.declarations[i];
				join(seq, generateExpression(declarator));
				if(i !== node.declarations.length - 1) seq.push(',');
			}

			return seq

		},

		EmptyExpression: function(node) {
			return [];
		},

		XmlLiteral: function(node) {
			return ['@xmllit'];
		},

		CallExpression: function(node) {
			let seq = [],
				callee = node.callee,
				args = node.arguments;
			join(seq, generateExpression(callee));
			seq.push('(');
			for(let i = 0; i < args.length; i++) {
				let arg = args[i];
				join(seq, generateExpression(arg));
				if(i !== args.length - 1) seq.push(',');
			}
			seq.push(')');
			return seq;
		},

		FunctionDeclaration: function(node) {
			return expressionGenerator.FunctionExpression(node);
		},

		FunctionExpression: function(node) {
			let seq = ['function'],
				id = node.id,
				params = node.params,
				body = node.body;
			if(id !== null)	join(seq, generateExpression(id));
			seq.push('(');
			for(let i = 0; i < params.length; i++) {
				let param = params[i];
				join(seq, generateExpression(param));
				if(i !== params.length - 1) seq.push(',');
			}
			seq.push(')');
			join(seq, generateStatement(body));
			return seq;
		},

		BinaryExpression: function(node) {
			let seq = [],
				operator = node.operator,
				left = node.left,
				right = node.right;
			join(seq, generateExpression(left));
			seq.push(operator);
			join(seq, generateExpression(right));
			return seq;
		},

		AssignmentExpression: function(node) {
			return expressionGenerator.BinaryExpression(node);
		},

		LogicalExpression: function(node) {
			return expressionGenerator.BinaryExpression(node);
		},

		ThisExpression: function(node) {
			return ['this'];
		},

		NewExpression: function(node) {
			let seq = ['new'],
				callee = node.callee,
				args = node.arguments;
			join(seq, generateExpression(callee));
			seq.push('(');
			for(let i = 0; i < args.length; i++) {
				let arg = args[i];
				join(seq, generateExpression(arg));
				if(i !== args.length - 1) seq.push(',');
			}
			seq.push(')');
			return seq;
		},

		ObjectExpression: function(node) {
			let seq = ['{'],
				properties = node.properties;
			for(let i = 0; i < properties.length; i++) {
				let property = properties[i];
				join(seq, generateExpression(property));
				if(i !== properties.length - 1) seq.push(',');
			}
			seq.push('}');
			return seq;
		},

		Property: function(node) {
			let seq = [],
				key = node.key,
				value = node.value,
				computed = node.computed,
				kind = node.kind,
				method = node.method,
				shorthand = node.shorthand;
			if(computed) {
				seq.push('[');
				join(seq, generateExpression(key));
				seq.push(']');
			}
			else {
				join(seq, generateExpression(key));
			}
			seq.push(':');
			join(seq, generateExpression(value));
			return seq;
		},

		SwitchCase: function(node) {
			let seq = [],
				test = node.test,
				consequent = node.consequent;
			if(test === null) {
				seq.push('default');
			}
			else {
				seq.push('case');
				join(seq, generateExpression(test));
			}
			seq.push(':');
			for(let i = 0; i < consequent.length; i++) {
				let stmt = consequent[i];
				join(seq, generateStatement(stmt));
			}
			return seq;
		},

		CatchClause: function(node) {
			let seq = ['catch','('],
				param = node.param,
				body = node.body;
			join(seq, generateExpression(param));
			seq.push(')');
			join(seq, generateStatement(body));
			return seq;
		},

		UnaryExpression: function(node) {
			let seq = [],
				operator = node.operator,
				argument = node.argument,
				prefix = node.prefix;
			if(prefix) seq.push(operator);
			join(seq, generateExpression(argument));
			if(!prefix) seq.push(operator);
			return seq;
		},

		UpdateExpression: function(node) {
			return expressionGenerator.UnaryExpression(node);
		},

		YieldExpression: function(node) {
			let seq = ['yield'],
				argument = node.argument,
				delegate = node.delegate;
			if(argument !== null) join(seq, generateExpression(argument));
			return seq;
		}

	};

	/** Generates the word sequence for a statement subtree. */
	function generateStatement(node) {

		let change = node['change-noprop'],
			seq = statementGenerator[node.type](node);

		switch(change) {
			case 'INSERTED':
			case 'REMOVED':
			case 'UPDATED':
				/* Wrap the sequence with the change. */
				seq.unshift('~' + change + '_START~');
				seq.push('~' + change + '_END~');
			case 'MOVED':
			case 'UNCHANGED':
			case 'INHERITED':
			case 'UNKNOWN':
			default:
		}

		return seq;

	}

	/** Generates the word sequence for an expression subtree. */
	function generateExpression(node) {

		let change = node['change-noprop'],
			seq = expressionGenerator[node.type](node);

		switch(change) {
			case 'INSERTED':
			case 'REMOVED':
			case 'UPDATED':
				/* Wrap the sequence with the change. */
				seq.unshift('~' + change + '_START~');
				seq.push('~' + change + '_END~');
			case 'MOVED':
			case 'UNCHANGED':
			case 'INHERITED':
			case 'UNKNOWN':
			default:
		}

		return seq;

	}

	/** Generates the word sequence for an AST. */
	function generate(node) { 

		if(node.type === 'FunctionDeclaration'
			&& node['change-noprop'] === 'INHERITED')
			node['change-noprop'] = node.change;

		/* Recursively generate sequence for node. */
		return generateStatement(node);

	}

	exports.generate = generate;

}());
