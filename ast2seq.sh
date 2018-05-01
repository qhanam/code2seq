#!/bin/bash
node --max-old-space-size=24576 ast2seq.js --code ../flow-mining/output/tmp.json --seq ./output/ast2seq --max 100 
