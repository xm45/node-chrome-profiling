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
	if(target.size)
		target.size += data.size;
	target.data.push(data);
}

var parse = function(url, needRaw){
	/*
	target aim
		first paint
		domContentLoaded
		loadTime

		forcedRecalcs count
		forcedLayouts count

		net request count/time
		html count/time
		js count/time
		css count/time

	 */
	if(arguments[1] === undefined) needRaw = true;
	var result = {
		url:url,
		time:{
			startTime:0,
			endTime:0,
			duration:0
		},
		landmark:{
			firstPaint:0,
			loadTime:0,
			domContentLoaded:0
		},
		render:{
			CompositeLayers: {count:0, time:0, data:[]},
			Paint: {count:0, time:0, data:[]},
			Layout: {count:0, time:0, data:[]},
			UpdateLayoutTree: {count:0, time:0, data:[]},
			Reflow: {count:0, time:0, data:[]},
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
		CompositeLayers : []
	};
	var reflow = false;
	var layout = false;
    _.forEach(module.rawEvents,(e)=>{
    	//landmark
    	if(e.ts){
    		if(result.time.startTime == 0 || e.ts < result.time.startTime)
    			result.time.startTime = e.ts;
		    if(e.ts > result.time.endTime)
	    		result.time.endTime = e.ts;
	    	if(result.landmark.firstPaint == 0 && e.name == 'DrawFrame')
	    		result.landmark.firstPaint = e.ts;
	    	if(e.name == 'MarkFirstPaint')
	    		result.landmark.firstPaint = e.ts;
	    	if(e.name == 'MarkDOMContent')
	    		result.landmark.domContentLoaded = e.ts;
	    	if(e.name == 'MarkLoad')
	    		result.landmark.loadTime = e.ts;
    	}
	});
    _.forEach(module.rawEvents,(e)=>{
    	if(!(e.args))
    		return;
    	//Request
    	if(e.name == 'ResourceSendRequest' || e.name == 'ResourceReceiveResponse' || e.name == "ResourceReceivedData" || e.name == 'ResourceFinish') {
    		if(!e.args.data)
    		var to = "";
    		if(e.name == 'ResourceSendRequest'){
	    		var data = {};
	    		data.url = e.args.data.url;
	    		data.method = e.args.data.requestMethod;
	    		data.id = e.args.data.requestId;
	    		data.priority = e.args.data.priority;
	    		data.startTime = e.ts;
	    		data.size = 0;
	    		data.stackTrace = e.args.data.stackTrace;
	    		data.raw = [];
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
	    		})
    		}
    		if(e.name == 'ResourceReceivedData'){
    			_.forEach(requestList,(data)=>{
	    			if(data.id == e.args.data.requestId){
    					data.size += e.args.data.encodedDataLength;
	    				needRaw && data.raw.push(e);
	    			}
	    		})
    		}
    		if(e.name == 'ResourceChangePriority'){
    			_.forEach(requestList,(data)=>{
	    			if(data.id == e.args.data.requestId){
	    				data.priority = e.args.data.priority;
	    				needRaw && data.raw.push(e);
	    			}
	    		})
    		}
    		if(e.name == "ResourceFinish") {
    			_.forEach(requestList,(data)=>{
	    			if(data.id == e.args.data.requestId){
    					data.networkTime = e.args.data.networkTime;
    					data.time = e.ts - data.startTime;
    					data.didFail = e.args.data.didFail;
	    				needRaw && data.raw.push(e);
	    			}
	    		})
    		}
    	}
    	if(e.name == 'Paint'){
    		var data = {};
    		data.startTime = e.ts;
    		data.time = e.dur;
    		data.detail = e.args.data;
    		data.raw = [];
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
	    		data.raw = [];
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.render.CompositeLayers,data);
    		}
    	}
    	if(e.name == 'UpdateLayoutTree') {
    		if(!e.args)
    			return
    		if(e.ph == "B"){
    			stack[e.name].push(e);
    		}
    		if(e.ph == "E"){
    			var b = stack[e.name].pop();
    			var data = {};
	    		data.startTime = b.ts;
	    		data.time = e.ts - b.ts;
	    		if(b.args.beginData)
	    			data.stackTrace = b.args.beginData.stackTrace;
	    		data.elementCount = e.args.elementCount;
	    		data.raw = [];
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.render.UpdateLayoutTree,data);
	    		if(b.args.beginData && b.args.beginData.stackTrace && b.args.beginData.stackTrace.length){
    				addToResult(result.render.Reflow,data);
	    		}
    		}
    	}
    	if(e.name == 'Layout'){
			if(!e.args)
    			return
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
	    		data.raw = [];
	    		needRaw && data.raw.push(b);
	    		needRaw && data.raw.push(e);
    			addToResult(result.render.Layout,data);
	    		if(b.args.beginData && b.args.beginData.stackTrace && b.args.beginData.stackTrace.length){
    				addToResult(result.render.Reflow,data);
	    		}
    		}
    	}
    	//you can add rules here
    });
    _.forEach(requestList,(data) => {
    	if(data.didFail)
    		return;
    	var type = data.type;
    	if(!result.request[type])
    		return
    	result.request[type].count++;
    	result.request[type].time += data.time/1000;
    	result.request[type].size += data.size;
    	result.request[type].data.push(data);
    })
    _.forEach(result.landmark,(v,k) => {result.landmark[k] = (v - result.time.startTime)/1000;});
    result.time.duration = (result.time.endTime - result.time.startTime)/1000;
    //write back
	// fs.writeFileSync("../output2.json", JSON.stringify(result , null, 2));
	return result;
}
// module.rawEvents = require("../../test.json")
// parse("baidu.com",false);
module.exports.set = set;
module.exports.parse = parse;
