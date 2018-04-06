/**
 * abstract.js
 * A tool for building the sequence sets for NMT.
 */

const fs = require("fs");
const Code2Seq = require("./utilities/abstraction-factory.js");
const esprima = require("esprima");
const fse = require('fs-extra'); const Vocab = require("./utilities/vocab-factory.js");

/* Set up the command line options. */
var argv = require('yargs')
	.usage('Usage: node $0 [options]')
	.demandOption(['code', 'topn', 'seq', 'vocab'])
	.describe('code', 'The path to the input source code snippets')
	.describe('topn', 'The path to the top N words (the non-reserved vocab)')
	.describe('seq', 'The path the sequences will be output to')
	.describe('vocab', 'The path the vocab will be output to')
	.help('h')
	.alias('h', 'help')
	.argv;

if(!fs.existsSync(argv.code)) {
  console.log('File not found: %s', argv.code);
  process.exit(1);
}

if(!fs.existsSync(argv.topn)) {
  console.log('File not found: %s', argv.topn);
  process.exit(1);
}

/* Set up the input stream. Each line in the input file contains a JSON object
 * representing one commit-file. */
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(argv.code)
});

let ctr = 0;
let topN = fs.readFileSync(argv.topn, 'utf-8').split("\n"); // Top N non-reserved words
let code2seq = new Code2Seq(topN);

fse.ensureFileSync(argv.seq + ".buggy");
fse.ensureFileSync(argv.seq + ".correct");
fs.writeFileSync(argv.seq + ".buggy", "");
fs.writeFileSync(argv.seq + ".correct", "");

/* Process a commit-file. */
lineReader.on('line', function (line) {

	/* Read the sequence pairs for this commit-file. */
	let comfile = JSON.parse(line);

	ctr++;
	console.log("%d: %s - %s", ctr, comfile.url, comfile.fileName);

	/* Process the code into a sequence of words. */
	for(let j = 0; j < comfile.sliceChangePair.length; j++) {

		let pair = comfile.sliceChangePair[j];
		let beforeAST = null,
				beforeSeq = null;
		let afterAST = null,
				aterSeq = null;

		let beforeCode = pair.before.replace(/^function\s*\(/, "function __abs__dummy(");
		let afterCode = pair.after.replace(/^function\s*\(/, "function __abs__dummy(");

		try {
			beforeAST = esprima.parse(beforeCode);
			afterAST = esprima.parse(afterCode);
		} catch (e) {
			console.log("skipping unparsable code");
			continue; // Skip stuff that can't be parsed.
		}

		/* Build the abstracted sequences. */
		beforeSeq = code2seq.ast2Seq(beforeAST, topN);
		afterSeq = code2seq.ast2Seq(afterAST, topN);

		if(beforeSeq === null || afterSeq === null) continue;

		/* Store the sequence in a file. */
		fs.appendFileSync(argv.seq + ".buggy", beforeSeq);
		fs.appendFileSync(argv.seq + ".correct", afterSeq);

	}

});

/* Create the vocab file, since the input has finished. */
lineReader.on('close', (input) => {
	let vocab = code2seq.getVocab();
	fse.ensureFileSync(argv.vocab);
	fs.writeFileSync(argv.vocab, [...vocab].join("\n"));
});
