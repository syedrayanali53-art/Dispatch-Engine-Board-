'use strict';

// Run with: node tests/engine-checks.cjs
// Uses Node's built-in tools; does not launch a browser or change saved data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
const api = vm.runInNewContext(source + `
({ makeSeed, roster, PEOPLE, FLEET, clone, resourceReason, issuesFor,
   crewCount, overlaps, summary, stateOf, validSaved, scheduleRows, csvText, esc })
`, {}, { timeout: 5000 });

const state = api.makeSeed();
const jobs = state.jobs;
const day = jobs.filter(job => job.date === '2030-10-14');
const report = api.summary(day, jobs);

assert.equal(jobs.length, 39);
assert.equal(api.PEOPLE.length, 49);
assert.equal(api.FLEET.length, 14);
assert.ok(api.validSaved(state));
assert.ok(jobs.every(job => !api.issuesFor(job, jobs).some(issue => issue.hard)));
assert.ok(jobs.filter(job => job.status !== 'planning').every(job => !api.issuesFor(job, jobs).length));
assert.equal(report.covered, 10);
assert.equal(report.attention, 3);
assert.equal(report.statuses.ready, 5);
assert.equal(report.weight, 83300);

// Complete the first planning job using an available truck and crew.
const complete = api.clone(day[0]);
complete.assignments = [{
  driver: api.roster('driver')[5].id,
  foreman: api.roster('foreman')[5].id,
  vehicle: api.FLEET[5].id,
  crew: [api.roster('mover')[1].id]
}];
assert.equal(api.issuesFor(complete, jobs).length, 0);
complete.status = 'ready';
assert.equal(api.stateOf(complete, jobs), 'ready');

const missingWeight = api.clone(complete);
missingWeight.weight = null;
assert.equal(api.stateOf(missingWeight, jobs), 'planning');

// A high licence does not override insufficient vehicle training.
const undertrained = api.clone(day[2]);
undertrained.assignments[0].driver = api.roster('driver')[1].id;
assert.match(api.resourceReason(undertrained, 0, 'driver', api.roster('driver')[1].id, jobs), /Training/);

const booked = api.clone(day[0]);
booked.assignments[0].driver = api.roster('driver')[0].id;
assert.match(api.resourceReason(booked, 0, 'driver', api.roster('driver')[0].id, jobs), /Booked/);
assert.ok(api.overlaps({ date: '2030-10-14', start: '09:00', end: '12:00' }, { date: '2030-10-14', start: '11:59', end: '14:00' }));
assert.ok(!api.overlaps({ date: '2030-10-14', start: '09:00', end: '12:00' }, { date: '2030-10-14', start: '12:00', end: '14:00' }));

const duplicateTruck = api.clone(day[12]);
duplicateTruck.assignments[1].driver = duplicateTruck.assignments[0].driver;
assert.ok(api.issuesFor(duplicateTruck, jobs).some(issue => issue.hard && /another truck/.test(issue.text)));

const wrongRole = api.clone(complete);
wrongRole.assignments[0].foreman = api.roster('driver')[5].id;
assert.ok(api.issuesFor(wrongRole, jobs).some(issue => issue.hard && /different role/.test(issue.text)));

const uncleared = api.clone(complete);
uncleared.secure = true;
assert.ok(api.issuesFor(uncleared, jobs).some(issue => issue.hard && /clearance/.test(issue.text)));

const overloaded = api.clone(complete);
overloaded.weight = 10000;
assert.ok(api.issuesFor(overloaded, jobs).some(issue => issue.hard && /capacity/.test(issue.text)));

const crowded = api.clone(complete);
crowded.assignments[0].crew = api.roster('mover').slice(9, 13).map(person => person.id);
assert.ok(api.issuesFor(crowded, jobs).some(issue => issue.hard && /four people/.test(issue.text)));
assert.equal(api.crewCount(day[5]).total, 4); // Includes the contractor lead.

const invalidTime = api.clone(complete);
invalidTime.start = '09:99';
assert.ok(api.issuesFor(invalidTime, jobs).some(issue => issue.hard));
const invalidState = api.clone(state);
invalidState.jobs[0].assignments[0].driver = 'UNKNOWN';
assert.ok(!api.validSaved(invalidState));

assert.equal(api.scheduleRows(jobs).length, 43); // Header + 42 truck/contractor rows.
assert.ok(api.csvText([['=SUM(A1:A2)', 'x,y', 'He said "hello"']]).includes("'=SUM"));
assert.ok(api.csvText([['x,y']]).includes('"x,y"'));
assert.ok(api.esc('<img src=x onerror="x">').includes('&lt;img'));

// Keep the no-build entry point usable after reorganizing files.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('href="assets/css/styles.css"'));
assert.ok(html.includes('src="assets/js/app.js" defer'));
assert.ok(fs.existsSync(path.join(root, 'assets/css/styles.css')));
assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon/.test(source));

console.log('Relay engine and repository checks passed.');
