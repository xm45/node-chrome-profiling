var path = require('path');
var spawn = require('child_process').spawn;

var now = path.resolve(__dirname,'.');
var tmpdir = now + "/tmp";
var command = "google-chrome";
var args = ["--remote-debugging-port=9222","--user-data-dir="+tmpdir+"/chrome-profiling","--no-default-browser-check","--no-first-run"]
console.log(command,'\n',args);
module.chrome = null;
var chrome = null;

var run = ()=>{
	chrome = spawn(command,args);
	chrome.on('exit', function (code) {
	    console.log('子进程已关闭，代码：' + code);
	});
	chrome.on('connection', function (code) {
	    console.log('test:' + code);
	});
}

var close = ()=>{
	// console.log(chrome);
	if(chrome)
		chrome.kill();
}

exports.run = run;
exports.close = close;
exports.tmpdir = tmpdir;