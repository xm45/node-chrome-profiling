const StringBuffer = require("./lib").StringBuffer;
const Chrome = require('chrome-remote-interface');
const util = require('util');
const trace_categories = ["-*", "devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "toplevel", "blink.console", "disabled-by-default-devtools.timeline.stack", "disabled-by-default-devtools.screenshot", "disabled-by-default-v8.cpu_profile"];

var rawEvents = [];

module.exports = emitter => {
    module.emitter = emitter;
}

var trace = (url) => {
    Chrome(function (chrome) {
        with (chrome) {
            Page.enable();
            Tracing.start({ categories: trace_categories.join(',') });

            Page.navigate({ url: url })

            Page.loadEventFired( _ =>  Tracing.end() );

            Tracing.dataCollected( data => { rawEvents = rawEvents.concat(data.value); });

            Tracing.tracingComplete(function () {
                module.exports.rawEvents = rawEvents;
                chrome.close();
                module.emitter.emit('finish_test');
            });
        }
    }).on('error', e => console.error('Cannot connect to Chrome', e))
}

//bug, can't using in otherwise domain except
var cpu = (url) => {
    Chrome(function (chrome) {
        console.log("cpu profile");
        with (chrome) {
            Page.enable();
            Page.loadEventFired(function () {
                Runtime.evaluate({ "expression": "console.profile(); startTest(); console.profileEnd();" });
            });

            Profiler.enable();

            // 100 microsecond JS profiler sampling resolution, (1000 is default)
            Profiler.setSamplingInterval({ 'interval': 100 }, function () {
                Page.navigate({'url': url});
            });

            Profiler.consoleProfileFinished(function (params) {
                var data = JSON.stringify(params.profile, null, 2);
                module.exports.cpuProfile = data;
                // var filename = tracedir+'profile.cpuprofile';
                // fs.writeFileSync(file, data);
                // console.log('CPUprofile file: ' + filename);
                chrome.close();
                module.emitter.emit('finish_test');
            });
        }
    }).on('error', function () {
        console.error('Cannot connect to Chrome');
    });
}

module.exports.trace = trace;
module.exports.cpu = cpu;