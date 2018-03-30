# Setup Instructor Resources
### *Package Name*: setup-instructor-resources
### *Child Type*: Post-Import
### *Platform*: Online
### *Required*: Required

This child module is built to be used by the Brigham Young University - Idaho D2L to Canvas Conversion Tool. It utilizes the standard `module.exports => (course, stepCallback)` signature and uses the Conversion Tool's standard logging functions. You can view extended documentation [here](https://github.com/byuitechops/d2l-to-canvas-conversion-tool/tree/master/documentation).

## Purpose

The main purpose of this child module is setup the Instructor Resources module similar to the OCT's Instructor Resources module layout. In this case,
ordering does matter. It accomplishes this by creating a temporary module and move everything from Instructor Resources to the temporary module. After
that is accomplished, it moves everything back into the Instructor Resources module in the proper order. Once everything is moved back and sorted, the
temporary module is then deleted from the course.

## How to Install

```
npm install setup-instructor-resources
```

## Run Requirements

None

## Options

None

## Outputs

None

## Process

Describe in steps how the module accomplishes its goals.

1. Gets the list of modules in the course and determines if the Instructor Resources exist.
    - If there is an Instructor Resources module, it grabs the ID of the module and then proceeds to the next step.
    - If it does not exist, the program will go ahead and create one.
2. Create a temporary module and move all of the contents from the Instructor Resources module to the temp module.
3. Create an array of IDs for the activities that are to be in order -- they are to be under the Standard Resources header
4. Move the contents from the temp module to the Instructor Resources according to the array of IDs. 
5. Move the rest and put them at the bottom of the Instructor Resources module.
6. Create two text subheaders titled, "Standard Resources" and "Supplemental Resources"
7. Ensure that the temporary module contains no more items then delete the module
8. Renames the Instructor Resources to ensure that it is NOT published and the title of the module to explicitly state so.

## Log Categories

List the categories used in logging data in your module.

- Items sorted - Title: re-organized Instructor Resources module

## Requirements

1. Ensure that the Instructor Resources module (specifically Standard Resources portion) match the OCT's Instructor Resources layout.
