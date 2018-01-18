/*eslint-env node, es6*/

/* Module Description */

/* Put dependencies here */

/* Include this line only if you are going to use Canvas API */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

/* Variables */
var instructor_resources_id = -1;

/* View available course object functions */
// https://github.com/byuitechops/d2l-to-canvas-conversion-tool/blob/master/documentation/classFunctions.md

module.exports = (course, stepCallback) => {
    course.addModuleReport('setup-instructor-resources');

    /****************************************************
    * buildHeader()
    * Parameters: course object, headerName str, pos int
    * Purpose: This function receives the name
    * of the text header to create and builds one
    * based on the position inside the instructor module
    ****************************************************/
    function buildHeader(course, headerName, pos) {

    }

    /****************************************************
    * reorganizeContents()
    * Parameters: course object
    * Purpose: This function will go through the module
    * and reorganize it based on the OCT course.
    *****************************************************/
    function reorganizeContents(course) {
        var order = [
            'Setup for Course Instructor',
            'General Lesson Notes',
            'Release Notes',
            'Course Map',
            'Teaching Group Directory',
            'Online Instructor Community',
            'Course Maintenance Log'
        ];
    }

    /****************************************************************
    *                          START HERE                           *
    ****************************************************************/
    //retrieve list of modules since course object doesn't come with a list of modules
    canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules`, (getErr, module_list) => {
        if (getErr) {
            course.throwErr(`setup-instructor-resources`, getErr);
            return;
        } else {
            var modules_name = [
                'Instructor Resources'
            ];

            //the imsmanifest.xml file is a file that comes with the Brightspace
            //course and contains all the information about the course. This way
            //is guaranteed to get the RIGHT number of modules since asynchronous
            //code returns a number that is different everytime.
            var manifest = course.content.find(file => {
                return file.name == 'imsmanifest.xml';
            });

            modules_length = manifest.dom('organization>item').length;

            course.success(`setup-instructor-resources`, `Successfully retrieved ${modules_length} modules.`);

            //retrieve the id of the instructor module so we can access the module
            //and update the instructor_resources_id global variable
            module_list.forEach(module => {
                if (modules_name.contains(module.name)) {
                    instructor_resources_id = module.id;
                }
            });

            if (instructor_resources_id === -1) {
                course.throwWarning(`setup-instructor-resources`, `Instructor Resources module not found. Please check the course and try again.`);
                stepCallback(null, course);
            }
        }
    });
};
