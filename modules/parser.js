// var _ = require('undersorce');
var fs = require('fs');
// var _ = require('undersorce');
var TraceToTimelineModel = require('devtools-timeline-model');
const StringBuffer = require("./lib").StringBuffer;

module.exports = dir => {
	module.dir = dir;
};

var set = rawEvents => {
	module.rawEvents = rawEvents;
}

var getReflow = () => {
	var forcedReflowEvents = module.rawEvents
        .filter( e => e.name == 'UpdateLayoutTree' || e.name == 'Layout')
        .filter( e => e.args && e.args.beginData && e.args.beginData.stackTrace && e.args.beginData.stackTrace.length)
    return forcedReflowEvents;
}

function dumpScreenshot(filmStripModel, arr) {
  var frames = filmStripModel.frames();
  var framesLen = frames.length;
  if (framesLen >= 1) {
    frames[framesLen - 1].imageDataPromise()
      .then(data => Promise.resolve('data:image/jpg;base64,' + data))
      .then(img => {
        arr.push('Filmstrip model last screenshot:\n', img.substr(0, 50) + '...');
      });
  }
}

//using devtools-timeline-model
var highlevel = (domain) => {
	//from devtool-timeline-model
	var data = new StringBuffer('');

	var model = new TraceToTimelineModel(module.rawEvents);

	data.append(domain,'\n');

	data.append('Timeline model events:\n', model.timelineModel().mainThreadEvents().length);
	data.append('IR model interactions\n', model.interactionModel().interactionRecords().length);
	data.append('Frame model frames:\n', model.frameModel().frames().length);
	data.append('Filmstrip model screenshots:\n', model.filmStripModel().frames().length);
	dumpScreenshot(model.filmStripModel());

	data.append('Top down tree total time:\n', model.topDown().totalTime);
	data.append('Bottom up tree leaves:\n', [...model.bottomUp().children.entries()].length);
	// data.append('Top down tree, grouped by URL:\n', model.topDownGroupedUnsorted)
	var topCosts = [...model.bottomUpGroupBy('URL').children.values()];
	var secondTopCost = topCosts[1];
	data.append('Bottom up tree, grouped, 2nd top URL:\n', secondTopCost.totalTime.toFixed(2), secondTopCost.id);

	var topCostsByDomain = [...model.bottomUpGroupBy('Subdomain').children.values()];
	var thirdTopDomainCost = topCostsByDomain[2];
	data.append('Bottom up tree, grouped, 3rd top subdomain:\n', thirdTopDomainCost.totalTime.toFixed(2), thirdTopDomainCost.id);
	var bottomUpByName = model.bottomUpGroupBy('EventName');
	var result = new Map();
	bottomUpByName.children.forEach(function(value, key) {
		result.set(key, value.selfTime);
	});
	data.append('Bottom up tree grouped by EventName:');
	// data.append('Map {');
	for(var item of result) {
		// console.log('\t',item[0],item[1]);
		data.append('\t',item[0],"=>",item[1]);
	}
	// data.append('}');
	//console.log(result);
	return data;
}
var parse = (url) => {
	/*
	target aim
		first paint
		domContentLoaded
		loadTime

		forcedRecalcs count
		forcedLayouts count

		net request count/size
		html count/size
		js count/size
		css count/size

	 */
	var result = {
		url:url,
		startTime:0,
		endTime:0,
		duration:0,
		landmark:{
			firstPaint:0,
			loadTime:0,
			domContentLoaded:0
		},
		run:{
			parseHTMLs: {count:0, time:0, data:[]},
			script:{
				EvaluateScript: {count:0, time:0, data:[]},
				GCEvent: {count:0, time:0, data:[]},
				FunctionCall: {count:0, time:0, data:[]},
				EventDispatch: {count:0, time:0, data:[]},
			}
			animation:{
				AnimationFrameFired: {count:0, time:0, data:[]},
				CancelAnimationFrame: {count:0, time:0, data:[]},
				RequestAnimationFrame: {count:0, time:0, data:[]},
			}
			timer:{
				TimerInstall: {count:0, time:0, data:[]},
				TimerFire: {count:0, time:0, data:[]},
				TimerRemove: {count:0, time:0, data:[]},
			}
			ajax:{
				XHRLoad: {count:0, time:0, data:[]},
				XHRReadyStateChange: {count:0, time:0, data:[]},
			}
		}
		render:{
			CompositeLayers: {count:0, time:0, data:[]},
			DecodeImage: {count:0, time:0, data:[]},
			ResizeImage: {count:0, time:0, data:[]},
			Paint: {count:0, time:0, data:[]},
			Layout: {count:0, time:0, data:[]},
			ScrollLayer: {count:0, time:0, data:[]},
			reflow:{
				forcedRecalcs: {count:0, time:0, data:[]},
				forcedLayouts: {count:0, time:0, data:[]},
			},
		}
		request:{
			html: {count:0, time:0, size:0, data:[]},
			js: {count:0, time:0, size:0, data:[]},
			css: {count:0, time:0, size:0, data:[]},
			img: {count:0, time:0, size:0, data:[]},
			flash: {count:0, time:0, size:0, data:[]},
		}
	};
	var datas = [];
	var forcedReflowEvents = module.rawEvents
        .filter( e => e.name == 'UpdateLayoutTree' || e.name == 'Layout')
        .filter( e => e.args && e.args.beginData && e.args.beginData.stackTrace && e.args.beginData.stackTrace.length)
    return forcedReflowEvents;
    _.forEach(module.rawEvents,(e)=>{
    	if(e => e.name == 'UpdateLayoutTree' || e.name == 'Layout') {

    	}
    	if(e => e.name == 'ResourceSendRequest' || e.name == 'ResourceReceiveResponse' || e.name == "ResourceReceivedData" || e.name == 'ResourceFinish') {
    		var to = ""
    		if(e.name == 'ResourceSendRequest'){
	    		switch(e.mimeType) {
	    			case "text/html":
	    				to = "html";
	    				break;
	    			case "text/css":
	    				to = "html";
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
			        	to = "html";
	    				break;
	    			default:
	    				break;
	    		}
	    		if(to !== ""){

	    		}
    		}
    	}
    })
	/*
	ResourceSendRequest
	ResourceReceiveResponse

        "mimeType": "text/html",
        "mimeType": "text/css",
        "mimeType": "application/javascript",
        "mimeType": "application/x-shockwave-flash",
        "mimeType": "image/png",
        "mimeType": "image/svg+xml",
        "mimeType": "image/gif",
        other
    ResourceReceivedData
    	encodedDataLength
	ResourceFinish
		networkTime us = 1/1000ms

	data
	{
		url :url
		size :encodedDataLength
		type :mimeType
		time :networkTime
		from :stackTrace
		requestId:requestId;
		rawData:[];
	}

	render
		Paint
		CompositeLayers
	 */
	// _.foreach(module.rawEvents);
}
module.exports.set = set;
module.exports.getReflow = getReflow;
module.exports.highlevel = highlevel;

// var rawData = require("./test-large.json");
// module.exports.set(rawData);
// writeHighLevel("test-large.txt");
