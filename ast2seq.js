/**
 * ast2seq.js
 * A tool for building the sequence sets for NMT.
 */

const fs = require("fs");
const fse = require('fs-extra');
const esprima = require("esprima");
const esseq = require("./utilities/esseq.js");

/* Set up the command line options. */
var argv = require('yargs')
	.usage('Usage: node $0 [options]')
	.demandOption(['code', 'seq', 'max'])
	.describe('code', 'The path to the input source code snippets')
	.describe('seq', 'The path the sequences will be output to')
	.describe('max', 'The maximum number of commits to process')
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

let ctr = 0;

fse.ensureFileSync(argv.seq + ".buggy");
fse.ensureFileSync(argv.seq + ".correct");

	/* Process a commit-file. */
lineReader.on('line', function (line) {

	/* Read the sequence pairs for this commit-file. */
	let comfile = JSON.parse(line);

	ctr++;

	if(ctr > argv.max) {
		console.log("Reached max commits. Exiting.");
		process.exit();
	}

	console.log("%d: %s - %s", ctr, comfile.url, comfile.fileName);

	/* Process the code into a sequence of words. */
	for(let j = 0; j < comfile.sliceChangePair.length; j++) {

		let pair = comfile.sliceChangePair[j];
		let beforeAST = pair['before-ast'],
				beforeSeq = null;
		let afterAST = pair['after-ast'],
				aterSeq = null;

		let labels = pair.labels;

		let file = null;

		/* Generate the sequence from the test case. */
		if(beforeAST !== null)
			beforeSeq = esseq.generate(beforeAST);
		else
			beforeSeq = "";
		afterSeq = esseq.generate(afterAST);

		if(beforeSeq === null || afterSeq === null) continue;

		/* Store the sequence in a file. */

		if(labels.includes('REPAIR')) {
			file = argv.seq + "-repair";
		}
		else {
			file = argv.seq + "-nominal";
		}

		fs.appendFileSync(file + ".buggy", beforeSeq + "\n");
		fs.appendFileSync(file + ".correct", afterSeq + "\n");

	}

});
