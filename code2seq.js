/**
 * abstract.js
 * A tool for building the sequence sets for NMT.
 */

const fs = require("fs");
const fse = require('fs-extra'); const Vocab = require("./utilities/vocab-factory.js");
const Code2Seq = require("./utilities/abstraction-factory.js");
const MutateTry = require("./utilities/mutation-factory.js");
const esseq = require("./utilities/esseq.js");

/* Set up the command line options. */
var argv = require('yargs')
	.usage('Usage: node $0 [options]')
	.demandOption(['code', 'topn', 'seq', 'vocab'])
	.describe('code', 'The path to the input source code snippets')
	.describe('topn', 'The path to the top N words (the non-reserved vocab)')
	.describe('seq', 'The path the sequences will be output to')
	.describe('vocab', 'The path the vocab will be output to')
	.describe('buckets', 'The number of project buckets')
	.describe('maxlen', 'The maximum length of the sequence')
	.default('buckets', 10)
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
let code2seq = new Code2Seq();
let bucketAssignments = new Map(); // Quickly lookup which bucket a project is assigned to
let vocab = new Set();

/* Process a commit-file. */
lineReader.on('line', function (line) {

	/* Read the sequence pairs for this commit-file. */
	let comfile;
	try { comfile = JSON.parse(line); }
	catch(e) { console.log("code2seq error while parsing JSON"); return; }

	/* Get the current bucket. */
	let bucket = bucketAssignments.get(comfile.projectID);

	if(bucket === undefined) {
		bucket = Math.floor((Math.random() * 10));
		bucketAssignments.set(comfile.projectID, bucket);
	}

	ctr++;
	console.log("%d: %s - %s", ctr, comfile.url, comfile.fileName);

	/* Process the code into a sequence of words. */
	for(let j = 0; j < comfile.sliceChangePair.length; j++) {

		let pair = comfile.sliceChangePair[j];
		let beforeAST = pair['before-ast'],
				beforeSeq = null;
		let afterAST = pair['after-ast'],
				aterSeq = null;

		let file = null;

		/* Build the abstracted sequences. */
		code2seq.ast2Seq(afterAST, topN);

		/* Convert the AST into a word sequence. */
		try { afterSeq = esseq.generate(afterAST) }
		catch(e) { console.log("code2seq error while generating sequence from AST"); }
		if(afterSeq === null) continue;

		/* Update the vocab with the words in the sequence. */
		for(let i = 0; i < afterSeq.length; i++) {
			vocab.add(afterSeq[i]);
		}

		/* Is this mutable? If it is then we need to search for and remove inserted
		 * try statements one by one. */
		if(pair.labels.includes("MUTATION_CANDIDATE")) {
			let mutateTry = new MutateTry(afterAST), seq = null;

			try { seq = mutateTry.getNextMutant(); }
			catch (e) { console.log("code2seq error while generating mutant"); }

			while(seq !== null) {
				file = argv.seq + "-mutant" + bucket;
				if(!argv.maxlen || seq.length <= argv.maxlen) {
					fs.appendFileSync(file + ".meta", comfile.sourceFileChangeID 
						+ ',' + comfile.projectID + ',' + comfile.commitID 
						+ ',' + comfile.fileName + ',' + comfile.url + '\n');
					fs.appendFileSync(file + ".seq", seq.join(' ') + "\n");
				}
				try { seq = mutateTry.getNextMutant(); }
				catch(e) { console.log("code2seq error while generating mutant"); }
			}
		}

		/* Store the sequence in a file. We have a few rules to consider:
		 * 1. Projects get evenly distributed across 10 buckets (for 10-fold cross validation).
		 * 2. Real-world repairs (type=REPAIR) go into a special evaluation set.
		 * 		The evaluation set is split into the same 10 buckets as the training
		 * 		data. */

		if(pair.labels.length === 0)
			file = argv.seq + "-nominal" + bucket;
		else if(pair.labels.includes("MUTATION_CANDIDATE"))
			file = argv.seq + "-candidate" + bucket;
		else if(pair.labels.includes("REPAIR"))
			file = argv.seq + "-repair" + bucket;
		else
			file = argv.seq + "-error" + bucket;

		if(!argv.maxlen || afterSeq.length <= argv.maxlen) {
			fs.appendFileSync(file + ".meta", comfile.sourceFileChangeID 
				+ ',' + comfile.projectID + ',' + comfile.commitID 
				+ ',' + comfile.fileName + ',' + comfile.url + '\n');
			fs.appendFileSync(file + ".seq", afterSeq.join(' ') + "\n");
		}

	}

});

/* Create the vocab file, since the input has finished. */
lineReader.on('close', (input) => {
	fse.ensureFileSync(argv.vocab);
	fs.writeFileSync(argv.vocab, [...vocab].join("\n"));
	fse.ensureFileSync('output/buckets');
	for(var [key, value] of bucketAssignments.entries()) {
		fs.appendFileSync('output/buckets', key + ',' + value + '\n');
	}
});
