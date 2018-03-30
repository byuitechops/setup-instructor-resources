/*eslint-env node, es6*/

const canvas = require('canvas-wrapper');
const asyncLib = require('async');

/* Variables */
var instructorResourcesId = -1;
var tempId = -1;

module.exports = (course, stepCallback) => {
    /****************************************************
    * buildHeader()
    * 
    * @param headerName - str
    * @param position - int
    * 
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
                'position': position,
            }
        }, (postErr, results) => {
            if (postErr) {
                buildHeaderCallback(postErr);
                return;
            }

            buildHeaderCallback(null);
        });
    }

    /****************************************************
    * buildModule()
    * 
    * @param name - str
    * @param position - int
    * 
    * This function takes in a name and builds a module
    * with the name as its title. It will call the callback
    * with the module object so the function caller can
    * do whatever it needs to do.
    ****************************************************/
    function buildModule(name, position, buildModuleCallback) {
        canvas.post(`/api/v1/courses/${course.info.canvasOU}/modules`, {
            'module': {
                'name': name,
                'published': false,
                'position': position,
            }
        }, (postErr, module) => {
            if (postErr) {
                buildModuleCallback(postErr);
                return;
            }
            
            buildModuleCallback(null, module);
        });
    }

    /****************************************************
    * createTempModule()
    * 
    * This function goes through and creates the temp module
    * so the instructor resources module will be clean and
    * ready to start the process.
    ****************************************************/
    function createTempModule(createTempModuleCallback) {
        buildModule('Temp Module', 1, (err, module) => {
            if (err) {
                createTempModuleCallback(err);
                return;
            }

            tempId = module.id;
            createTempModuleCallback(null);
        });
    }

    /****************************************************
    * moveToTempModule()
    * 
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
                        }

                        eachSeriesCallback(null);
                    });
                }, (err) => {
                    if (err) {
                        moveToTempModuleCallback(err);
                        return;
                    }

                    moveToTempModuleCallback(null);
                });
            }
        });
    }

    /****************************************************
    * moveContents()
    * 
    * This function goes through and ensures that the items
    * in the IR module are in the correct order.
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
            'Course Maintenance Log',
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
                        if (order[i].toLowerCase() == moduleItem[x].title.toLowerCase()) {
                            orderArray.push(moduleItem[x].id);
                            break;
                        }
                    }
                }

                //move only standard resources portion of the instructor resources module.
                asyncLib.eachOfSeries(orderArray, (item, key, eachOfSeriesCallback) => {
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
                            eachOfSeriesCallback(putErr);
                            return;
                        }

                        course.log(`Re-organized Instructor Resources module`, {
                            'Title': results.title,
                            'ID': results.id
                        });

                        eachOfSeriesCallback(null);
                    });
                }, (err) => {
                    if (err) {
                        moveContentsCallback(err);
                        return;
                    }

                    moveContentsCallback(null, orderArray.length);
                    return;
                });
            }
        });
    }

    /****************************************************
    * implementHeaders()
    * 
    * @param orderArrayLength - int
    * 
    * Purpose: Call the function to build the headers
    * and pass in the number and header title to the function
    *****************************************************/
    function implementHeaders(orderArrayLength, implementHeadersCallback) {
        //trying to make things more flexibile through array
        //this way guarantees that the Standard Resources header is created
        //before the Supplemental Resources header so the results are always
        //consistent.
        var headers = [
            {
                'title': 'Standard Resources',
                'position': 1,
            },
            {
                'title': 'Supplemental Resources',

                //the + 2 accounts for the Standard Resources header and the order array length
                'position': orderArrayLength + 2,
            },
        ];

        asyncLib.eachSeries(headers, (header, eachSeriesCallback) => {
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
    * 
    * Purpose: Move the remaining stuff to the Instructor
    * Resources module.
    *****************************************************/
    function moveExtraContents(moveExtraContentsCallback) {
        //get the temp module list
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items`, (getErr, moduleItem) => {
            if (getErr) {
                moveExtraContentsCallback(getErr);
                return;
            } else {
                asyncLib.eachSeries(moduleItem, (item, eachSeriesCallback) => {
                    if (item.type === 'SubHeader') {
                        //delete all unnecessary subheaders
                        canvas.delete(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}/items/${item.id}`, (err, results) => {
                            if (err) {
                                eachSeriesCallback(err);
                            }
                            
                            eachSeriesCallback(null);
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
                            }

                            course.log(`Re-organized Instructor Resources module`, {
                                'Title': item.title,
                                'ID': item.id
                            });

                            eachSeriesCallback(null);
                        });
                    }
                }, (err) => {
                    if (err) {
                        moveExtraContentsCallback(err);
                        return;
                    }
                    
                    moveExtraContentsCallback(null);
                });
            }
        });
    }

    /****************************************************
    * deleteTempModule()
    * 
    * This function goe through and deletes the temp module.
    * It also resets the tempId to -1 to signify that the
    * module does not exist anymore.
    *****************************************************/
    function deleteTempModule(deleteTempModuleCallback) {
        canvas.delete(`/api/v1/courses/${course.info.canvasOU}/modules/${tempId}`, (deleteErr, results) => {
            if (deleteErr) {
                deleteTempModuleCallback(deleteErr);
                return;
            }

            tempId = -1;
            deleteTempModuleCallback(null);
        });
    }

    /****************************************************
    * finalTouches()
    * 
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
            }
            
            finalTouchesCallback(null);
        });
    }

    /****************************************************
    * instructorResourcesExist()
    * 
    * This function goe through the waterfall motions and
    * acts as the driver for the functions
    *****************************************************/
    function instructorResourcesExist(instructorResourcesExistCallback) {
        var functions = [
            createTempModule,
            moveToTempModule,
            moveContents,
            implementHeaders,
            moveExtraContents,
            deleteTempModule,
            finalTouches,
        ];

        asyncLib.waterfall(functions, (waterfallErr, results) => {
            if (waterfallErr) {
                instructorResourcesExistCallback(waterfallErr);
                return;
            }

            instructorResourcesExistCallback(null);
        });
    }

    /****************************************************
    * instructorResourcesDoNotExist()
    * 
    * This function goe through the waterfall motions and
    * acts as the driver for the course when it does NOT
    * have an Instructor Resources module.
    *****************************************************/
    function instructorResourcesDoNotExist(instructorResourcesDoNotExistCallback) {
        var functions = [
            createInstructorResourcesModule,
            searchCourse,
            cleanUpContents,
            constructIRContents,
            implementHeaders,
        ];

        asyncLib.waterfall(functions, (waterfallErr, results) => {
            if (waterfallErr) {
                instructorResourcesDoNotExistCallback(waterfallErr);
                return;
            }

            instructorResourcesDoNotExistCallback(null);
        });
    }

    /****************************************************
    * createInstructorResourcesModule()
    * 
    * This function ensures that the Instructor Resources
    * module has been created.
    *****************************************************/
    function createInstructorResourcesModule(createModuleCallback) {
        buildModule('Instructor Resources (Do NOT Publish)',  2, (err, module) => {
            if (err) {
                createModuleCallback(err);
                return;
            }

            instructorResourcesId = module.id;
            createModuleCallback(null);
        });
    }

    /****************************************************
    * searchCourse()
    * 
    * This function goes through the course and tries to 
    * find the items that belong inside the Instructor 
    * Resources.
    *****************************************************/
    function searchCourse(searchCourseCallback) {
        var contentsArr = [];
        var validModuleItems = [
            'Setup for Course Instructor',
            'General Lesson Notes',
            'Release Notes',
            'Course Map',
            'Teaching Group Directory',
            'Online Instructor Community',
            'Course Maintenance Log',
        ];

        //retrieving all modules
        canvas.getModules(course.info.canvasOU, (getModulesErr, moduleList) => {
            if (getModulesErr) {
                searchCourseCallback(getModulesErr);
                return;
            }

            //getting all assignments from each module
            asyncLib.each(moduleList, (element, eachCallback) => {
                canvas.getModuleItems(course.info.canvasOU, element.id, (getModulesItemsErr, moduleItems) => {
                    if (getModulesItemsErr) {
                        eachCallback(getModulesItemsErr);
                        return;
                    }

                    asyncLib.each(moduleItems, (item, innerEachCallback) => {
                        if (validModuleItems.includes(item.title)) {
                            //pushing item object so all properties will remain
                            contentsArr.push(item);
                        }

                        //advance to next iteration
                        innerEachCallback(null);
                    }, (innerErr) => {
                        if (innerErr) {
                            eachCallback(innerErr);
                            return;
                        }

                        eachCallback(null);
                    });
                });
            }, (outerErr) => {
                if (outerErr) {
                    searchCourseCallback(outerErr);
                    return;
                }

                searchCourseCallback(null, contentsArr);
            });
        });
    }

    /****************************************************
    * cleanUpContents()
    * 
    * This goes through and ensures that the ordering is
    * correct for the Instructor Resources module.
    *****************************************************/
    function cleanUpContents(contentsArr, cleanUpContentsCallback) {
        var orderArray = [];
        var checkFlag = false;
        var order = [
            'Setup for Course Instructor',
            'General Lesson Notes',
            'Release Notes',
            'Course Map',
            'Teaching Group Directory',
            'Online Instructor Community',
            'Course Maintenance Log'
        ];

        for (var i = 0; i < order.length; i++) {
            checkFlag = false;

            for (var x = 0; x < contentsArr.length; x++) {
                if (order[i].toLowerCase() == contentsArr[x].title.toLowerCase()) {
                    orderArray.push(contentsArr[x]);
                    checkFlag = true;
                    break;
                }
    
                //the activity was never found in the course.
                if (!checkFlag && x === contentsArr.length - 1) {
                    course.warning(`${order[i]} was not found in the course. Please check the course.`);
                }
            }
        }

        cleanUpContentsCallback(null, orderArray);
    }

    /****************************************************
    * constructIRContents()
    * 
    * Since the ordering has been fixed, this function
    * goes through and makes the api calls necessary 
    * to move the item to the proper module. 
    *****************************************************/
    function constructIRContents(moduleItems, constructIRContentsCallback) {
        //just making sure something doesn't go wrong here.
        if (typeof instructorResourcesId === 'undefined' ||
            instructorResourcesId === null) {
                constructIRContentsCallback(new Error('Instructor Resources does not exist in the course.'));
                return;
        }

        asyncLib.eachOfSeries(moduleItems, (item, key, eachOfSeriesCallback) => {
            canvas.put(`/api/v1/courses/${course.info.canvasOU}/modules/${item.module_id}/items/${item.id}`, {
                        'module_item': {
                            'module_id': instructorResourcesId, 
                            'new_tab': true,
                            'indent': 1,
                            'published': false,
                            'position': key + 1, //move below SubHeader
                        }   
                    }, (putErr, results) => {
                        if (putErr) {
                            eachOfSeriesCallback(putErr);
                            return;
                        }

                         course.log(`Re-organized Instructor Resources module`, {
                             'Title': results.title,
                             'ID': results.id
                         });

                        eachOfSeriesCallback(null);
                    });

        }, (eachOfSeriesErr) => {
            if (eachOfSeriesErr) {
                constructIRContentsCallback(eachOfSeriesErr, moduleItems.length);
                return;
            }

            constructIRContentsCallback(null, moduleItems.length);
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
        }

        //retrieve the id of the instructor module so we can access the module
        //and update the instructorResourcesId global variable
        var instructorResourcesObj = moduleList.find((module) => {
            return module.name === 'Instructor Resources';
        });

        //we need to check here if an Instructor Resources module was ever found
        //If it hasn't been found, we need to create one and move all Instructor
        //Resources items to the IR Module. Otherwise, just proceed with the regular functions.
        if (typeof instructorResourcesObj === "undefined") {
            instructorResourcesDoNotExist((err) => {
                if (err) {
                    course.error(err);
                }
                
                stepCallback(null, course);
            });
        } else {
            instructorResourcesId = instructorResourcesObj.id;

            instructorResourcesExist((err) => {
                if (err) {
                    course.error(err);
                }

                stepCallback(null, course);
            });
        }
    });
};