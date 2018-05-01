/**
 * abstract.js
 * A tool for building the sequence sets for NMT.
 */

const fs = require("fs");
const fse = require('fs-extra'); 
const Vocab = require("./utilities/vocab-factory.js");

/* Set up the command line options. */
var argv = require('yargs')
	.usage('Usage: node $0 [options]')
	.demandOption(['vsize', 'code', 'vocab'])
	.describe('vsize', 'The size of the vocabulary')
	.describe('code', 'The path to the input source code snippets')
	.describe('vocab', 'The path the vocab will be output to')
	.help('h')
	.alias('h', 'help')
	.argv;

if(!fs.existsSync(argv.code)) {
  console.log('File not found: %s', argv.code);
  process.exit(1);
}

/* Set up the input stream. Each line in the input file contains a JSON object
 * representing one commit-file. */
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(argv.code)
});

/* The vocab data structure. */
let vocab = new Vocab(argv.vsize);

/* Process a commit-file. */
lineReader.on('line', function (line) {

	/* Read the sequence pairs for this commit-file. */
	let comfile = JSON.parse(line);

	/* Update the vocabulary with the nodes in this commit-file. */
	vocab.addCommitFile(comfile);

});

/* Create the vocab file, since the input has finished. */
lineReader.on('close', (input) => {
	fse.ensureFileSync(argv.vocab);
	fs.writeFileSync(argv.vocab, vocab.getTopN().join("\n"));
});
