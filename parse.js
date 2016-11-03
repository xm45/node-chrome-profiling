const fs = require('fs');
const events = require("events");
const emitter = new events.EventEmitter();

const yargs = require("yargs");
const parser = require("./modules/parser");

var tracefile = 'trace-raw';
var reportfile = "report";

var tracedir = "trace_file/"+Date.now()+"/";
var filename = "trace-raw.json";
var needRaw = true;
var highLevel = false;
var suffix = "";
var filter = 0;

var argv = yargs.argv;
if(argv.filename){
	filename = argv.filename;
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
if(argv.filter){
	filter = argv.filter;
}
if(argv.h){
	console.log("--filename [string]\t\tset trace filename (default: trace-raw.json)");
	console.log("--name [string]\t\tset tracedir name. (unix timestamp default)");
	console.log("--suffix [string]\tset suffix of trace file and report file.");
	console.log("--highlevel\t\tdont't write any detail, only high level data");
	console.log("--noraw\t\t\tdon't write the raw trace data to report");
	console.log("--filter [1,2,3]\tonly record the events before landmark");
	console.log("\t\t\t1: firstPaint");
	console.log("\t\t\t2: domContentLoaded");
	console.log("\t\t\t3: load");
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

var start = () => {
	if(suffix){
		tracefile += "-"+suffix;
		reportfile += "-"+suffix;
	}
	rawEvents = JSON.parse(fs.readFileSync(filename));
	tracefile += ".json";
	reportfile += ".json";
	checkDir("trace_file/");
	writeback(parse());
}

var parse = () => {
	var result = {};
	console.log("Wait for parse\n");
	result.rawEvents = rawEvents;
	parser.set(result.rawEvents);
	result.report = parser.parse(needRaw,highLevel,filter);
	return result;
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

start();

module.exports.start = start;