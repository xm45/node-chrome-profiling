const fs = require('fs');
const Chrome = require('chrome-remote-interface');
const util = require('util');
const tracedir = "trace_file/"+Date.now()+"/"

Chrome(function (chrome) {
    with (chrome) {

        var url = 'http://baidu.com';
        var rawEvents = [];
        var trace_categories = ['-*', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack'];

        Page.enable();
        Tracing.start({ categories: trace_categories.join(',') });

        Page.navigate({ url: url })

        Page.loadEventFired( _ =>  Tracing.end() );

        Tracing.dataCollected( data => { rawEvents = rawEvents.concat(data.value); });

        Tracing.tracingComplete(function () {
            // find forced layouts
            // https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/front_end/timeline/TimelineModel.js&sq=package:chromium&type=cs&q=f:timelinemodel%20forced
            var forcedReflowEvents = rawEvents
                .filter( e => e.name == 'UpdateLayoutTree' || e.name == 'Layout')
                .filter( e => e.args && e.args.beginData && e.args.beginData.stackTrace && e.args.beginData.stackTrace.length)

            console.log('Found events:', util.inspect(forcedReflowEvents, { showHidden: false, depth: null }), '\n');

            console.log('Results: (', forcedReflowEvents.length, ') forced style recalc and forced layouts found.\n')

            var file = tracedir + 'forced-reflow-' + Date.now() + '.devtools.trace';
            fs.writeFileSync(file, JSON.stringify(forcedReflowEvents , null, 2));
            console.log('Found events written to file: ' + file);

            chrome.close();
        });
    }
}).on('error', e => console.error('Cannot connect to Chrome', e))

exports.tracedir = tracedir;