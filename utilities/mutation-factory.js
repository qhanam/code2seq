function MutateTry (ast) {

	let currentMutant = 0,
		mutables = findMutables();

	/* PRIVATE */

	/**
	 * @return an array of mutable try statements and their parent blocks.
	 */
	function findMutables() {
		// TODO
	}

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
