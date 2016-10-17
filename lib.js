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
module.exports.StringBuffer = StringBuffer