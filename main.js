const fs = require('fs');
const events = require("events");
const emitter = new events.EventEmitter();

var bigrig = require('./libs/bigrig');
const StringBuffer = require("./lib").StringBuffer;

const runner = require("./run_chrome");
const tester = require("./tester");
const parser = require("./parser");

var tracedir = "trace_file/"+Date.now()+"/";
var tracefile = 'trace-raw.devtools.trace';
var reflowfile = 'forced-reflow.trace';
var reportfile = "report.txt";

const url = "http://www.baidu.com";

var rawEvents = [];
var result = function(){};
//check file
var checkDir = (x)=>{
	if(x){
		if(!fs.existsSync(x)){
			fs.mkdirSync(x);
		}
	}
}

var init = () => {
	checkDir(runner.tmpdir);
	runner(emitter);
	tester(emitter);
	runner.run();
}

var start = () => {
	tester.trace(url);
}

var parse = () => {
	result.rawEvents = tester.rawEvents;
	parser.set(result.rawEvents);
	result.reflow = parser.getReflow();
	result.highlevel = parser.highlevel(url);
	result.highlevel.append('\n');
	result.highlevel.append('(', result.reflow.length, ') forced style recalc and forced layouts found.');
	//this node extension may have Thread safety problem, so the time data(sum of events' time) may be wrong
	result.bigrig = bigrig.analyze(JSON.stringify(result.rawEvents , null, 2));
	// module.exports.result = result;
	emitter.emit('finish_parse');
}

var writeback = (result) => {
	//check
	checkDir(tracedir);
	//write trace file
	fs.writeFileSync(tracedir+tracefile, JSON.stringify(result.rawEvents , null, 2));
    console.log('Trace file: ' + tracedir+tracefile);
    console.log('You can open the trace file in DevTools Timeline panel. (Turn on experiment: Timeline tracing based JS profiler)\n');
    //write reflow file
	fs.writeFileSync(tracedir+reflowfile, JSON.stringify(result.reflow , null, 2));
	console.log('(', result.reflow.length, ') forced style recalc and forced layouts found.')
    console.log('Found events written to file: ' + tracedir+reflowfile);
    //write report file
	fs.writeFileSync(tracedir+reportfile,result.highlevel.str+JSON.stringify(result.bigrig , null, 2));
    console.log('Report file: ' + tracedir+reportfile);
}

init();
emitter.on('running',() => {
	start();
});
emitter.on('finish_test',()=>{
	runner.close();
	parse();
})
emitter.on('finish_parse',()=>{
	writeback(result);
	emitter.emit('exit');
})
emitter.on('exit',()=>{
})
// process.nextTick(
// 	()=>tester.run("http://baidu.com")
// );

