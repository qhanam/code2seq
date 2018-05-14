/**
 * buildxvalidset.js
 * A tool for building data sets for cross validation.
 */

const fs = require("fs");

for(let i = 0; i < 10; i++) {

	for(let j = 0; j < 10; j++) {

		let lineReader, files = ['candidate', 'mutant', 'nominal'];

		/* i selects the set of projects that will be the test set. */

		for(let k = 0; k < files.length; k++) process(i, j, files[k]);

	}

}

function process(fold, set, file) {

		let label, traintest, omitted = 0, skipped = 0,
			path = 'output/seq-' + file + set + '.seq',
			seqs = fs.readFileSync(path, 'utf-8').split("\n");

		if(fold === set) traintest = 'test';
		else traintest = 'train';

		console.log('Processing ' + traintest + ' file ' + path + ' of fold ' + fold + ' ...');

		switch(file){
			case 'mutant':
				label = 'MISSING_TRY';
				break;
			case 'candidate':
			case 'nominal':
			default:
				label = 'NOMINAL';
				break;
		}

		for(let i = 0; i < seqs.length; i++) {
			if(seqs[i] === '') continue;
			if(!(seqs[i].includes('~UPDATED_START') || seqs[i].includes('~INSERTED_START'))) {
				omitted++;
			}
			else if(file !== 'nominal' || Math.round(Math.random() * 100) < 20) {
				fs.appendFileSync('xfold/' + traintest + fold + '.input', seqs[i] + '\n');
				fs.appendFileSync('xfold/' + traintest + fold + '.expected', label + '\n');
			}
			else {
				skipped++;
			}
		}

		console.log('Omitted ' + omitted + ' sequences with no changes from ' + traintest + ' set.');
		console.log('Skipped ' + skipped + ' sequences from ' + traintest + ' set.');

}

