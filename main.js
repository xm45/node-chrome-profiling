const fs = require('fs');
const events = require("events");
const emitter = new events.EventEmitter();

// var bigrig = require('./libs/bigrig');

const yargs = require("yargs");
const runner = require("./browsers/chrome");
const tester = require("./modules/tester");
const parser = require("./modules/parser");
const StringBuffer = require("./modules/lib").StringBuffer;

var tracefile = 'trace-raw';
var reportfile = "report";

var tracedir = "trace_file/"+Date.now()+"/";
var url = "http://www.baidu.com";
var needRaw = true;
var highLevel = false;
var suffix = "";

var argv = yargs.argv;
if(argv.url){
	url = argv.url;
}
if(argv.name){
	tracedir = "trace_file/"+argv.name+"/"
}
if(argv.noraw){
	needRaw = false;
}
if(argv.highlevel){
	highLevel = true;
}
if(argv.suffix){
	suffix = argv.suffix;
}
if(argv.h){
	console.log("--url [domain]\t\tset test url. (notice: need http:// or https://)");
	console.log("--name [string]\t\tset tracedir name. (unix timestamp default)");
	console.log("--suffix [string]\tset suffix of trace file and report file.");
	console.log("--highlevel\t\tdont't write any detail, only high level data");
	console.log("--noraw\t\t\tdon't write the raw trace data to report");
	process.exit();
}

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
	if(suffix){
		tracefile += "-"+suffix;
		reportfile += "-"+suffix;
	}
	tracefile += ".json";
	reportfile += ".json";
	checkDir(runner.tmpdir);
	checkDir("trace_file/");
	runner(emitter);
	tester(emitter);
	runner.run();
}

var start = () => {
	tester.trace(url);
}

var parse = () => {
	console.log("Wait for parse\n");
	result.rawEvents = tester.rawEvents;
	parser.set(result.rawEvents);
	result.report = parser.parse(url,needRaw,highLevel);
	emitter.emit('finish_parse');
}

var writeback = (result) => {
	console.log("Write back to file:\n");
	//check
	checkDir(tracedir);
	//write trace file
	fs.writeFileSync(tracedir+tracefile, JSON.stringify(result.rawEvents , null, 2));
    console.log('Trace file: ' + tracedir+tracefile);
    console.log('You can open the trace file in Chrome DevTools Timeline panel.\n');
    //write report file
	fs.writeFileSync(tracedir+reportfile,JSON.stringify(result.report , null, 2));
    console.log('Report file: ' + tracedir+reportfile);
    console.log('Report show the important events that affect performance.\n');
}

init();
emitter.on('running',() => {
	start();
	console.log("Running Chrome\n");
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
	process.exit();
})
