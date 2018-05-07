#!/bin/bash
node --max-old-space-size=24576 code2seq.js --code ../flow-mining/output/repairs+mutants.json --topn ./output/topn --seq ./output/seq --vocab ./output/vocab --buckets 10 --maxlen 130
