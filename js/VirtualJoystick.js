document.querySelector('.nav-toggle').addEventListener( "click", function( e ){
	e.currentTarget.classList.toggle('open');
	document.querySelector('.menu-container').classList.toggle('nav-open');
});

//toggle button styles
document.querySelector('.toggle').addEventListener( "click", function( e ){
	document.querySelector('.selected').classList.remove('selected');
	e.currentTarget.classList.add('selected');
});

let rotate = 0;
let cameraStart = 0;
let quadrant = 0;

// https://github.com/mrdoob/eventdispatcher.js/
/**
* @author mrdoob / http://mrdoob.com/
*/
class EventDispatcher{

	constructor(){};

	addEventListener( type, listener ) {
		if ( this._listeners === undefined ) this._listeners = {};
		
		let listeners = this._listeners;
		
		if ( listeners[type] === undefined ) {
			listeners[type] = [];
		};

		if ( listeners[type].indexOf( listener ) === -1 ) {
			listeners[type].push( listener );
		};
	};

	hasEventListener( type, listener ) {
		
		if ( this._listeners === undefined ) return false;
			let listeners = this._listeners;
		
		if ( listeners[ type ] !== undefined &&
			listeners[ type ].indexOf( listener ) !== -1 ) {
			return true;
		};
		return false;
	};

	removeEventListener( type, listener ) {
		
		if ( this._listeners === undefined ) return;
		
		var listeners = this._listeners;
		var listenerArray = listeners[type];
		
		if ( listenerArray !== undefined ) {
			var index = listenerArray.indexOf( listener );
			if ( index !== -1 ) {
				listenerArray.splice( index, 1 );
			};
		};
	};

	dispatchEvent( event ) {
		if ( this._listeners === undefined ) return;
		let listeners = this._listeners;
		let listenerArray = listeners[event.type];

		if ( listenerArray !== undefined ) {
			event.target = this;
			var array = [];
			var length = listenerArray.length;
			for ( var i = 0; i < length; i++ ) {
				array[i] = listenerArray[i];
			};

			for ( var i = 0; i < length; i++ ) {
				array[i].call( this, event );
			};
		};
	};
};

//Joystick
class Joystick extends EventDispatcher {

	//Joystick
	constructor( container, size, params ) {

		super();
		this.angle = 0;
		this.position = { x: 0, y: 0 };
		this.pointerId = null;
		this.isActive = false;

		this.width = size * 2;
		this.halfWidth = size;
		this.scope = this;

		var id = params && params.id ? params.id : "";
		var template = [
			'<div class="virtualInput-joystick" id="' + id + '">',
			'<div class="virtualInput-joystick__button"></div>',
			'<svg class="virtualInput-joystick__frame" width="' +
			this.width +
			'" height="' +
			this.width +
			'" viewbox="0 0 64 64">',
			'<polygon class="virtualInput-joystick__arrowUp"    points="32 19 34 21 30 21"></polygon>',
			'<polygon class="virtualInput-joystick__arrowRight" points="45 32 43 34 43 30"></polygon>',
			'<polygon class="virtualInput-joystick__arrowDown"  points="32 45 34 43 30 43"></polygon>',
			'<polygon class="virtualInput-joystick__arrowLeft"  points="19 32 21 34 21 30"></polygon>',
			'<circle  class="virtualInput-joystick__circle" cx="32" cy="32" r="16" stroke-width="' +
			this.halfWidth / 64 +
			'"></circle>',
			"</svg>",
			"</div>"
		].join("");

		container.insertAdjacentHTML( "beforeend", template );

		this.ns = {};
		this.ns._start = ["pointerdown", "MSPointerDown", "touchstart", "mousedown"];
		this.ns._move = ["pointermove", "MSPointerMove", "touchmove", "mousemove"];
		this.ns._end = ["pointerup", "MSPointerUp", "touchend", "mouseup"];

		this.all = document.getElementById( id );
		this.all.style.width = this.width + "px";
		this.all.style.height = this.width + "px";

		addListenerMulti( this.all, this.ns._start, this.onbuttondown, this );

		window.addEventListener( "resize", function() {
				this.offset.left = this.all.offsetLeft;
				this.offset.top = this.all.offsetTop;
		}.bind( this ) );

		this.button = this.all.querySelector( ".virtualInput-joystick__button" );
		this.button.style.width = size * 0.6 + "px";
		this.button.style.height = size * 0.6 + "px";

		this.offset = {};
		this.offset.left = this.all.offsetLeft;
		this.offset.top = this.all.offsetTop;

		this.buttonRadius = parseInt( this.button.style.width ) / 2;
		this.frameRadius = size / 2;

		this.setCSSPosition( 0, 0 );
	};
	
	// Events
	onbuttondown( event ) {
		event.preventDefault();
		event.stopPropagation();

		this.dispatchEvent( { type: "active" } );
		this.isActive = true;

		if ( event.changedTouches ) {
			this.pointerId =
			event.changedTouches[event.changedTouches.length - 1].identifier;
		};

		var coordinate = this.getEventCoordinate( event );

		if ( !coordinate ) {
			return;
		};

		this.setPosition( coordinate.x, coordinate.y );
		this.dispatchEvent( { type: "move" } );

		this.staticonbuttonmove = addListenerMulti( document.body, this.ns._move, this.onbuttonmove, this );
		this.staticonbuttonup = addListenerMulti( document.body, this.ns._end, this.onbuttonup, this );
	};

	onbuttonmove( event ) {
		event.preventDefault();
		event.stopPropagation();
		var coordinate = this.getEventCoordinate( event );

		if ( !coordinate ) {
			return;
		};

		this.setPosition( coordinate.x, coordinate.y );
		this.dispatchEvent( { type: "move" } );
	};

	onbuttonup( event ) {
		event.stopPropagation();
		var wasEventHappend;

		if ( event.changedTouches ) {
			for ( ( i = 0 ), ( l = event.changedTouches.length ); i < l; i++ ) {
				if ( this.pointerId === event.changedTouches[i].identifier ) {
					wasEventHappend = true;
					break;
				};
				if ( !wasEventHappend ) {
					return;
				};
			};
		};

		this.dispatchEvent( { type: "disactive" } );
		this.isActive = false;
		this.setPosition( 0, 0 );
		quadrant = 0;

		removeListenerMulti( document.body, this.ns._move, this.staticonbuttonmove );
		removeListenerMulti( document.body, this.ns._end, this.staticonbuttonup );
	};


	getLength( x, y ) {
		return Math.sqrt(Math.pow( x, 2 ) + Math.pow( y, 2 ) );
	};

	setAngle( lengthX, lengthY ) {
		if (lengthX === 0 && lengthY === 0) {
			return this.angle;
		};

		var angle = Math.atan( lengthY / lengthX );

		if ( 0 > lengthX && 0 <= lengthY ) {
			//the second quadrant
			angle += Math.PI;
		} else if ( 0 > lengthX && 0 > lengthY ) {
			//the third quadrant
			angle += Math.PI;
		} else if ( 0 <= lengthX && 0 > lengthY ) {
			//the fourth quadrant
			angle += Math.PI * 2;
		};
		this.angle = angle;
		return angle;
	};

	getAngle() {
		return this.angle;
	};

	getPointOnRadius() {
		return {
			x: Math.cos( this.angle ),
			y: Math.sin( this.angle )
		};
	};

	// geometry
	getEventCoordinate( event ) {
		var x, y, i, _event = null, l;

		if ( event.changedTouches ) {
			for ( ( i = 0 ), ( l = event.changedTouches.length ); i < l; i++ ) {
				if ( this.pointerId === event.changedTouches[i].identifier ) {
					_event = event.changedTouches[i];
				};
			};
		} else {
			_event = event;
		};

		if ( _event === null ) {
			return false;
		};

		x = ( _event.clientX - this.offset.left - this.halfWidth ) / this.halfWidth * 2;
		y = ( -( _event.clientY - this.offset.top) + this.halfWidth ) / this.halfWidth * 2;

		return { x: x, y: y };
	};

	setPosition( x, y ) {
		this.position.x = x;
		this.position.y = y;
		var length = this.getLength( x, y );
		var angle = this.setAngle( x, y );

		if ( 1 >= length ) {
			this.setCSSPosition( x, y );
			return;
		}

		var pointOnRadius = this.getPointOnRadius();
		this.setCSSPosition( pointOnRadius.x, pointOnRadius.y );
	};

	setCSSPosition( x, y ) {
		this.button.style.left =
		this.halfWidth + x * this.frameRadius - this.buttonRadius + "px";
		this.button.style.top =
		this.halfWidth - y * this.frameRadius - this.buttonRadius + "px";
	};

};

class Button extends EventDispatcher {

	constructor( container, size, params ) {

		super();
		var ns = {};
		var scope = this;
		var id = params && params.id ? params.id : "";
		var label = params.label;
		var template = [
			'<div class="virtualInput-button" id="' + id + '">',
			'<div class="virtualInput-button__inner">',
			label,
			"</div>",
			"</div>"
		].join("");

		container.insertAdjacentHTML( "beforeend", template );
		var button = document.getElementById( id );
		button.style.width = size + "px";
		button.style.height = size + "px";

		ns._start = ["pointerdown", "MSPointerDown", "touchstart", "click"];
		var fn = function() {
			scope.dispatchEvent( { type: "press" } );
		};
		addListenerMulti( button, ns._start, fn, undefined );

	};

};


function addListenerMulti( el, a, fn, scope ) {
	if ( scope !== undefined ){
		var fnStatic = fn.bind( scope ); 
	} else {
		var fnStatic = fn;
	};

	a.forEach( function( ev ) {
		el.addEventListener( ev, fnStatic, false );
	} );
	
	return fnStatic;
};

function  removeListenerMulti( el, a, fn ) {
	a.forEach( function( ev ) {
		el.removeEventListener( ev, fn, false );
	} );
};

//Create obj
var joystick1 = new Joystick( document.body, 120, {
	id: "joystick1"
} );

var joystick2 = new Joystick( document.body, 120, {
	id: "joystick2"
} );

var button1 = new Button( document.body, 70, {
	id: "button1",
	label: "button1"
} );

var button2 = new Button( document.body, 70, {
	id: "button2",
	label: "button2"
} );

var button3 = new Button( document.body, 70, {
	id: "button3",
	label: "button3"
});


function degToRad( deg ) {
	return deg * Math.PI / 180;
};

function updateView(){
	var currentDirX = "", currentDirY = "";
	if ( quadrant === 0 ) return;
	if ( quadrant > 4.750 || quadrant <= 1.250 ) { currentDirX = "right"; currentDirY = "";	}			
	if ( quadrant > 1.250 && quadrant <= 1.750 ) { currentDirX = "right"; currentDirY = "up"; }	
	if ( quadrant > 1.750 && quadrant <= 2.250 ) { currentDirX = ""; currentDirY = "up";	}
	if ( quadrant > 2.250 && quadrant <= 2.750 ) { currentDirX = "left"; currentDirY = "up";	}	
	if ( quadrant > 2.750 && quadrant <= 3.250 ) { currentDirX = "left"; currentDirY = "";	}	
	if ( quadrant > 3.250 && quadrant <= 3.750 ) { currentDirX = "left"; currentDirY = "down"; }	
	if ( quadrant > 3.750 && quadrant <= 4.250 ) { currentDirX = ""; currentDirY = "down"; }
	if ( quadrant > 4.250 && quadrant <= 4.750 ) { currentDirX = "right"; currentDirY = "down"; }

	if ( currentDirX === "left" ) {
		cameraStart = cameraStart - 4;
		soccer3D.camera.position.setZ(cameraStart);
	//pointLight.position.setZ(cameraStart);
	} else if ( currentDirX === "right" ) {
		cameraStart += 4;
		soccer3D.camera.position.setZ(cameraStart);
	};

	if ( currentDirY === "up" ) {
		rotate -= 0.04;
		soccer3D.scene.rotation.y = rotate;
	//pointLight.rotation.y = rotate;
	} else if ( currentDirY === "down" ) {
		rotate += 0.04;
		soccer3D.scene.rotation.y = rotate;
	};

};

//radToDeg
function radToDeg( rad ) {
	var angle = rad * 180 / Math.PI;
	angle %= 360.0; // [0..360) if angle is positive, (-360..0] if negative
	if ( angle < 0 ) { 
		angle += 360.0; // Back to [0..360)
	};
	quadrant = ( angle/90 ) % 4 + 1; // Quadrant
	return angle;
};

joystick1.addEventListener( "move", function() {
	var rad = this.getAngle();
	updateView();
	radToDeg( rad );
});

joystick2.addEventListener( "move", function() {
	var rad = this.getAngle();
	updateView();
	radToDeg(rad);
});

button1.addEventListener( "press", function() {
	console.log("button1");
});

button2.addEventListener( "press", function() {
	console.log("button2");
});

button3.addEventListener( "press", function() {
	console.log("button3");
});
