// /*eslint-env node, es6*/
/* eslint no-console:0 */


/* This testing doesn't really test anything, there were problems with the course that prevented the finishing of the testing. */


/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');

module.exports = (course, callback) => {
    tap.test('setup-instructor-resources', (test) => {

        // // test if gauntlet and new course have same number of items under module

        // canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules`, (err, modules) => {
        //     if (err) {
        //         course.error(err);
        //         test.end();
        //         console.log('SOMETHING WENT WRONG!!');
        //         return;
        //     }
        //     // test.equals(modules.length, 7);

        //     // Get ID of Instructor Resources Module
        //     var instructResourceModule = modules.filter(module => module.name === 'Instructor Resources (Do NOT Publish)');
        //     var moduleId = instructResourceModule[0].id;

        //     // test if the order is correct

        //     var order = [
        //         'Setup for Course Instructor',
        //         'General Lesson Notes',
        //         'Release Notes',
        //         'Course Map',
        //         'Teaching Group Directory',
        //         'Online Instructor Community',
        //         'Course Maintenance Log',
        //     ];

        //     canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${moduleId}/items`, (err, instructorMod) => {
        //         if (err) {
        //             course.error(err);
        //             console.log('SOMETHING WENT WRONG #2!!');
        //             test.end();
        //             return;
        //         }

        //         instructorMod.forEach((item, i) => {
        //             if (item.title === order[i]) {
        //                 test.pass('Module item order is correct!');
        //             } else {
        //                 test.fail('Module item order is not correct');
        //             }
        //         });
        //     });
        // });




        test.end();
    });

    callback(null, course);
};


// var srArr = course.info.standardResourcesArr;
// var hArr = course.info.headerArr;

// tap.equal(srArr.length, 6);

// tap.equal(srArr[0], 'Setup for Course Instructor');
// tap.equal(srArr[1], 'General Lesson Notes');
// tap.equal(srArr[2], 'Release Notes');
// tap.equal(srArr[3], 'Course Map');
// tap.equal(srArr[4], 'Teaching Group Directory');
// tap.equal(srArr[5], 'Online Instructor Community');

// tap.equal(hArr, 2);

// tap.equal(hArr[0], 'Standard Resources');
// tap.equal(hArr[1], 'Supplemental Resources');