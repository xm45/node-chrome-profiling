// var _ = require('undersorce');
var fs = require('fs');
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

module.exports.set = set;
module.exports.getReflow = getReflow;
module.exports.highlevel = highlevel;

// var rawData = require("./test-large.json");
// module.exports.set(rawData);
// writeHighLevel("test-large.txt");
