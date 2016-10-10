const fs = require('fs');
const runner = require("./run_chrome");
const tester = require("./tester");
const dirs = [runner.tmpdir,tester.tracedir];

//check file
var checkDir = (args)=>{
	for(var x in args){
		if(!fs.existsSync(args[x])){
			fs.mkdirSync(args[x]);
		}
	}
}
checkDir(dirs);

process.on('exit',()=>{
	console.log();
	runner.close();
	tester.close();
	process.exit();
});

runner.run();
//setTimeout(()=>tester("www.baidu.com"),3000);