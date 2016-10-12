const fs = require('fs');
const events = require("events");
const emitter = new events.EventEmitter();

const runner = require("./run_chrome");
const tester = require("./tester");
const dirs = [runner.tmpdir,tester.tracedir];
const filename = tester.tracedir+"/report.txt";

//check file
var checkDir = (args)=>{
	for(var x in args){
		if(!fs.existsSync(args[x])){
			fs.mkdirSync(args[x]);
		}
	}
}
checkDir(dirs);

runner(emitter);
tester(emitter);

var start = () => {
	return tester.trace("http://www.baidu.com");
}

emitter.on('running',(rawEvents) => {
	var rawEvents = start();
});
emitter.on('exit',()=>{
	runner.close();
})
emitter.on('finish_test',()=>{
	emitter.emit('exit');
})

runner.run();
// process.nextTick(
// 	()=>tester.run("http://baidu.com")
// );

