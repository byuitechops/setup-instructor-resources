/*eslint-env node, es6*/

/* Module Description */

/* Put dependencies here */

/* Include this line only if you are going to use Canvas API */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

/* Variables */
var instructor_resources_id = -1;
var temp_id = -1;
var arr_length = -1;

/* View available course object functions */
// https://github.com/byuitechops/d2l-to-canvas-conversion-tool/blob/master/documentation/classFunctions.md

// TODO: Setup word hits both Development Team and Instructor
// TODO: Do a function to delete Temp module
// TODO: Before moving stuff over to temp module, delete SubHeader

module.exports = (course, stepCallback) => {
    course.addModuleReport('setup-instructor-resources');

    /****************************************************
    * buildHeader()
    * Parameters: course object, headerName str, pos int
    * Purpose: This function receives the name
    * of the text header to create and builds one
    * inside the instructor module
    ****************************************************/
    function buildHeader(course, headerName, pos, functionCallback) {
        canvas.post(`/api/v1/courses/${course.info.canvasOU}/modules/${instructor_resources_id}/items`, {
            'module_item': {
                'title': headerName,
                'type': 'SubHeader',
                'position': pos
            }
        }, (postErr, results) => {
            if (postErr) {
                functionCallback(postErr);
                return;
            } else {
                course.success(`setup-instructor-resources`, `Successfully built ${headerName} header`);
                functionCallback(null, course);
            }
        });
    }

    function makeTempModule(course, functionCallback) {
        canvas.post(`/api/v1/courses/${course.info.canvasOU}/modules`, {
            'module': {
                'name': 'Temp Module'
            }
        }, (postErr, module) => {
            if (postErr) {
                functionCallback(postErr);
                return;
            } else {
                course.success(`setup-instructor-resources`, `Sucessfully built temp module. TM ID: ${module.id}`);
                temp_id = module.id;
                functionCallback(null, course);
            }
        });
    }

    function moveToTemp(course, functionCallback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${instructor_resources_id}/items`, (getErr, module_items) => {
            if (getErr) {
                functionCallback(getErr);
                return;
            } else {
                asyncLib.eachLimit(module_items, 1, (module_item, eachLimitCallback) => {
                    canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${instructor_resources_id}/items/${module_item.id}`, {
                        'module_item': {
                            'module_id': temp_id,
                            'indent': 1,
                            'new_tab': true
                        }
                    }, (putErr, results) => {
                        if (putErr) {
                            eachLimitCallback(putErr);
                            return;
                        } else {
                            course.success(`setup-instructor-resources`,
                                `Successfully moved ${results.title} into the temp module`);
                            eachLimitCallback(null, course);
                        }
                    });
                }, (err) => {
                    if (err) {
                        functionCallback(err);
                        return;
                    } else {
                        course.success(`setup-instructor-resources`,
                            `Successfully moved all Instructor Resources stuff into temp module`);
                        functionCallback(null, course);
                    }
                });
            }
        });
    }

    /****************************************************
    * moveContents()
    * Parameters: course object
    * Purpose:
    *****************************************************/
    function moveContents(course, functionCallback) {
        var order = [
            'Setup for Course Instructor',
            'General Lesson Notes',
            'Release Notes',
            'Course Map',
            'Teaching Group Directory',
            'Online Instructor Community'//,
            //'Course Maintenance Log' -- DOES NOT EXIST IN GAUNTLET
        ];

        var arr = [];

        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${temp_id}/items`, (getErr, module_items) => {
            if (getErr) {
                functionCallback(getErr);
                return;
            } else {
                for (var i = 0; i < order.length; i++) {
                    for (var x = 0; x < module_items.length; x++) {
                        if (order[i] == module_items[x].title) {
                            arr.push(module_items.id);
                            break;
                        }
                    }
                    //item was never found in the temp module, will be commented for future reference
                    // if (i != arr.length) {
                    //     course.throwWarning(`setup-instructor-resources`, `${order[i]} is missing from Instructor Resources.`);
                    // }
                }

                asyncLib.eachLimit(arr, 1, (item, eachLimitCallback) => {
                    canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${temp_id}/items/${item}`, {
                        'module_item': {
                            'module_id': instructor_resources_id,
                            'new_tab': true,
                            'indent': 1
                        }
                    }, (putErr, results) => {
                        if (putErr) {
                            eachLimitCallback(putErr);
                            return;
                        } else {
                            course.success(`setup-instructor-resources`, `Successfully moved ${item} into Instructor Resources module`);
                            eachLimitCallback(null, course);
                        }
                    });
                }, (err) => {
                    if (err) {
                        functionCallback(err);
                        return;
                    } else {
                        arr_length = arr.length;
                        functionCallback(null, course, order, arr);
                    }
                });
            }
        });
    }

    function moveExtraContents(course, order, arr, functionCallback) {
        asyncLib.eachLimit(module_items, 3, (item, eachLimitCallback) => {
            if (!order.includes(item.title)) {
                canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${temp_id}/items/${item.id}`, {
                    'module_item': {
                        'module_id': instructor_resources_id,
                        'new_tab': true,
                        'indent': 1
                    }
                }, (putErr, results) => {
                    if (putErr) {
                        eachLimitCallback(putErr);
                        return;
                    } else {
                        course.success(`setup-instructor-resources`, `Successfully moved ${item.title} into Instructor Resources module`);
                        eachLimitCallback(null, course)
                    }
                });
            }
        }, (err) => {
            if (err) {
                functionCallback(err);
                return;
            } else {
                functionCallback(null, course);
            }
        });
    }

    function implementHeader(course, functionCallback) {
        buildHeader(course, 'Standard Resources', 1, (headerErr, results) => {
            if (headerErr) {
                functionCallback(headerErr);
                return;
            } else {
                course.success(`setup-instructor-resorces`, `Successfully built Standard Resources header`);
            }
        });

        buildHeader(course, 'Supplemental Resources', arr_length, (headerErr, results) => {
            if (headerErr) {
                functionCallback(headerErr);
                return;
            } else {
                course.success(`setup-instructor-resorces`, `Successfully built Supplemental Resources header`);
                functionCallback(null, course);
            }
        });
    }

    function waterfallFunctions(course, functionCallback) {
        var functions = [
            asyncLib.apply(makeTempModule, course),
            moveToTemp,
            moveContents,
            moveExtraContents,
            implementHeader
        ];

        asyncLib.waterfall(functions, (waterfallErr, results) => {
            if (waterfallErr) {
                functionCallback(waterfallErr);
                return;
            } else {
                functionCallback(null, course);
            }
        });
    }

    /****************************************************************
    *                         START HERE                           *
    ****************************************************************/
    //retrieve list of modules since course object doesn't come with a list of modules
    setTimeout(() => {
        canvas.getModules(course.info.canvasOU, (getErr, module_list) => {
            if (getErr) {
                course.throwErr(`setup-instructor-resources`, getErr);
                stepCallback(null, course);
                return;
            } else {
                var modules_name = [
                    'Instructor Resources'
                ];

                course.success(`setup-instructor-resources`, `Successfully retrieved ${module_list.length} modules.`);

                //retrieve the id of the instructor module so we can access the module
                //and update the instructor_resources_id global variable
                module_list.forEach(module => {
                    if (modules_name.includes(module.name)) {
                        instructor_resources_id = module.id;
                    }
                });

                if (instructor_resources_id === -1) {
                    course.throwErr(`setup-instructor-resources`, `Instructor Resources module not found. Please check the course and try again.`);
                    stepCallback(null, course);
                } else {
                    waterfallFunctions(course, (waterfallErr, results) => {
                        if (waterfallErr) {
                            course.throwErr(`setup-instructor-resources`, waterfallErr);
                            stepCallback(null, course);
                        } else {
                            course.success(`setup-instructor-resources`, `Successfully completed setup-instructor-resources`);
                            stepCallback(null, course);
                        }
                    });
                }
            }
        });
    }, 20000)
};
