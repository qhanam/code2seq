/**
 * ast2seq.js
 * A tool for building the sequence sets for NMT.
 */

const fs = require("fs");
const fse = require('fs-extra'); 
const esprima = require("esprima");
const esseq = require("./utilities/esseq.js");

/* The test case. */
const code = "do { } while (true);";
const ast = esprima.parseScript(code);

/* Generate the sequence from the test case. */
console.log(esseq.generate(ast));
