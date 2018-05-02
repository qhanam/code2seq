
function MutateTry (ast) {

	let currentMutant = 0,
		mutables = [];

	/* PRIVATE */

	/**
	 * Visits child statements.
	 */
	let visitBlockStatements = {

		Program: function(node) { 
			for(let i = 0; i < node.body.length; i++)
				findMutables(node, node.body[i]);
		},

		FunctionDeclaration: function(node) {
			findMutables(node, node.body);
		},

		FunctionExpression: function(node) {
			findMutables(node, node.body);
		},

		BlockStatement: function(node) { 
			for(let i = 0; i < node.body.length; i++)
				findMutables(node, node.body[i]); },

		WhileStatement: function(node) { 
			findMutables(node, node.body);
		},

		ForStatement: function(node) { 
			findMutables(node, node.body);
		},

		ForInStatement: function(node) { 
			findMutables(node, node.body);
		},

		WithStatement: function(node) { 
			findMutables(node, node.body);
		},

		SwitchStatement: function(node) {
			for(let i = 0; i < node.cases.length; i++)
				visitBlockStatements.SwitchCase(node.cases[i]);
		},

		SwitchCase: function(node) { 
			findMutables(node, node.consequent);
		},

		TryStatement: function(node) {
			findMutables(node, node.block);
			if(node.finalizer !== null) findMutables(node, node.finalizer);
		},

		CatchClause: function(node) { 
			findMutables(node, node.body);
		},

	}

	/**
	 * Discovers mutable statements.
	 */
	function findMutables(owner, statement) {

			/* First, register this statement as mutable if it meets requirements. */
			if(statement.type === 'TryStatement' && statement.change === 'INSERTED') {
				mutables.push({ owner: owner, statement: statement });
				console.log('Found TryStatement to mutate.');
			}

			/* Second, recursively visit statements with nested blocks. */
			if(visitBlockStatements[statement.type] === undefined) return;
			visitBlockStatements[statement.type](statement);

	}

	findMutables(null, ast);

	/* PUBLIC */

	/**
	 * @return the next mutant AST, or {@code null} if there are no more.
	 */
	this.getNextMutant = function () {
		let mutable;
		
		if(currentMutant < mutables.length) mutable = mutables[currentMutant];
		else return null;

		// TODO: Generate the next mutant
		
		// TODO: Restore the AST to its original form.

		currentMutant++;
		return ast;
	}

}

module.exports = MutateTry;
