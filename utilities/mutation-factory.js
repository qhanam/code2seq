const esseq = require("./esseq.js");

function MutateTry (ast) {

	let currentMutant = 0,
		mutables = [];

	/* PRIVATE */

	/**
	 * Removes a try statement to its owner.
	 */
	let removeTryFrom = {

		Program: function(owner, statement) { 
			return removeTryFrom.BlockStatement(owner, statement);
		},

		BlockStatement: function(owner, statement) { 

			let oldBody = owner.body, newBody = [];

			for(let i = 0; i < oldBody.length; i++) {

				let current = owner.body[i];
				if(current !== statement) newBody.push(current);
				else {

					/* We need to pull all the statements in the try block into the
					 * correct position in the owner's block. */
					let body = statement.block.body;
					for(let j = 0; j < body.length; j++) {
						newBody.push(body[j]);
					}

				}

			}

			owner.body = newBody;

			return oldBody;
			
		}

	}

	/**
	 * Restores a try statement to its owner.
	 */
	let  restoreTryTo = {

		Program: function(owner, oldBody) {
			owner.body = oldBody;
		},

		BlockStatement: function(owner, oldBody) {
			owner.body = oldBody;
		}

	}

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
		let mutable,
			owner,
			statement,
			original,
			seq;

		if(currentMutant < mutables.length) {
			mutable = mutables[currentMutant];
			currentMutant++;
		}
		else return false;

		owner = mutable.owner;
		statement = mutable.statement;

		/* Ignore ower types that we do not yet handle. */
		if(removeTryFrom[owner.type] === undefined) return true;

		seq = esseq.generate(ast);
		console.log("Oringial");
		console.log(seq.join(' '));
		original = removeTryFrom[owner.type](owner, statement);
		seq = esseq.generate(ast);
		console.log("Mutated");
		console.log(seq.join(' '));
		restoreTryTo[owner.type](owner, original);
		seq = esseq.generate(ast);
		console.log("Restored");
		console.log(seq.join(' '));

		return true;
	}


}

module.exports = MutateTry;
