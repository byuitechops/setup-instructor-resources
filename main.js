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
    * Parameters: headerName str, position int
    * Purpose: This function receives the name
    * of the text header to create and builds one
    * inside the instructor module
    ****************************************************/
    function buildHeader(headerName, position, buildHeaderCallback) {
        canvas.post(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}/items`, {
            'module_item': {
                'title': headerName,
                'type': 'SubHeader',
                'position': position
            }
        }, (postErr, results) => {
            if (postErr) {
                buildHeaderCallback(postErr);
                return;
            } else {
                course.message(`Successfully built \'${headerName}\' header`);
                buildHeaderCallback(null);
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
    function makeTempModule(makeTempModuleCallback) {
        canvas.post(`/api/v1/courses/${course.info.canvasOU}/modules`, {
            'module': {
                'name': 'Temp Module'
            }
        }, (postErr, module) => {
            if (postErr) {
                makeTempModuleCallback(postErr);
                return;
            } else {
                course.message(`Sucessfully built temp module. Temp module ID: ${module.id}`);
                tempId = module.id;
                makeTempModuleCallback(null);
                return;
            }
        });
    }

    /****************************************************
    * moveToTempModule()
    * This function goes through the instructor resources
    * module and then moves all of the items to the temporary
    * module
    ****************************************************/
    function moveToTempModule(moveToTempModuleCallback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}/items`, (getErr, moduleItem) => {
            if (getErr) {
                moveToTempModuleCallback(getErr);
                return;
            } else {
                //move each item to temp module
                asyncLib.eachSeries(moduleItem, (moduleItem, eachSeriesCallback) => {
                    canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}/items/${moduleItem.id}`, {
                        'module_item': {
                            'module_id': tempId,
                            'indent': 1,
                            'new_tab': true
                        }
                    }, (putErr, results) => {
                        if (putErr) {
                            eachSeriesCallback(putErr);
                            return;
                        } else {
                            course.message(`Successfully moved ${results.title} into the temp module`);
                            eachSeriesCallback(null);
                        }
                    });
                }, (err) => {
                    if (err) {
                        moveToTempModuleCallback(err);
                        return;
                    } else {
                        course.message(`Successfully moved all Instructor Resources stuff into temp module`);
                        moveToTempModuleCallback(null);
                        return;
                    }
                });
            }
        });
    }

    /****************************************************
    * moveContents()
    *****************************************************/
    function moveContents(moveContentsCallback) {
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
        var orderArray = [];

        //get temp module items
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items`, (getErr, moduleItem) => {
            if (getErr) {
                moveContentsCallback(getErr);
                return;
            } else {
                for (var i = 0; i < order.length; i++) {
                    for (var x = 0; x < moduleItem.length; x++) {
                        if (order[i] == moduleItem[x].title) {
                            orderArray.push(moduleItem[x].id);
                            break;
                        }
                    }
                }

                //move only standard resources portion of the instructor resources module.
                asyncLib.eachOfSeries(orderArray, (item, key, eachLimitCallback) => {
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
                            course.log(`re-organized Instructor Resources module`, {
                                'Title': results.title,
                                'ID': results.id
                            });
                            eachLimitCallback(null);
                        }
                    });
                }, (err) => {
                    if (err) {
                        moveContentsCallback(err);
                        return;
                    } else {
                        moveContentsCallback(null, orderArray.length);
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
    function implementHeaders(orderArrayLength, implementHeadersCallback) {
        //trying to make things more flexibile through array
        //this way guarantees that the Standard Resources header is created
        //before the Supplemental Resources header so the results are always
        //consistent.
        var headersObjArray = [
            {
                'title': 'Standard Resources',
                'position': 1
            },
            {
                'title': 'Supplemental Resources',

                //the + 2 accounts for the Standard Resources header and the order array length
                'position': orderArrayLength + 2
            }
        ];

        asyncLib.eachSeries(headersObjArray, (header, eachSeriesCallback) => {
            buildHeader(header.title, header.position, (headerErr, results) => {
                if (headerErr) {
                    eachSeriesCallback(headerErr);
                    return;
                }

                eachSeriesCallback(null);
            });
        }, (eachSeriesErr) => {
            if (eachSeriesErr) {
                implementHeadersCallback(eachSeriesErr);
                return;
            }

            implementHeadersCallback(null);
        });
    }

    /****************************************************
    * moveExtraContents()
    * Purpose: Move the remaining stuff to the Instructor
    * Resources module.
    *****************************************************/
    function moveExtraContents(moveExtraContentsCallback) {
        //get the temp module list
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items`, (getErr, moduleItem) => {
            // handle get Err
            if (getErr) {
                moveExtraContentsCallback(getErr);
                return;
            } else {
                //initiate the moving process
                asyncLib.eachSeries(moduleItem, (item, eachSeriesCallback) => {
                    if (item.type === 'SubHeader') {
                        //at this point, we know it is a subheader so we need to delete it from the course.
                        canvas.delete(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items/${item.id}`, (err, results) => {
                            if (err) {
                                eachSeriesCallback(err);
                            } else {
                                course.message(`Successfully deleted ${item.title} SubHeader`);
                                eachSeriesCallback(null);
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
                                eachSeriesCallback(putErr);
                                return;
                            } else {
                                course.log(`re-organized Instructor Resources module`, {
                                    'Title': item.title,
                                    'ID': item.id
                                });
                                eachSeriesCallback(null);
                            }
                        });
                    }
                }, (err) => {
                    if (err) {
                        moveExtraContentsCallback(err);
                        return;
                    } else {
                        moveExtraContentsCallback(null);
                        return;
                    }
                });
            }
        });
    }

    /****************************************************
    * deleteTempModule()
    * This function goe through and deletes the temp module.
    * It also resets the tempId to -1 to signify that the
    * module does not exist anymore.
    *****************************************************/
    function deleteTempModule(deleteTempModuleCallback) {
        canvas.delete(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}`, (deleteErr, results) => {
            if (deleteErr) {
                deleteTempModuleCallback(deleteErr);
                return;
            } else {
                tempId = -1;
                course.message(`Sucessfully removed temp module`);
                deleteTempModuleCallback(null);
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
    function finalTouches(finalTouchesCallback) {
        canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${instructorResourcesId}`, {
            'module': {
                'name': 'Instructor Resources (Do NOT Publish)',
                'published': false
            }
        }, (putErr, results) => {
            if (putErr) {
                finalTouchesCallback(putErr);
                return;
            } else {
                finalTouchesCallback(null);
                return;
            }
        });
    }

    /****************************************************
    * waterfallFunctions()
    * This function goe through the waterfall motions and
    * acts as the driver for the function
    *****************************************************/
    function waterfallFunctions(waterfallFunctionsCallback) {
        var functions = [
            makeTempModule,
            moveToTempModule,
            moveContents,
            implementHeaders,
            moveExtraContents,
            deleteTempModule,
            finalTouches
        ];

        asyncLib.waterfall(functions, (waterfallErr, results) => {
            if (waterfallErr) {
                waterfallFunctionsCallback(waterfallErr);
                return;
            } else {
                waterfallFunctionsCallback(null);
                return;
            }
        });
    }

    /****************************************************************
    *                         START HERE                           *
    ****************************************************************/
    //retrieve list of modules since course object doesn't come with a list of modules
    canvas.getModules(course.info.canvasOU, (getModulesErr, moduleList) => {
        if (getModulesErr) {
            course.error(getModulesErr);
            stepCallback(null, course);
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
                waterfallFunctions((waterfallFunctionsErr, results) => {
                    if (waterfallFunctionsErr) {
                        course.error(waterfallFunctionsErr);
                        stepCallback(null, course);
                    } else {
                        course.message(`Successfully completed setup-instructor-resources module`);
                        stepCallback(null, course);
                    }
                });
            }
        }
    });
};
