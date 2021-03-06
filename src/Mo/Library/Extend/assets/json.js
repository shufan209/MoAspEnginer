﻿module.exports =  (function() {
	function f(n) {
		return n < 10 ? "0" + n : n
	}
	function js(str) {
		if (str == undefined) {
			return ""
		}
		if (str == "") {
			return ""
		}
		var i, j, aL1, aL2, c, p, ret = "", _len = str.length;
		aL1 = Array(34, 92, 47, 8, 12, 10, 13, 9);
		aL2 = Array(34, 92, 47, 98, 102, 110, 114, 116);
		for (i = 0; i < _len; i++) {
			p = true;
			c = str.substr(i, 1);
			for (j = 0; j <= 7; j++) {
				if (c == String.fromCharCode(aL1[j])) {
					ret += "\\" + String.fromCharCode(aL2[j]);
					p = false;
					break
				}
			}
			if (p) {
				var a = c.charCodeAt(0);
				if (a > 31 && a < 127) {
					ret += c
				} else {
					if (a > -1 || a < 65535) {
						var slashu = a.toString(16);
						while (slashu.length < 4) {
							slashu = "0" + slashu
						}
						ret += "\\u" + slashu
					}
				}
			}
		}
		return ret
	}
	if (typeof Date.prototype.toJSON !== "function") {
		Date.prototype.toJSON = function(key) {
			return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null
		};
		String.prototype.toJSON = function(key) {
			return js(this.valueOf())
		};
		Number.prototype.toJSON = Boolean.prototype.toJSON = function(key) {
			return this.valueOf()
		}
	}
	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap, indent, meta = {
			"\b": "\\b",
			"\t": "\\t",
			"\n": "\\n",
			"\f": "\\f",
			"\r": "\\r",
			'"': '\\"',
			"\\": "\\\\"
		},
		rep;

	function quote(string) {
		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
			var c = meta[a];
			return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
		}) + '"' : '"' + ($json.encode ? js(string) : string) + '"'
	}
	function str(key, holder) {
		var i, k, v, length, mind = gap,
			partial, value = holder[key];
		if (value && typeof value === "object" && typeof value.toJSON === "function") {
			value = value.toJSON(key)
		}
		if (typeof rep === "function") {
			value = rep.call(holder, key, value)
		}
		switch (typeof value) {
		case "string":
			return quote(value);
		case "number":
			return isFinite(value) ? String(value) : "null";
		case "boolean":
		case "null":
			return String(value);
		case "object":
			if (!value) {
				return "null"
			}
			gap += indent;
			partial = [];
			if (Object.prototype.toString.apply(value) === "[object Array]") {
				length = value.length;
				for (i = 0; i < length; i += 1) {
					partial[i] = str(i, value) || "null"
				}
				v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
				gap = mind;
				return v
			}
			if (rep && typeof rep === "object") {
				length = rep.length;
				for (i = 0; i < length; i += 1) {
					k = rep[i];
					if (typeof k === "string") {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + (gap ? ": " : ":") + v)
						}
					}
				}
			} else {
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + (gap ? ": " : ":") + v)
						}
					}
				}
			}
			v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
			gap = mind;
			return v
		}
	}
	function json2xml(src, name){
		var xml="";
		if (src && typeof src === "object" && typeof src.toJSON === "function") {
			src = src.toJSON();
		}
		switch (typeof src) {
		case "string":
			xml += "<" + name + "><![CDATA[" + src + "]]></" + name + ">";
			break;
		case "number":
			xml += "<" + name + ">" + (isFinite(src) ? String(src) : "null") + "</" + name + ">";
			break;
		case "boolean":
		case "null":
			xml += "<" + name + ">" + String(src) + "</" + name + ">";
			break;
		case "object":
			if (!src) {
				xml+="<" + name + ">null</" + name + ">";
			}
			else if (Object.prototype.toString.apply(src) === "[object Array]") {
				xml+="<" + name + " data-type=\"list\">";
				var _len = src.length;
				for(var i=0;i<_len;i++){
					xml+=json2xml(src[i],"list");
				}
				xml+="</" + name + ">";
			}else{
				xml+="<" + name + ">";
				for(var i in src){
					if(!src.hasOwnProperty(i))continue;
					xml+=json2xml(src[i],i);
				}
				xml+="</" + name + ">";
			}
		}
		return xml;
	};
	var $json = {};
	$json.result = null;
	$json.strict = true;
	$json.encode = true;
	$json.decodeStrict = function(value){$json.strict =!!value;};
	$json.encodeUnicode = function(value){$json.encode =!!value;};
	$json.stringify = function(value, replacer, space) {
		var i;
		gap = "";
		indent = "";
		if (typeof space === "number") {
			for (i = 0; i < space; i += 1) {
				indent += " "
			}
		} else {
			if (typeof space === "string") {
				indent = space
			}
		}
		rep = replacer;
		if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
			throw new Error("JSON.stringify")
		}
		return str("", {
			"": value
		})
	};
	$json.tryParse = function(text, reviver, obj) {
		try {
			$json.result = $json.parse(text, reviver);
			if (arguments.length == 2 && !(typeof reviver === "function")) {
				reviver = $json.result
			}
			if (arguments.length == 3) {
				obj = $json.result
			}
			return true
		} catch (ex) {
			return false
		}
	};
	$json.parse = function(text, reviver) {
		var j;

		function walk(holder, key) {
			var k, v, value = holder[key];
			if (value && typeof value === "object") {
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = walk(value, k);
						if (v !== undefined) {
							value[k] = v
						} else {
							delete value[k]
						}
					}
				}
			}
			return reviver.call(holder, key, value)
		}
		cx.lastIndex = 0;
		if (cx.test(text)) {
			text = text.replace(cx, function(a) {
				return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
			})
		}
		if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, "")) || !$json.strict) {
			try {
				j = eval("(" + text + ")");
				return typeof reviver === "function" ? walk({
					"": j
				}, "") : j
			} catch (ex) {
				throw new SyntaxError("JSON.parse")
			}
		}
		throw new SyntaxError("JSON.parse")
	};
	$json.ARRAY=1;
	$json.OBJECT=2;
	$json.create = function(jsonType){
		if($json.class_) return new $json.class_(jsonType);
		$json.class_ = function(_jsonType){
			if(typeof _jsonType=="object" && _jsonType.constructor==Array)
			{
				this.jsonType = $json.ARRAY;
				this.data = _jsonType;
			}
			else if(typeof _jsonType=="object" && _jsonType.constructor==Object)
			{
				this.jsonType = $json.OBJECT;
				this.data = _jsonType;
			}
			else
			{
				this.jsonType = (_jsonType !== $json.ARRAY ? $json.OBJECT : $json.ARRAY);
				this.data=(this.jsonType == $json.ARRAY ? [] : {});
			}
		};
		$json.class_.prototype.put = function(value){
			if(arguments.length==2) return $json.class_.prototype.set.apply(this,arguments);
			if(typeof value=="object" && value.constructor == $json.class_)
			{
				this.data.push(value.data);
				return value;
			}
			this.data.push(value);
			return this;
		};
		$json.class_.prototype.putArray = function(){
			var args=arguments, key=null;
			if(this.jsonType==$json.OBJECT){
				key = (args = Array.prototype.slice.apply(arguments)).shift();
			}
			var object = (function(json, args){
				if(args.length==1 && typeof args[0]=="object" && args[0].constructor==Array)
				{
					json.data = args[0];
				}
				else
				{
					json.data = Array.prototype.slice.apply(args);
				}
				return json;
			})($json.create($json.ARRAY), args);
			
			if(this.jsonType==$json.OBJECT){
				return this.put(key,object);
			}else{
				return this.put(object);
			}
		};
		$json.class_.prototype.putObject = function(){
			var args=arguments, key=null;
			if(this.jsonType==$json.OBJECT){
				key = (args = Array.prototype.slice.apply(arguments)).shift();
			}
			
			var object = (function(json, args){
				if(args.length>0)json.data = args[0];
				return json;
			})($json.create(), args);
			
			if(this.jsonType==$json.OBJECT){
				return this.put(key,object);
			}else{
				return this.put(object);
			}
		};
		$json.class_.prototype.set = function(key, value){
			if(typeof value=="object" && value.constructor == $json.class_)
			{
				this.data[key]=value.data;
				return value;
			}
			this.data[key]=value;
			return this;
		};
		$json.class_.prototype.get = function(key){
			return this.data[key];
		};
		$json.class_.prototype.stringify = $json.class_.prototype.toString = function(space){
			return $json.stringify(this.data,null,space||"");
		};
		$json.class_.prototype.toXML = function(rootElementName){
			rootElementName = rootElementName || "root";
			return json2xml(this.data, rootElementName);
		};
		return new $json.class_(jsonType); 
	};
	return $json;
}());