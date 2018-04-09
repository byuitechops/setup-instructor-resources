/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, callback) => {
    tap.test('setup-instructor-resources', (test) => {
        var instructorResourcesId = -1;

        function getModules(getModulesCallback) {
            /* Check if the modules have been deleted */
            canvas.getModules(course.info.canvasOU, (getModulesErr, moduleList) => {
                if (getModulesErr) {
                    getModulesCallback(getModulesErr);
                    return;
                } 
                moduleList.forEach(module => {
                    if (module.name === 'Instructor Resources') {
                        instructorResourcesId = module.id;
                    } 
                });

                getModulesCallback(null);
            });
        }

        function getItems(getItemsCallback) {
            var order = [
                'General Lesson Notes',
                'Course Map',
                'Teaching Group Directory',
                'Online Instructor Community',
                'Course Maintenance Log',
                'Instructor Help Guide: Getting Started with Zoom',
                'Course Schedule (Archived)',
                'Course Maintenance Requests',
                'Copyright Permissions',
                'Copyediting Style Sheet',
            ];

            /* Check Student Resources Module Item Order */
            canvas.getModuleItems(course.info.canvasOU, instructorResourcesId, (getItemsErr, items) => {
                if (getItemsErr) {
                    getItemsCallback(getItemsErr);
                    return;
                }

                items.forEach((item, i) => {
                    if (item.title !== order[i]) {
                        test.fail('Module item order is not correct in Instructor Resources Module');
                    } else {
                        test.pass('Module item order is correct!');
                    }
                });

                getItemsCallback(null);
            });
        }

        var myFunctions = [
            getModules,
            getItems,
        ];

        asyncLib.waterfall(myFunctions, (waterfallErr) => {
            if (waterfallErr) {
                test.end();
                return;
            }

            test.end();
        })
        
    });

    callback(null, course);
};
