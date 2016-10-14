// var _ = require('undersorce');
var fs = require('fs');
var TraceToTimelineModel = require('devtools-timeline-model');

module.exports = dir => {
	module.dir = dir;
};

var set = rawEvents => {
	module.rawEvents = rawEvents;
}

var getReflow = () => {
	var forcedReflowEvents = rawEvents
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

function StringBuffer(str) {
	if(!arguments[0]) str = "";
	this.str = str;
}
StringBuffer.prototype.append = function(first){
	var len = arguments.length;
	if(!arguments[0]) first = "";
	this.str += first;
	for(var i = 1; i < len; i ++)
		this.str += ' ' + arguments[i].toString();
	this.str += '\n';
}

var writeHighLevel = (filename) => {
	//from devtool-timeline-model
	var data = new StringBuffer('');

	var model = new TraceToTimelineModel(module.rawEvents);

	data.append(filename,'\n');

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
	data.append('Bottom up tree grouped by EventName:\n');
	data.append('Map {');
	for(var item of result)
		console.log('\t',item[0].toString(),item[1]);
	data.append('Map }');
	//console.log(result);

	fs.writeFileSync(filename, data.str);
}

module.exports.set = set;
module.exports.getReflow = getReflow;

var rawData = require("./test.json");
module.exports.set(rawData);
writeHighLevel("test.txt");
