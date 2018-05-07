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
						if(statement['change-noprop'] === 'INSERTED' 
							&& body[j]['change-noprop'] === 'INHERITED') {
								body[j]['change-noprop'] = 'INSERTED';
						}
						newBody.push(body[j]);
					}

				}

			}

			owner.body = newBody;

			return oldBody;
			
		},

		IfStatement: function(owner, statement) {
			let oldBody = owner.consequent, 
				tryblock = statement.block;
			/* The if statement only controls the execution of one statement, which
			 * is the try block. */
			if(tryblock.body.length === 1) {
				if(statement['change-noprop'] === 'INSERTED' 
					&& tryblock.body[0]['change-noprop'] === 'INHERITED') {
						tryblock.body[0]['change-noprop'] = 'INSERTED';	
				}
				owner.consequent = tryblock.body[0];
			}
			else {
				if(statement['change-noprop'] === 'INSERTED' 
					&& tryblock['change-noprop'] === 'INHERITED') {
						tryblock['change-noprop'] = 'INSERTED';	
				}
				owner.consequent = tryblock.body;
			}
			return oldBody;
		},

		WhileStatement: function(owner, statement) {
			let oldBody = owner.body,
				tryblock = statement.block;
			/* The while loop only controls the execution of one statement, which
			 * is the try block. */
			if(tryblock.body.length === 1) {
				if(statement['change-noprop'] === 'INSERTED'
					&& tryblock.body[0]['change-noprop'] === 'INHERITED') {
						tryblock.body[0]['change-noprop'] = 'INSERTED';
				}
				owner.body = tryblock.body[0];
			}
			else {
				if(statement['change-noprop'] === 'INSERTED' 
					&& tryblock['change-noprop'] === 'INHERITED') {
						tryblock['change-noprop'] = 'INSERTED';	
				}
				owner.body = tryblock;
			}
			return oldBody;
		},

		ForStatement: function(owner, statement) {
			let oldBody = owner.body,
				tryblock = statement.block;
			/* The while loop only controls the execution of one statement, which
			 * is the try block. */
			if(tryblock.body.length === 1) {
				if(statement['change-noprop'] === 'INSERTED'
					&& tryblock.body[0]['change-noprop'] === 'INHERITED') {
						tryblock.body[0]['change-noprop'] = 'INSERTED';
				}
				owner.body = tryblock.body[0];
			}
			else {
				if(statement['change-noprop'] === 'INSERTED' 
					&& tryblock['change-noprop'] === 'INHERITED') {
						tryblock['change-noprop'] = 'INSERTED';	
				}
				owner.body = tryblock;
			}
			return oldBody;
		},

		ForInStatement: function(owner, statement) {
			let oldBody = owner.body,
				tryblock = statement.block;
			/* The while loop only controls the execution of one statement, which
			 * is the try block. */
			if(tryblock.body.length === 1) {
				if(statement['change-noprop'] === 'INSERTED'
					&& tryblock.body[0]['change-noprop'] === 'INHERITED') {
						tryblock.body[0]['change-noprop'] = 'INSERTED';
				}
				owner.body = tryblock.body[0];
			}
			else {
				if(statement['change-noprop'] === 'INSERTED' 
					&& tryblock['change-noprop'] === 'INHERITED') {
						tryblock['change-noprop'] = 'INSERTED';	
				}
				owner.body = tryblock;
			}
			return oldBody;
		}

	}

	/**
	 * Restores a try statement to its owner.
	 */
	let  restoreTryTo = {

		Program: function(owner, oldBody, statement) {
			let body = statement.block.body;
			owner.body = oldBody;
			for(let i = 0; i < body.length; i++) {
				if(body[i]['change-noprop'] === 'INSERTED') {
					body[i]['change-noprop'] = 'INHERITED';
				}
			}
		},

		BlockStatement: function(owner, oldBody, statement) {
			let body = statement.block.body;
			owner.body = oldBody;
			for(let i = 0; i < body.length; i++) {
				if(body[i]['change-noprop'] === 'INSERTED') {
					body[i]['change-noprop'] = 'INHERITED';
				}
			}
		},

		IfStatement: function(owner, oldBody, statement) {
			owner.consequent = statement;
			if(statement.block['change-noprop'] === 'INSERTED') {
				statement.block['change-noprop'] = 'INHERITED'
			}
		},

		WhileStatement: function(owner, oldBody, statement) {
			owner.body = statement;
			if(statement.block['change-noprop'] = 'INSERTED') {
				statement.block['change-noprop'] = 'INHERITED'
			}
		},

		ForStatement: function(owner, oldBody, statement) {
			owner.body = statement;
			if(statement.block['change-noprop'] = 'INSERTED') {
				statement.block['change-noprop'] = 'INHERITED'
			}
		},

		ForInStatement: function(owner, oldBody, statement) {
			owner.body = statement;
			if(statement.block['change-noprop'] = 'INSERTED') {
				statement.block['change-noprop'] = 'INHERITED'
			}
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

		IfStatement: function(node) {
			findMutables(node, node.consequent);
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
		else return null;

		owner = mutable.owner;
		statement = mutable.statement;

		/* Ignore ower types that we do not yet handle. */
		if(removeTryFrom[owner.type] === undefined) return true;

		/* Perform the mutation, build the sequence, then restore the original AST. */
		original = removeTryFrom[owner.type](owner, statement);
		seq = esseq.generate(ast);
		restoreTryTo[owner.type](owner, original, statement);

		return seq;

	}

}

module.exports = MutateTry;
