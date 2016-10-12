const fs = require('fs');
const Chrome = require('chrome-remote-interface');
const util = require('util');
const tracedir = "trace_file/"+Date.now()+"/"
const trace_categories = ['-*', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack'];

var rawEvents = [];

module.exports = emitter => {
    module.emitter = emitter;
}

var trace = (url) => {
    var filename = tracedir+'trace-raw.devtools.trace';
    Chrome(function (chrome) {
        with (chrome) {
            Page.enable();
            Tracing.start({ categories: trace_categories.join(',') });

            Page.navigate({ url: url })

            Page.loadEventFired( _ =>  Tracing.end() );

            Tracing.dataCollected( data => { rawEvents = rawEvents.concat(data.value); });

            Tracing.tracingComplete(function () {
                // find forced layouts
                // https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/front_end/timeline/TimelineModel.js&sq=package:chromium&type=cs&q=f:timelinemodel%20forced
                // var forcedReflowEvents = rawEvents
                //     .filter( e => e.name == 'UpdateLayoutTree' || e.name == 'Layout')
                //     .filter( e => e.args && e.args.beginData && e.args.beginData.stackTrace && e.args.beginData.stackTrace.length)

                // console.log('Found events:', util.inspect(forcedReflowEvents, { showHidden: false, depth: null }), '\n');

                // console.log('Results: (', forcedReflowEvents.length, ') forced style recalc and forced layouts found.\n')

                fs.writeFileSync(filename, JSON.stringify(rawEvents , null, 2));
                console.log('Trace file: ' + filename);
                console.log('You can open the trace file in DevTools Timeline panel. (Turn on experiment: Timeline tracing based JS profiler)\n');
                //console.log('Found events written to file: ' + file);

                chrome.close();
                module.emitter.emit('finish_test');
            });
        }
    }).on('error', e => console.error('Cannot connect to Chrome', e))
    return rawEvents;
}
var cpu = (url) => {

    Chrome(function (chrome) {
        with (chrome) {
            Page.enable();
            Page.loadEventFired(function () {
                // on load we'll start profiling, kick off the test, and finish
                // alternatively, Profiler.start(), Profiler.stop() are accessible via chrome-remote-interface
                Runtime.evaluate({ "expression": "console.profile(); startTest(); console.profileEnd();" });
            });

            Profiler.enable();

            // 100 microsecond JS profiler sampling resolution, (1000 is default)
            Profiler.setSamplingInterval({ 'interval': 100 }, function () {
                Page.navigate({'url': url});
            });

            Profiler.consoleProfileFinished(function (params) {
                // CPUProfile object (params.profile) described here:
                //    https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/protocol.json&q=protocol.json%20%22CPUProfile%22,&sq=package:chromium

                // Either:
                // 1. process the data however you wish… or,
                // 2. Use the JSON file, open Chrome DevTools, Profiles tab,
                //    select CPU Profile radio button, click `load` and view the
                //    profile data in the full devtools UI.
                var filename = tracedir+'profile.cpuprofile';
                var data = JSON.stringify(params.profile, null, 2);
                fs.writeFileSync(file, data);
                console.log('Done! See ' + file);
                chrome.close();
            });
        }
    }).on('error', function () {
        console.error('Cannot connect to Chrome');
    });
}

module.exports.tracedir = tracedir;
module.exports.trace = trace;
module.exports.cpu = cpu;