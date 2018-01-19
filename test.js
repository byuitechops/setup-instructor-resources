const canvas = require('canvas-wrapper');
canvas.getModules(2781, (getErr, module_list) => {
    if (getErr) {
        console.log(getErr);
        return;
    } else {
        var modules_name = [
            'Instructor Resources'
        ];

        console.log(`setup-instructor-resources`, `Successfully retrieved ${module_list.length} modules.`);
    }
});
