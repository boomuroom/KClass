var KClass = (function() {
	"use strict";
	var pubMap = new WeakMap();
	var privMapMap = new WeakMap();
	return {
		defClass: defClass,
		is: is,
		wrap: wrap,
		unwrap: unwrap
	};
	function defClass(cfg) {
		var sc = cfg.superclass;
		var ctor = cfg.ctor || sc || function(){};
		var privMap = new WeakMap();
		var className = cfg.className || 'anonymous';
		var clazz = getNameFunction(className, function() {
			var priv = Object.create(privateProto);
			if(cfg.debug) {
				if(!this.myId) {
					this.myId = 'Public' + className;
				}
				priv.myId = 'Private' + className;
			}
			privMap.set(this, priv);
			pubMap.set(priv, this);
			ctor.apply(priv, arguments);
		});
		privMapMap.set(clazz, privMap);
		if(sc) {
			clazz.prototype = Object.create(sc.prototype);
			clazz.prototype.constructor = clazz;
			clazz.prototype.superclass = function() {
				var pub = pubMap.get(this);
				sc.apply(pub, arguments);
			};
			if(ctor === sc) ctor = clazz.prototype.superclass;
		}
		var publicProto = clazz.prototype;
		var privateProto = Object.create(publicProto);
		eachHop(cfg.public, i => {
			if(isFunc(cfg.public[i])) {
				publicProto[i] = function() {
					var priv = getPrivate(this);
					return getPublic(cfg.public[i].apply(priv, arguments));
				}
			} else {
				publicProto[i] = cfg.public[i];
			}
		});
		eachHop(cfg.private, i => {
			if(isFunc(cfg.private[i])) {
				privateProto[i] = function() {
					var priv = getPrivate(this);
					return getPublic(cfg.private[i].apply(priv, arguments));
				}
			} else {
				privateProto[i] = cfg.private[i];
			}
		});
		eachHop(cfg.static, i => {
			if(i === 'prototype' || i === 'superclass') throw new Error('Cannot set "'+i+'" as static property');
			clazz[i] = cfg.static[i];
		});
		return clazz;
		function getPrivate(obj) {
			return (privMap.has(obj) && privMap.get(obj))	// private from public
				|| (pubMap.has(obj) && privMap.get(pubMap.get(obj)))	// current is private
				|| null;	// Fail because we don't know what it is
		}
		function hop(o, p) {
			return Object.prototype.hasOwnProperty.call(o, p);
		}
		function isFunc(o) {
			return typeof(o) === 'function';
		}
		function eachHop(obj, fn) {
			for(var i in obj) {
				if(hop(obj, i)) {
					fn(i);
				}
			}
		}
		function getNameFunction(name, fn) {
			// If they give the same name as first param to Function we get infinite recursion
			// So the cute name is there to prevent a real issue. Not just look cute
			return new Function("ಠ_ಠ", "return function " + name + "(){ return ಠ_ಠ.apply(this, arguments) };")(fn);
		}
	}
	function getPublic(obj) {
		return (pubMap.has(obj) && pubMap.get(obj)) || obj;
	}
	function is(a, b) {
		return getPublic(a) === getPublic(b);
	}
	function wrap(obj) {
		if(pubMap.has(obj)) return pubMap.get(obj);
		throw new Error('No public instance found');
	}
	function unwrap(obj, clazz) {
		var privMap = privMapMap.get(clazz);
		if(privMap && privMap.has(obj)) return privMap.get(obj);
		throw new Error('No private instance found');
	}
})();
