const fs = require('fs');
const Chrome = require('chrome-remote-interface');
const util = require('util');
const tracedir = "trace_file/"+Date.now()+"/"
const filename = tracedir+'trace-raw.devtools.trace';
const trace_categories = ['-*', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack'];

var rawEvents = [];

module.exports = emitter => {
    module.emitter = emitter;
}

var run = (url) => {
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
                module.emitter.emit('exit');
            });
        }
    }).on('error', e => console.error('Cannot connect to Chrome', e))
    return rawEvents;
}

module.exports.tracedir = tracedir;
module.exports.run = run;