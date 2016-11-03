// var _ = require('undersorce');
var fs = require('fs');
var _ = require('lodash');
var TraceToTimelineModel = require('devtools-timeline-model');
const StringBuffer = require("./lib").StringBuffer;
module.exports = dir => {
	module.dir = dir;
};
var set = rawEvents => {
	module.rawEvents = rawEvents;
}
var addToResult = function(target, data){
	target.count++;
	target.time += data.time/1000;
	if(target.size){
		target.size += data.size;
	}
	target.data.push(data);
}
const counterTag = ['documents','jsEventListeners','jsHeapSizeUsed','nodes'];
var addCounter = function(target, data){
	_.forEach(counterTag,function(tag){
		target.last[tag] = data[tag];
		target.max[tag] = data[tag] > target.max[tag] ? data[tag]: target.max[tag];
	});
	target.raw.push(data);
}
var parse = function(url, needRaw, highLevel, filter){
	if(arguments[1] === undefined) needRaw = true;
	if(arguments[2] === undefined) highLevel = false;
	if(arguments[3] === undefined) filter = 0;
	var result = {
		url:url,
		filter:filter,
		time:{
			startTime:0,
			endTime:0,
			duration:0,
		},
		counter:{
			drawFrame: 0,
			last:{
				documents: 0,
		        jsEventListeners: 0,
		        jsHeapSizeUsed: 0,
		        nodes: 0,
			},
	        max:{
	        	documents: 0,
		        jsEventListeners: 0,
		        jsHeapSizeUsed: 0,
		        nodes: 0,
	        },
			raw:[],
		},
		landmark:{
			firstPaint:0,
			loadTime:0,
			domContentLoaded:0,
		},
		running:{
			ParseHTML: {count:0, time:0, data:[]},
			ParseCSS: {count:0, time:0, data:[]},
			EvaluateScript: {count:0, time:0, data:[]},
			EventDispatch: {count:0, time:0, data:[]},
			FunctionCall: {count:0, time:0, data:[]},
			CompileJS: {count:0, time:0, data:[]},
			MinorGC: {count:0, time:0, data:[]},
			MajorGC: {count:0, time:0, data:[]},
			TimerInstall: {count:0, time:0, data:[]},
			TimerFire: {count:0, time:0, data:[]},
			TimerRemove: {count:0, time:0, data:[]},
			XHRLoad: {count:0, time:0, data:[]},
			XHRReadyStateChange: {count:0, time:0, data:[]},
		},
		render:{
			CompositeLayers: {count:0, time:0, data:[]},
			Paint: {count:0, time:0, data:[]},
			Layout: {count:0, time:0, data:[]},
			UpdateLayoutTree: {count:0, time:0, data:[]},
			Reflow: {count:0, time:0, data:[]},
			GPUTask: {count:0, time:0, data:[]},
			RasterTask: {count:0, time:0, data:[]},
		},
		request:{
			html: {count:0, time:0, size:0, data:[]},
			js: {count:0, time:0, size:0, data:[]},
			css: {count:0, time:0, size:0, data:[]},
			img: {count:0, time:0, size:0, data:[]},
			flash: {count:0, time:0, size:0, data:[]},
		}
	};
	var requestList = [];
	var eventList = [];
	var stack = {
		Layout : [],
		UpdateLayoutTree : [],
		CompositeLayers : [],
		ParseHTML : [],
		FunctionCall : [],
		MajorGC : [],
		MinorGC : [],
		RasterTask : [],
	};
    _.forEach(module.rawEvents,(e)=>{
    	//landmark
    	if(e.ts){
    		if(result.time.startTime == 0 || e.ts < result.time.startTime){
    			result.time.startTime = e.ts;
    		}
		    if(e.ts > result.time.endTime){
	    		result.time.endTime = e.ts;
		    }
	    	if(result.landmark.firstPaint == 0 && e.name == 'DrawFrame'){
	    		result.landmark.firstPaint = e.ts;
	    	}
	    	if(e.name == 'DrawFrame'){
	    		result.counter.drawFrame ++;
	    	}
	    	if(e.name == 'MarkFirstPaint'){
	    		result.landmark.firstPaint = e.ts;
	    	}
	    	if(e.name == 'MarkDOMContent'){
	    		result.landmark.domContentLoaded = e.ts;
	    	}
	    	if(e.name == 'MarkLoad'){
	    		result.landmark.loadTime = e.ts;
	    	}
    	}
	});
    _.forEach(module.rawEvents,(e)=>{
    	if(!e.args){
    		return;
    	}
    	if(filter == 1 && e.ts > result.landmark.firstPaint){
    		return;
    	}
    	if(filter == 2 && e.ts > result.landmark.domContentLoaded){
    		return;
    	}
    	if(filter == 3 && e.ts > result.landmark.loadTime){
    		return;
    	}
    	//Request
    	if(e.name == 'ResourceSendRequest' || e.name == 'ResourceReceiveResponse' || e.name == "ResourceReceivedData" || e.name == 'ResourceFinish') {
    		if(!e.args.data){
    			return;
    		}
    		var to = "";
    		if(e.name == 'ResourceSendRequest'){
	    		var data = {};
	    		data.url = e.args.data.url;
	    		data.method = e.args.data.requestMethod;
	    		data.id = e.args.data.requestId;
	    		data.priority = e.args.data.priority;
	    		data.stackTrace = e.args.data.stackTrace;
	    		data.startTime = e.ts;
	    		data.size = 0;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(e);
	    		requestList.push(data);
    		}
    		if(e.name == 'ResourceReceiveResponse'){
    			switch(e.args.data.mimeType) {
	    			case "text/html":
	    				to = "html";
	    				break;
	    			case "text/css":
	    				to = "css";
	    				break;
			        case "application/javascript":
			        	to = "js";
	    				break;
			        case "application/x-shockwave-flash":
			        	to = "flash";
	    				break;
			        case "image/png":
			        case "image/svg+xml":
			        case "image/gif":
			        	to = "img";
	    				break;
	    			default:
	    				break;
	    		}
	    		if(to == ""){
	    			return;
	    		}
	    		_.forEach(requestList,(data)=>{
	    			if(data.id == e.args.data.requestId){
	    				data.type = to;
    					data.time = e.ts - data.startTime;
	    				data.mimeType = e.args.data.mimeType;
	    				needRaw && data.raw.push(e);
	    			}
	    		});
    		}
    		if(e.name == 'ResourceReceivedData'){
    			_.forEach(requestList,(data)=>{
	    			if(data.id == e.args.data.requestId){
    					data.size += e.args.data.encodedDataLength;
	    				needRaw && data.raw.push(e);
	    			}
	    		});
    		}
    		if(e.name == 'ResourceChangePriority'){
    			_.forEach(requestList,(data)=>{
	    			if(data.id == e.args.data.requestId){
	    				data.priority = e.args.data.priority;
	    				needRaw && data.raw.push(e);
	    			}
	    		});
    		}
    		if(e.name == "ResourceFinish") {
    			_.forEach(requestList,(data)=>{
	    			if(data.id == e.args.data.requestId){
    					data.networkTime = e.args.data.networkTime;
    					data.time = e.ts - data.startTime;
    					data.didFail = e.args.data.didFail;
	    				needRaw && data.raw.push(e);
	    			}
	    		});
    		}
    	}
    	//render
    	if(e.name == 'Paint'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.detail = e.args.data;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.render.Paint,data);
    	}
    	if(e.name == 'CompositeLayers') {
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
    			data.layerTreeId = b.args.layerTreeId;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.render.CompositeLayers,data);
    		}
    	}
    	if(e.name == 'UpdateLayoutTree') {
    		if(!e.args){
    			return;
    		}
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
	    		if(b.args.beginData){
	    			data.stackTrace = b.args.beginData.stackTrace;
	    		}
	    		data.elementCount = e.args.elementCount;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.render.UpdateLayoutTree,data);
	    		if(b.args.beginData && b.args.beginData.stackTrace && b.args.beginData.stackTrace.length){
    				addToResult(result.render.Reflow,data);
	    		}
    		}
    	}
    	if(e.name == 'Layout'){
			if(!e.args){
    			return;
			}
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
	    		if(b.args.beginData) {
		    		data.dirtyObjects = b.args.beginData.dirtyObjects;
	    			data.totalObjects = b.args.beginData.totalObjects;
	    			data.partialLayout = b.args.beginData.partialLayout;
	    			data.stackTrace = b.args.beginData.stackTrace;
	    		}
	    		if(e.args.endData) {
	    			data.root = e.args.endData.root;
	    			data.rootNode = e.args.endData.rootNode;
	    		}
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.render.Layout,data);
	    		if(b.args.beginData && b.args.beginData.stackTrace && b.args.beginData.stackTrace.length){
    				addToResult(result.render.Reflow,data);
	    		}
    		}
    	}
    	//running
    	if(e.name == 'ParseHTML') {
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
    			data.url = b.url;
	    		data.startTime = b.ts;
    			data.startLine = b.args.startLine;
    			if(b.args.beginData) {
	    			data.stackTrace = b.args.beginData.stackTrace;
	    		}
	    		data.time = e.ts - b.ts;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.running.ParseHTML,data);
    		}
    	}
    	if(e.name == 'FunctionCall') {
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
    			data.functionName = b.args.data.functionName;
    			data.scriptId = b.args.data.scriptId;
    			data.scriptLine = b.args.data.scriptLine;
				data.scriptName = b.args.data.scriptName;
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.running.FunctionCall,data);
    		}
    	}
    	if(e.name == 'EvaluateScript'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.stackTrace = e.args.data;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.EvaluateScript,data);
    	}
    	if(e.name == 'EventDispatch'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.type = e.args.data.type;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.EventDispatch,data);
    	}
    	if(e.name == 'v8.compile'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.detail = e.args.data;
    		data.fileName = e.args.fileName;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.CompileJS,data);
    	}
    	if(e.name == 'MajorGC') {
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
    			data.usedHeapSizeBefore = b.args.usedHeapSizeBefore;
    			data.usedHeapSizeAfter = e.args.usedHeapSizeAfter;
    			data.type = b.args.type;
    			data.free = data.usedHeapSizeBefore - data.usedHeapSizeAfter;
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			// addToResult(result.running.Script,data);
    			addToResult(result.running.MajorGC,data);
    		}
    	}
    	if(e.name == 'MinorGC') {
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
    			data.usedHeapSizeBefore = b.args.usedHeapSizeBefore;
    			data.usedHeapSizeAfter = e.args.usedHeapSizeAfter;
    			data.free = data.usedHeapSizeBefore - data.usedHeapSizeAfter;
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			// addToResult(result.running.Script,data);
    			addToResult(result.running.MinorGC,data);
    		}
    	}
    	if(e.name == 'ParseAuthorStyleSheet'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.url = e.args.data.styleSheetUrl;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.ParseCSS,data);
    	}
    	if(e.name == 'RasterTask') {
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
    			data.detail = b.args.tileData;
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
	    		if(needRaw){
	    			data.raw = [];
	    		}
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.render.RasterTask,data);
    		}
    	}
    	if(e.name == 'TimerInstall'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = 0;
    		data.timerId = e.args.data.timerId;
    		data.timeout = e.args.data.timeout;
    		data.detail = e.args.data;
    		data.stackTrace = e.args.data.stackTrace;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.TimerInstall,data);
    	}
    	if(e.name == 'TimerRemove'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = 0;
    		data.timerId = e.args.data.timerId;
    		data.detail = e.args.data;
    		data.stackTrace = e.args.data.stackTrace;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.TimerRemove,data);
    	}
    	if(e.name == 'TimerFire'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.timerId = e.args.data.timerId;
    		data.detail = e.args.data;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.TimerFire,data);
    	}
    	if(e.name == 'GPUTask'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.pid = e.args.data.renderer_pid;
    		data.used_bytes = e.args.data.used_bytes;
    		data.detail = e.args.data;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.render.GPUTask,data);
    	}
    	//XHR
    	if(e.name == 'XHRLoad'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.url = e.args.data.url;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.XHRLoad,data);
    	}
    	if(e.name == 'XHRReadyStateChange'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.url = e.args.data.url;
    		data.stackTrace = e.args.data.stackTrace;
    		data.readyState = e.args.data.readyState;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addToResult(result.running.XHRReadyStateChange,data);
    	}
    	//counter
    	if(e.name == 'UpdateCounters'){
    		var data = {};
    		data.startTime = e.ts;
    		data.documents = e.args.data.documents;
	        data.jsEventListeners = e.args.data.jsEventListeners;
	        data.jsHeapSizeUsed = e.args.data.jsHeapSizeUsed;
	        data.nodes = e.args.data.nodes;
    		if(needRaw){
    			data.raw = [];
    		}
    		needRaw && data.raw.push(e);
    		addCounter(result.counter,data);
    	}
    	//you can add rules here
    });
    _.forEach(requestList,(data) => {
    	if(data.didFail){
    		return;
    	}
    	var type = data.type;
    	if(!result.request[type]){
    		return;
    	}
    	result.request[type].count++;
    	result.request[type].time += data.time/1000;
    	result.request[type].size += data.size;
    	result.request[type].data.push(data);
    });
    _.forEach(result.landmark,(v,k) => {result.landmark[k] = (v - result.time.startTime)/1000;});
    result.time.duration = (result.time.endTime - result.time.startTime)/1000;
    //highLevel
    if(highLevel){
		_.forEach(result.running, function(tag){
			delete tag.data;
		});
		_.forEach(result.render,function(tag){
			delete tag.data;
		});
		_.forEach(result.request,function(tag){
			delete tag.data;
		});
		delete result.counter.data;
    }
    //write back
	// fs.writeFileSync("../output2.json", JSON.stringify(result , null, 2));
	return result;
}
// module.rawEvents = require("../../test.json");
// parse("baidu.com",false,true);
// parse("baidu.com");
module.exports.set = set;
module.exports.parse = parse;