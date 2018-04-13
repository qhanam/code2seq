/**
 * build-dataset.js
 * A tool for building the sequence sets for NMT.
 */

const path = require("path");
const fs = require("fs");
const fse = require('fs-extra'); const Vocab = require("./utilities/vocab-factory.js");

/* Set up the command line options. */
var argv = require('yargs')
	.usage('Usage: node $0 [options]')
	.demandOption(['seqdir'])
	.demandOption(['outdir'])
	.demandOption(['maxlen'])
	.describe('seqdir', 'The path to the directory holding the sequences')
	.describe('outdir', 'The path to the output directory')
	.describe('maxlen', 'The maximum sequence length')
	.help('h')
	.alias('h', 'help')
	.argv;

if(!fs.existsSync(argv.seqdir)) {
  console.log('Folder not found: %s', argv.seqdir);
  process.exit(1);
}

fse.ensureDirSync(argv.outdir);

/* Get the files and sort into buggy/correct pairs. */
let repairFilePairs = [];
let mutantFilePairs = [];
let nominalFilePairs = [];

fs.readdirSync(argv.seqdir).forEach(file => {

	let regex = /seq-((?:repair)|(?:mutant)|(?:nominal))(\d+)\.((?:buggy)|(?:correct))/;
 	let match = regex.exec(file);

	if(!match) return;
	
	let type = match[1];
	let bucket = parseInt(match[2]);
	let version = match[3];

	switch(type) {
	case 'repair':
		if(!repairFilePairs[bucket]) repairFilePairs[bucket] = {};
		repairFilePairs[bucket][version] = file;
		break;
	case 'mutant':
		if(!mutantFilePairs[bucket]) mutantFilePairs[bucket] = {};
		mutantFilePairs[bucket][version] = file;
		break;
	case 'nominal':
		if(!nominalFilePairs[bucket]) nominalFilePairs[bucket] = {};
		nominalFilePairs[bucket][version] = file;
		break;
	}

});

filter(repairFilePairs);
filter(mutantFilePairs);
filter(nominalFilePairs);

/**
 * Filter sequence pairs which exceed the maximum length.
 */
function filter(filePairs) { 

	for(let i = 0; i < filePairs.length; i++) {

		let buggySequences = fs.readFileSync(path.join(argv.seqdir, filePairs[i].buggy), 'utf8').split('\n');
		let correctSequences = fs.readFileSync(path.join(argv.seqdir, filePairs[i].correct), 'utf8').split('\n');

		if(buggySequences.length !== correctSequences.length) throw "File pairs must have the same number of sequences.";

		let buggyPath = path.join(argv.outdir, filePairs[i].buggy);
		let correctPath = path.join(argv.outdir, filePairs[i].correct);

		/* Erase any old files. */
		if(fs.existsSync(buggyPath)) fs.unlinkSync(buggyPath);
		if(fs.existsSync(correctPath)) fs.unlinkSync(correctPath);

		for(let j = 0; j < buggySequences.length; j++) {
			let buggySequence = buggySequences[j];
			let correctSequence = correctSequences[j];

			if(buggySequence.split(' ').length <= argv.maxlen 
					&& correctSequence.split(' ').length <= argv.maxlen) {

				fs.appendFileSync(path.join(argv.outdir, filePairs[i].buggy), buggySequence + "\n");
				fs.appendFileSync(path.join(argv.outdir, filePairs[i].correct), correctSequence + "\n");

			}
		}

		console.log(filePairs[i]);
	}

}
