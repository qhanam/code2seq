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
		},

		ForStatement: function(node) {
			let seq = ['for','('],
				init = node.init,
				test = node.test,
				update = node.update,
				body = node.body;
			if(init !== null) join(seq, expressionGenerator[init.type](init));
			seq.push(';');
			if(test !== null) join(seq, expressionGenerator[test.type](test));
			seq.push(';');
			if(update !== null) join(seq, expressionGenerator[update.type](update));
			seq.push(')');
			join(seq, statementGenerator[body.type](body));
			return seq;
		},

		ForInStatement: function(node) {
			let seq = ['for','('],
				left = node.left,
				right = node.right,
				body = node.body;
			join(seq, expressionGenerator[left.type](left));
			seq.push('in');
			join(seq, expressionGenerator[right.type](right));
			seq.push(')');
			join(seq, statementGenerator[body.type](body));
			return seq;
		},

		IfStatement: function(node) {
			let seq = ['if','('],
				test = node.test,
				consequent = node.consequent,
				alternate = node.alternate;
			join(seq, expressionGenerator[test.type](test));
			seq.push(')');
			join(seq, statementGenerator[consequent.type](consequent));
			if(alternate !== null) {
				seq.push('else');
				join(seq, statementGenerator[alternate.type](alternate));
			}
			return seq;
		},

		DebuggerStatement: function(node) {
			return ['debugger',';'];
		},

		ReturnStatement: function(node) {
			let seq = ['return'],
				argument = node.argument;
			console.log(argument.type);
			if(argument !== null) join(seq, expressionGenerator[argument.type](argument));
			seq.push(';');
			return seq;
		},

		SwitchStatement: function(node) {
			let seq = ['switch','('],
				discriminant = node.discriminant,
				cases = node.cases;
			join(seq, expressionGenerator[discriminant.type](discriminant));
			seq.push(')');
			seq.push('{');
			for(let i = 0; i < cases.length; i++) {
				let cas = cases[i];
				join(seq, expressionGenerator[cas.type](cas));
			}
			seq.push('}');
			return seq;
		},

		ThrowStatement: function(node) {
			let seq = ['throw'],
				argument = node.argument;
			join(seq, expressionGenerator[argument.type](argument));
			seq.push(';');
			return seq;
		},

		TryStatement: function(node) {
			let seq = ['try'],
				block = node.block,
				handler = node.handler,
				finalizer = node.finalizer;
			join(seq, statementGenerator[block.type](block));
			join(seq, expressionGenerator[handler.type](handler));
			if(finalizer !== null) {
				seq.push('finally');
				join(seq, statementGenerator[finalizer.type](finalizer));
			}
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
		},

		MemberExpression: function(node) {
			let seq = [],
				object = node.object,
				property = node.property;
			join(seq, expressionGenerator[object.type](object));
			if(node.computed) {
				seq.push('[');
				join(seq, expressionGenerator[property.type](property));
				seq.push(']');
			}
			else {
				seq.push('.');
				join(seq, expressionGenerator[property.type](property));
			}
			return seq;
		},

		VariableDeclaration: function(node) {

			let seq = [node.kind];

			for(let i = 0; i < node.declarations.length; i++) {
				let declarator = node.declarations[i];
				join(seq, expressionGenerator[declarator.type](declarator));
				if(i !== node.declarations.length - 1) seq.push(',');
			}

			return seq

		},

		EmptyExpression: function(node) {
			return [];
		},

		CallExpression: function(node) {
			let seq = [],
				callee = node.callee,
				args = node.arguments;
			join(seq, expressionGenerator[callee.type](callee));
			seq.push('(');
			for(let i = 0; i < args.length; i++) {
				let arg = args[i];
				join(seq, expressionGenerator[arg.type](arg));
				if(i !== args.length - 1) seq.push(',');
			}
			seq.push(')');
			return seq;
		},

		FunctionExpression: function(node) {
			let seq = ['function'],
				id = node.id,
				params = node.params,
				body = node.body;
			if(id !== null)	join(seq, expressionGenerator[id.type](id));
			seq.push('(');
			for(let i = 0; i < params.length; i++) {
				let param = params[i];
				join(seq, expressionGenerator[param.type](param));
				if(i !== params.length - 1) seq.push(',');
			}
			seq.push(')');
			join(seq, statementGenerator[body.type](body));
			return seq;
		},

		BinaryExpression: function(node) {
			let seq = [],
				operator = node.operator,
				left = node.left,
				right = node.right;
			join(seq, expressionGenerator[left.type](left));
			seq.push(operator);
			join(seq, expressionGenerator[right.type](right));
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
			join(seq, expressionGenerator[callee.type](callee));
			seq.push('(');
			for(let i = 0; i < args.length; i++) {
				let arg = args[i];
				join(seq, expressionGenerator[arg.type](arg));
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
				join(seq, expressionGenerator[property.type](property));
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
				join(seq, expressionGenerator[key.type](key));
				seq.push(']');
			}
			else {
				join(seq, expressionGenerator[key.type](key));
			}
			seq.push(':');
			join(seq, expressionGenerator[value.type](value));
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
				join(seq, expressionGenerator[test.type](test));
			}
			seq.push(':');
			for(let i = 0; i < consequent.length; i++) {
				let stmt = consequent[i];
				join(seq, statementGenerator[stmt.type](stmt));
			}
			return seq;
		},

		CatchClause: function(node) {
			let seq = ['catch','('],
				param = node.param,
				body = node.body;
			join(seq, expressionGenerator[param.type](param));
			seq.push(')');
			join(seq, statementGenerator[body.type](body));
			return seq;
		},

		UnaryExpression: function(node) {
			let seq = [],
				operator = node.operator,
				argument = node.argument,
				prefix = node.prefix;
			if(prefix) seq.push(operator);
			join(seq, expressionGenerator[argument.type](argument));
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
			if(argument !== null) join(seq, expressionGenerator[argument.type](argument));
			return seq;
		}

	};

	function generate(node) { 

		/* TODO: Recursively generate sequence for node. */
		return statementGenerator[node.type](node).join(' ');
	
	}

	exports.generate = generate;

}());
