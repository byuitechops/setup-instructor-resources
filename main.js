/*eslint-env node, es6*/

/* Module Description */

/* Put dependencies here */

/* Include this line only if you are going to use Canvas API */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

/* Variables */
var instructorResourcesId = -1;
var tempId = -1;

module.exports = (course, stepCallback) => {
    /****************************************************
    * buildHeader()
    * Parameters: headerName str, pos int
    * Purpose: This function receives the name
    * of the text header to create and builds one
    * inside the instructor module
    ****************************************************/
    function buildHeader(headerName, pos, functionCallback) {
        canvas.post(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}/items`, {
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
                course.message(`Successfully built ${headerName} header`);
                functionCallback(null);
                return;
            }
        });
    }

    /****************************************************
    * makeTempModule()
    * This function goes through and creates the temp module
    * so the instructor resources module will be clean and
    * ready to start the process.
    ****************************************************/
    function makeTempModule(functionCallback) {
        canvas.post(`/api/v1/courses/${course.info.canvasOU}/modules`, {
            'module': {
                'name': 'Temp Module'
            }
        }, (postErr, module) => {
            if (postErr) {
                functionCallback(postErr);
                return;
            } else {
                course.message(`Sucessfully built temp module. TM ID: ${module.id}`);
                tempId = module.id;
                functionCallback(null);
                return;
            }
        });
    }

    /****************************************************
    * moveToTemp()
    * This function goes through the instructor resources
    * module and then moves all of the items to the temporary
    * module
    ****************************************************/
    function moveToTemp(functionCallback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}/items`, (getErr, moduleItem) => {
            if (getErr) {
                functionCallback(getErr);
                return;
            } else {
                //move each item to temp module
                asyncLib.eachSeries(moduleItem, (moduleItem, eachLimitCallback) => {
                    canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}/items/${moduleItem.id}`, {
                        'module_item': {
                            'module_id': tempId,
                            'indent': 1,
                            'new_tab': true
                        }
                    }, (putErr, results) => {
                        if (putErr) {
                            eachLimitCallback(putErr);
                            return;
                        } else {
                            course.message(`Successfully moved ${results.title} into the temp module`);
                            eachLimitCallback(null);
                        }
                    });
                }, (err) => {
                    if (err) {
                        functionCallback(err);
                        return;
                    } else {
                        course.message(`Successfully moved all Instructor Resources stuff into temp module`);
                        functionCallback(null);
                        return;
                    }
                });
            }
        });
    }

    /****************************************************
    * moveContents()
    *****************************************************/
    function moveContents(functionCallback) {
        //required ordering according to OCT course
        var order = [
            'Setup for Course Instructor',
            'General Lesson Notes',
            'Release Notes',
            'Course Map',
            'Teaching Group Directory',
            'Online Instructor Community',
            'Course Maintenance Log'
        ];

        //store results
        var arr = [];

        //get temp module items
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items`, (getErr, moduleItem) => {
            if (getErr) {
                functionCallback(getErr);
                return;
            } else {
                for (var i = 0; i < order.length; i++) {
                    for (var x = 0; x < moduleItem.length; x++) {
                        if (order[i] == moduleItem[x].title) {
                            arr.push(moduleItem[x].id);
                            break;
                        }
                    }
                }

                //move only standard resources portion of the instructor resources module.
                asyncLib.eachOfSeries(arr, (item, key, eachLimitCallback) => {
                    canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items/${item}`, {
                        'module_item': {
                            'module_id': instructorResourcesId,
                            'new_tab': true,
                            'indent': 1,
                            'published': false,
                            'position': key + 1
                        }
                    }, (putErr, results) => {
                        if (putErr) {
                            eachLimitCallback(putErr);
                            return;
                        } else {
                            course.log(`re-organized Instructor Resources`, {
                                'Title': results.title,
                                'ID': results.id
                            });
                            eachLimitCallback(null);
                        }
                    });
                }, (err) => {
                    if (err) {
                        functionCallback(err);
                        return;
                    } else {
                        functionCallback(null, order, order.length);
                        return;
                    }
                });
            }
        });
    }

    /****************************************************
    * moveExtraContents()
    * Purpose: Move the remaining stuff to the Instructor
    * Resources module.
    *****************************************************/
    function moveExtraContents(order, arrLength, functionCallback) {
        //build headers
        implementHeaders(arrLength, (headerErr) => {
            if (headerErr) {
                functionCallback(err);
                return;
            }
        });

        //get the temp module list
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items`, (getErr, moduleItem) => {
            // handle get Err
            if (getErr) {
                functionCallback(getErr);
                return;
            } else {
                //initiate the moving process
                asyncLib.eachSeries(moduleItem, (item, eachLimitCallback) => {
                    if (item.type === 'SubHeader') {
                        //at this point, we know it is a subheader so we need to delete it from the course.
                        canvas.delete(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items/${item.id}`, (err, results) => {
                            if (err) {
                                eachLimitCallback(err);
                            } else {
                                course.message(`Successfully deleted ${item.title} SubHeader`);
                                eachLimitCallback(null);
                            }
                        });
                    } else {
                        //we know at this point that it is not a SubHeader so move it out of temp module
                        canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items/${item.id}`, {
                            'module_item': {
                                'module_id': instructorResourcesId,
                                'new_tab': true,
                                'indent': 1,
                                'published': false,
                                'position': 99 //set to the end of instructor resources
                            }
                        }, (putErr, results) => {
                            if (putErr) {
                                eachLimitCallback(putErr);
                                return;
                            } else {
                                course.log(`re-organized Instructor Resources`, {
                                    'Title': item.title,
                                    'ID': item.id
                                });
                                eachLimitCallback(null);
                            }
                        });
                    }
                }, (err) => {
                    if (err) {
                        functionCallback(err);
                        return;
                    } else {
                        functionCallback(null);
                        return;
                    }
                });
            }
        });
    }

    /****************************************************
    * implementHeaders()
    * Purpose: Call the function to build the headers
    * and pass in the number and header title to the function
    *****************************************************/
    function implementHeaders(arrLength, functionCallback) {
        buildHeader('Standard Resources', 1, (headerErr, results) => {
            if (headerErr) {
                functionCallback(headerErr);
                return;
            }
        });

        buildHeader('Supplemental Resources', arrLength + 1, (headerErr, results) => {
            if (headerErr) {
                functionCallback(headerErr);
                return;
            } else {
                functionCallback(null);
                return;
            }
        });
    }

    /****************************************************
    * deleteTempModule()
    * This function goe through and deletes the temp module.
    * It also resets the tempId to -1 to signify that the
    * module does not exist anymore.
    *****************************************************/
    function deleteTempModule(functionCallback) {
        canvas.delete(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}`, (deleteErr, results) => {
            if (deleteErr) {
                functionCallback(deleteErr);
                return;
            } else {
                tempId = -1;
                course.message(`Sucessfully removed temp module`);
                functionCallback(null);
                return;
            }
        });
    }

    /****************************************************
    * finalTouches()
    * This function goes through and ensures that the
    * instructor resources module are being implemented
    * correctly. 
    *****************************************************/
    function finalTouches(functionCallback) {
        canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}`, {
            'module': {
                'name': 'Instructor Resources (Do NOT Publish)',
                'published': false
            }
        }, (putErr, results) => {
            if (putErr) {
                functionCallback(putErr);
                return;
            } else {
                functionCallback(null);
                return;
            }
        });
    }

    /****************************************************
    * waterfallFunctions()
    * This function goe through the waterfall motions and
    * acts as the driver for the function
    *****************************************************/
    function waterfallFunctions(functionCallback) {
        var functions = [
            makeTempModule,
            moveToTemp,
            moveContents,
            moveExtraContents,
            deleteTempModule,
            finalTouches
        ];

        asyncLib.waterfall(functions, (waterfallErr, results) => {
            if (waterfallErr) {
                functionCallback(waterfallErr);
                return;
            } else {
                functionCallback(null);
                return;
            }
        });
    }

    /****************************************************************
    *                         START HERE                           *
    ****************************************************************/
    //retrieve list of modules since course object doesn't come with a list of modules
    canvas.getModules(course.info.canvasOU, (getErr, moduleList) => {
        if (getErr) {
            course.error(getErr);
            stepCallback(null);
            return;
        } else {
            course.message(`Successfully retrieved ${moduleList.length} modules.`);
            //retrieve the id of the instructor module so we can access the module
            //and update the instructorResourcesId global variable

            var instructorResourcesObj = moduleList.find((module) => {
                return module.name === 'Instructor Resources';
            });

            instructorResourcesId = instructorResourcesObj.id;

            //instructor resources module does not exist. throw error and move on to the next child module
            if (instructorResourcesId === -1 || typeof instructorResourcesId === "undefined") {
                course.warning(`Instructor Resources module not found. Please check the course and try again.`);
                stepCallback(null, course);
            } else {
                waterfallFunctions((waterfallErr, results) => {
                    if (waterfallErr) {
                        course.error(waterfallErr);
                        stepCallback(null, course);
                    } else {
                        course.message(`Successfully completed setup-instructor-resources`);
                        stepCallback(null, course);
                    }
                });
            }
        }
    });
};
