# setup-instructor-resources

This is a child module for the Course Conversion Tool at Brigham Young University - Idaho. The main
purpose of this child module is to re-organize the Instructor Resources module to match the OCT course
on Canvas.

## Pre-Import or Post-Import
This child module occurs *post-import* from Brightspace D2L to Canvas.

## Additional Information
* The following activities are stored underneath the Standard Resources header:
- Setup for Course Instructor
- General Lesson Notes
- Release Notes
- Course Map
- Teaching Group Directory
- Online Instructor Community
- Course Maintenance Log

* All other activities are stored underneath Supplemental Resources text header.
* A different child module(https://github.com/byuitechops/module-publish-settings) will go through all of the modules and unpublish certain
modules so this module does not deal with the publish/unpublish portion of the module.


## Authors
* Sam McGrath
