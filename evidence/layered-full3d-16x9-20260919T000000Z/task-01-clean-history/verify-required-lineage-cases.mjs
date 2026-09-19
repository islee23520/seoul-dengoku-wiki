import { readFileSync } from 'node:fs';

const receipt = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const passed = receipt.passedRequiredCases;
const required = receipt.requiredCaseIds;
if (!Array.isArray(passed) || !Array.isArray(required)) throw new Error('malformed required-case receipt');
const unique = (values) => new Set(values).size === values.length;
if (!unique(passed) || !unique(required)) throw new Error('duplicate required-case ID');
if (passed.length !== required.length || passed.some((id, index) => id !== required[index])) throw new Error('required-case inventory mismatch');
console.log(JSON.stringify({ passedRequiredCases: passed, requiredCaseIds: required }, null, 2));
