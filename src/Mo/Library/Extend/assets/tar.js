/*debug*/
/*
** tar package��Old-Style Archive Format
*/
var string2buffer = F.string.getByteArray, buffer2string = F.string.fromByteArray;

function zipfolder(zip,path){
	IO.directory.directories(path,function(f){
		zipfolder(zip.folder(f.name),f.path);
	});
	IO.directory.files(path,function(f){
		zip.file(f.name,f.path);
	});
}

function $manager(files, options){
	if(this.constructor!==$manager){
		return Function.Create(arguments.length).apply($manager, arguments);
	}
	this.options = options || {};
	if(typeof files == "string"){
		this.files = {};
		this.loader = {path : files, fp : -1, offset : 0};
		this.load(files);
	}else{
		this.files = files || {};
	}
}

$manager.helper = zipfolder;
$manager.prototype.folder = function(name){
	this.files[name] = {};
	return new $manager(this.files[name]);
};
$manager.prototype.file = function(name, path){
	this.files[name] = path;
	return this;
};
$manager.prototype.generate = function(path, output){
	var fp = IO.file.open(path, {forText : false});
	output = !!output;
	dogenerate(fp, "", this.files);
	var ending = [];
	for(var i=0;i<1024;i++) ending.push(0);
	IO.file.write(fp, IO.buffer2binary(ending));
	if(!output){
		IO.file.flush(fp);
		IO.file.close(fp);
		return true
	}else{
		IO.file.seek(fp, 0);
		var data = IO.binary2buffer(IO.file.read(fp));
		IO.file.close(fp);
		return data;
	}
};
$manager.prototype.load = function(files){
	var size = IO.file.get(files).size, offset = 0;
	if(size<1536) {
		ExceptionManager.put(0x2d2e,"Tar.load","invalid filetype.");
		return;
	}
	var fp = IO.file.open(files, {forRead : true, forText : false});
	this.loader.fp = fp;
	IO.file.seek(fp, size-1024);
	var ending = IO.binary2buffer(IO.file.read(fp)),filechecksum=0;
	for(var i=0;i<1024;i++){
		filechecksum += ending[i];
	}
	if(filechecksum>0){
		IO.file.close(fp);
		ExceptionManager.put(0x2d2e,"Tar.load","invalid filetype.");
		this.loader.fp=-1;
		return;
	}
	if(this.options.loadall!==false){
		while(this.read(function(header,file){
			IO.file.seek(file, header.offset);
			header.data = IO.file.read(file, header.filesize);
			this.files[header.name] = header;
		})){}
		this.close();
		this.loader.fp=-1;
	}
};
$manager.prototype.read = function(fn){
	if(this.loader.fp<0) return false;
	var fp = this.loader.fp;
	IO.file.seek(fp, this.loader.offset);
	var header = IO.binary2buffer(IO.file.read(fp,512));
	if(header.length<512){
		return false;
	}
	if(header[0]==0) return false;
	var checksum_new=0;
	this.loader.offset+=512;
	var filename = header.slice(0, 100);
	filename = buffer2string(filename);
	var linkflag = header[156];
	var headerobj = new tarHeader(filename, '', linkflag == 0x35);
	var size = parseOtc(header.slice(124, 136));
	headerobj.filesize = size;
	headerobj.offset = this.loader.offset;
	this.loader.offset+=size;
	if(size % 512 !=0) this.loader.offset += 512 - (size % 512);
	headerobj.createdate = parseOtc(header.slice(136, 148));
	var checksum = header.slice(148, 156);
	checksum.pop();
	headerobj.checksum = parseOtc(checksum);
	for(var i=0;i<8;i++){
		header[148+i] = 0x20;
	}
	for(var i=0;i<512;i++) checksum_new+=header[i];
	if(checksum_new != headerobj.checksum){
		ExceptionManager.put(0x2d2e,"Tar.read","checksum error.");
	}else{
		if(typeof fn == "function")fn.call(this, headerobj, fp);
	}
	return true;
};
$manager.prototype.close = function(){
	IO.file.close(this.loader.fp);
};
function dogenerate(fp, name, files){
	for(var i in files){
		if(!files.hasOwnProperty(i)) continue;
		var file = files[i];
		if(typeof file == "string"){
			var data = IO.file.readAllBytes(file),
				header = tarHeader(name + i, file, false);
			header.generate(IO.filesize);
			IO.file.write(fp, IO.buffer2binary(header.data));
			if(header.filesize>0){
				IO.file.write(fp, data);
			}
			var padding= header.filesize % 512;
			if(padding>0){
				var pad = [];
				for(var i=0;i<512-padding;i++) pad.push(0);
				IO.file.write(fp, IO.buffer2binary(pad));
			}
		}else{
			var header = tarHeader(name + i, "", true);
			header.generate(0);
			IO.file.write(fp, IO.buffer2binary(header.data));
			dogenerate(fp, name + i + "\\", file);
		}
	}
}
$manager.setNames = function(){
	if(typeof GBK != "undefined"){
		string2buffer = GBK.getByteArray;
		buffer2string = GBK.getString;
	}
};
$manager.packFolder = function(path, target){
	var zip = new $manager();
	try{
		zipfolder(zip,path);
		return zip.generate(target);
	}catch(ex){
		return false;
	}
}
$manager.packFile = function(file, target, option){
	option = F.extend({filename:null},option);
	var filename = option.filename || file.substr(file.lastIndexOf("\\")+1);
	var zip = new $manager();
	try{
		zip.file(filename,file);
		return zip.generate(target);
	}catch(ex){
		return false;
	}
}
$manager.unpack = function(srcfile,dest){
	var zip = new $manager(srcfile);
	var files = zip.files;
	for(var i in files){
		if(!files.hasOwnProperty(i)) continue;
		var file = files[i];
		if(file.dir){
			IO.directory.create(IO.build(dest,file.name));
		}else{
			var destfile = IO.build(dest,file.name),parentDir=IO.parent(destfile);
			if(!IO.directory.exists(parentDir))IO.directory.create(parentDir);
			if(file.filesize>0){
				IO.file.writeAllBytes(destfile,file.data);
			}else{
				IO.file.writeAllText(destfile,"","iso-8859-1");
			}
		}
	}
	return true;
};
var ArrayPush = Array.prototype.push;
var formatOtc = function(num, len){
	var numstr = num.toString(8)+" ", _len = numstr.length;
	len = len || 12;
	while(_len++ < len){
		numstr = " " + numstr;
	}
	return string2buffer(numstr);
};
var parseOtc = function(ary){
	ary.pop();
	var i=0;
	while(ary[i]==0x20){
		ary.shift();
	}
	return parseInt(buffer2string(ary),8);
};
function push(src , dest){
	var _len = src.length;
	for(var i=0 ;i<_len;i++){
		dest.checksum += src[i];
	}
	ArrayPush.apply(dest.data, src);
}
function set(src, start, dest){
	var _len = src.length;
	for(var i=0 ;i<_len;i++){
		dest.data[start+i] = src[i];
	}
}
var tarHeader = function(name, file, isdir) {
	if(this.constructor != tarHeader){
		return new tarHeader(name, file, isdir);
	}
	this.name = name;
	this.filesize = 0;
	this.file= file;
	this.dir = !!isdir;
	this.data = [];
	this.checksum=0;
	this.offset=0;
	this.createdate=0;
};
var total=0;
tarHeader.prototype.generate = function(filesize){
	var filename_byt = string2buffer(this.name);
	while(filename_byt.length>99) filename_byt.pop();
	while(filename_byt.length<100) filename_byt.push(0);
	push(filename_byt, this);
	if(this.dir){
		ArrayPush.apply(this.data, [0x20,0x34]);
		this.checksum += 84;
	}else{
		ArrayPush.apply(this.data, [0x31,0x30]);
		this.checksum += 97;
	}
	ArrayPush.apply(this.data, [0x30,0x37,0x37,0x37,0x20,0, /*mode*/ 0x20,0x20,0x20,0x20,0x20,0x30,0x20,0,0x20,0x20,0x20,0x20,0x20,0x30,0x20,0]); //uid,gid
	this.checksum += 725;
	
	var linkflag=0x35;
	if(!this.dir) {
		this.filesize = filesize;
		linkflag = 0x30;
	}
	push(formatOtc(filesize), this); //size
	push(formatOtc(F.timespan(new Date())), this); //mtime
	
	ArrayPush.apply(this.data, [0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20]); //checksum
	this.checksum += 256;
	
	this.data.push(linkflag);
	this.checksum += linkflag;
	
	for(var i=0;i<355;i++) this.data.push(0);
	set(formatOtc(this.checksum,7),148, this);
	this.data[155] = 0;
};
module.exports = $manager;
Tar = $manager;
Tar.getTotal = function(){return total;};