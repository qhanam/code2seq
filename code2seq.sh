#!/bin/bash
#node --max-old-space-size=24576 code2seq.js --code ../flow-mining/output/results.json --topn ./output/topn --seq ./output/seq --vocab ./output/vocab --buckets 10
#node --max-old-space-size=24576 code2seq.js --code ../flow-mining/output/tmp.json --topn ./output/topn --seq ./output/seq --vocab ./output/vocab --buckets 10
node --max-old-space-size=24576 code2seq.js --code ./tests/switchcase.json --topn ./output/topn --seq ./output/seq --vocab ./output/vocab --buckets 10
