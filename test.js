function test(KClass) {
	"use strict";
	var defClass = KClass.defClass,
		unwrap = KClass.unwrap,
		wrap = KClass.wrap,
		is = KClass.is;
	function assertEqual(obj1, obj2) {
		if(obj1 !== obj2) {
			throw new Error('Expected ' + obj1 + ' but got ' + obj2);
		}
	}
	var BigTest = defClass({
		public: {
			getName: function() {
				return this.name;	// Access private from public 
			},
			setName: function(name) {
				this.name = name;	// Set private from public 
			},
			getCount: function() {
				return this.count;	// Access private from public 
			},
			getCountComputed: function() {
				return this.compute(this.count);	// Call private from public
			},
			getMathStuff: function(n) {
				return this.doMath(n);
			},
			getDoubleName: function() {
				return this.getName() + ' ' + this.getName();	// Call public from public
			},
			getGreeting: function() {
				return this.getGreeting();	// Private shadowing public
			},
			leak: function() {
				return this;
			}
		},
		private: {
			name: 'John',
			count: 5,
			compute: n => n * n,
			getGreeting: function() {
				return 'Hello, my name is ' + this.getName() + '.'; // Call public from private
			},
			doMath: function(n) {
				var x = 2;
				for(var i=0;i<n;++i) x = this.compute(x); // Call private from private
				return x;
			}
		},
		static: {
			sayHello: () => console.info('Hello world!'),
			compute: n => Math.sqrt(n)
		}
	});
	var big1 = new BigTest();
	var big2 = new BigTest();
	big1.setName('Bob');
	assertEqual(big1.getName(), 'Bob');
	assertEqual(big2.getName(), 'John');
	assertEqual(big1.getCount(), 5);
	assertEqual(big1.getCountComputed(), 25);
	assertEqual(big1.getMathStuff(4), 65536);
	assertEqual(big1.getDoubleName(), 'Bob Bob');
	assertEqual(big1.getGreeting(), 'Hello, my name is Bob.');
	assertEqual(big1.leak(), big1);
	assertEqual(BigTest.compute(25), 5);
	assertEqual(big1.name, undefined);
	assertEqual(big2.name, undefined);
	assertEqual(big1.compute, undefined);

	var Point = defClass({
		public: {
			getX: function() {
				return this.x;
			},
			getY: function() {
				return this.y;
			}
		},
		ctor: function(x, y) {
			this.x = x || 0; this.y = y || 0;
		}
	});
	var p1 = new Point(3, 5);
	assertEqual(p1.x, undefined);
	assertEqual(p1.getX(), 3);

	var Point3D = defClass({
		public: {
			getZ: function() {
				return this.z;
			}
		},
		ctor: function(x, y, z) {
			this.superclass(x, y);
			this.z = z || 0;
		},
		superclass: Point
	});

	var p2 = new Point3D(2, 4, 6);
	assertEqual(true, p2 instanceof Point3D);
	assertEqual(true, p2 instanceof Point);
	assertEqual(false, p1 instanceof Point3D);
	assertEqual(true, p1 instanceof Point);
	assertEqual(p2.z, undefined);
	assertEqual(p2.x, undefined);
	assertEqual(p2.getZ(), 6);
	assertEqual(p2.getX(), 2);
	assertEqual(p2.getX, p1.getX);
	
	var p1Priv = unwrap(p1, Point);
	assertEqual(true, is(p1, p1Priv));
	assertEqual(false, p1 === p1Priv);
	assertEqual(p1, wrap(p1Priv));

	var Widget = defClass({
		superclass: BigTest,
		public: {
			doTest: function() {
				return this.getCountComputed();
			}
		}
	});
	var widget = new Widget();
	assertEqual(widget.getCountComputed(), 25);	// Call superclass private from superclass public
	return 'Success';
}

if(!this.window) {
	// Assume this is node and run test manually
	var fs = require('fs');
	var vm = require('vm');
	var execFile = function(path, context) {
		context = context || {};
		var data = fs.readFileSync(path);
		vm.runInNewContext(data, context, path);
		return context;
	}
	var ctx = execFile('./class.js');
	console.info(test(ctx.KClass));
}
