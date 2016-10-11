var path = require('path');
var spawn = require('child_process').spawn;

const now = path.resolve(__dirname,'.');
const tmpdir = now + "/tmp";
const command = "google-chrome";
const args = ["--remote-debugging-port=9222","--user-data-dir="+tmpdir+"/chrome-profiling","--no-default-browser-check","--no-first-run"]
//console.log(command,'\n',args);

var chrome = null;

module.exports = emitter => {
    module.emitter = emitter;
}

var run = ()=>{
	chrome = spawn(command,args);
	chrome.on('exit', function (code) {
	    console.log('Chrome已关闭，代码：' + code);
	});
	chrome.on('connection', function (code) {
	    console.log('test:' + code);
	});
	setTimeout(()=>
		module.emitter.emit('running'),2000);
}

var close = ()=>{
	// console.log(chrome);
	if(chrome)
		chrome.kill();
}

module.exports.run = run;
module.exports.close = close;
module.exports.tmpdir = tmpdir;
