// /*eslint-env node, es6*/

// /* Dependencies */
// const tap = require('tap');

// function g1Tests(course, callback) {
//     var srArr = course.info.standardResourcesArr;
//     var hArr = course.info.headerArr;

//     tap.equal(srArr.length, 6);

//     tap.equal(srArr[0], 'Setup for Course Instructor');
//     tap.equal(srArr[1], 'General Lesson Notes');
//     tap.equal(srArr[2], 'Release Notes');
//     tap.equal(srArr[3], 'Course Map');
//     tap.equal(srArr[4], 'Teaching Group Directory');
//     tap.equal(srArr[5], 'Online Instructor Community');

//     tap.equal(hArr, 2);

//     tap.equal(hArr[0], 'Standard Resources');
//     tap.equal(hArr[1], 'Supplemental Resources');

//     callback(null, course);
// }

// module.exports = [
//         {
//             gauntlet: 1,
//             tests: g1Tests
//         }
// ];

/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');

module.exports = (course, callback) => {
    tap.test('child-template', (test) => {

        test.pass('potato');
        test.pass('tomato');
        test.fail('avacado');

        test.end();
    });

    callback(null, course);
};
