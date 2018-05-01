#!/bin/bash
#node --max-old-space-size=24576 node2vec.js --vsize 3000 --code ../flow-mining/output/results.json --vocab ./output/topn
node --max-old-space-size=24576 node2vec.js --vsize 3000 --code ../flow-mining/output/tmp.json --vocab ./output/topn
