//////////////////////////////////////
// Easing Functions
// only considering the t value for the range [0, 1] => [0, 1]
//
var EasingFunctions = {
	// no easing, no acceleration
	linear: function linear(t) {
		return t;
	},
	// accelerating from zero velocity
	easeInQuad: function easeInQuad(t) {
		return t * t;
	},
	// decelerating to zero velocity
	easeOutQuad: function easeOutQuad(t) {
		return t * (2 - t);
	},
	// acceleration until halfway, then deceleration
	easeInOutQuad: function easeInOutQuad(t) {
		return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	},
	// accelerating from zero velocity
	easeInCubic: function easeInCubic(t) {
		return t * t * t;
	},
	// decelerating to zero velocity
	easeOutCubic: function easeOutCubic(t) {
		return --t * t * t + 1;
	},
	// acceleration until halfway, then deceleration
	easeInOutCubic: function easeInOutCubic(t) {
		return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
	},
	// accelerating from zero velocity
	easeInQuart: function easeInQuart(t) {
		return t * t * t * t;
	},
	// decelerating to zero velocity
	easeOutQuart: function easeOutQuart(t) {
		return 1 - --t * t * t * t;
	},
	// acceleration until halfway, then deceleration
	easeInOutQuart: function easeInOutQuart(t) {
		return t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
	},
	// accelerating from zero velocity
	easeInQuint: function easeInQuint(t) {
		return t * t * t * t * t;
	},
	// decelerating to zero velocity
	easeOutQuint: function easeOutQuint(t) {
		return 1 + --t * t * t * t * t;
	},
	// acceleration until halfway, then deceleration
	easeInOutQuint: function easeInOutQuint(t) {
		return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
	},
	// elastic bounce effect at the beginning
	easeInElastic: function easeInElastic(t) {
		return (.04 - .04 / t) * Math.sin(25 * t) + 1;
	},
	// elastic bounce effect at the end
	easeOutElastic: function easeOutElastic(t) {
		return .04 * t / --t * Math.sin(25 * t);
	},
	// elastic bounce effect at the beginning and end
	easeInOutElastic: function easeInOutElastic(t) {
		return (t -= .5) < 0 ? (.01 + .01 / t) * Math.sin(50 * t) : (.02 - .01 / t) * Math.sin(50 * t) + 1;
	}
};

/**
* Tween
*/
function tween( values, options ) {
	// Methods & Properties
	var onComplete = options.onComplete;
	var onUpdate = options.onUpdate;
	var ease = options.ease;
	var duration = values.duration;
	
	// Animation start time
	var start = Date.now();
	
	//Properties
	if( values.action == "camera3D" ){
		
		var fromPositionX = values.cameraStart.position.x;
		var toPositionX = values.position.x;
		var fromPositionY = values.cameraStart.position.y;
		var toPositionY = values.position.y;
		var fromPositionZ = values.cameraStart.position.z;
		var toPositionZ = values.position.z;

		var fromRotationX = values.cameraStart.rotation.x;
		var toRotationX = values.rotation.x;
		var fromRotationnY = values.cameraStart.rotation.y;
		var toRotationY = values.rotation.y;
		var fromRotationZ = values.cameraStart.rotation.z;
		var toRotationZ = values.rotation.z;
		
	} else {

		var fromX = values.from.x;
		var toX = values.to.x;
		var fromY = values.from.y;
		var toY = values.to.y;

	};
	
	Math.lerp = function( min, max, amount ) {
		return min + amount * ( max - min );
	};
	
	// Create & run animation function
	var animation = function animation() {
		var now = Date.now();
		var t = duration > 0 ? ( now - start ) / duration : 1;
		var progress = ease( t );

		if( values.action == "camera3D" ){

			values.position.x = Math.lerp( values.cameraStart.position.x, values.cameraEnd.position.x / 20, progress );
			values.position.y = Math.lerp( values.cameraStart.position.y, values.cameraEnd.position.y / 20, progress );
			values.position.z = Math.lerp( values.cameraStart.position.z, values.cameraEnd.position.z / 20, progress );
			values.rotation.x = Math.lerp( values.cameraStart.rotation.x, values.cameraEnd.rotation.x, progress );
			values.rotation.y = Math.lerp( values.cameraStart.rotation.y, values.cameraEnd.rotation.y, progress );
			values.rotation.z = Math.lerp( values.cameraStart.rotation.z, values.cameraEnd.rotation.z, progress );		
		
		} else {
			
			values.progress.x = fromX + progress * (toX - fromX); //linear interpolation
			values.progress.y = fromY + progress * (toY - fromY); //linear interpolation
			
		};
		
		// If complete
		if ( t >= 1 ) {
			onUpdate( values );
			onComplete( values );
			return values;
		} else {
			// Run update callback and loop until finished
			onUpdate( values );
			requestAnimationFrame( animation );
		};
	};
	animation();
};

document.querySelector('#clearBtn').addEventListener('click', function() {
	if (document.querySelector(".virtualInput-joystick").style.visibility == "hidden") {
		document.querySelectorAll(".virtualInput-joystick")[0].style.visibility = "visible";
		document.querySelectorAll(".virtualInput-joystick")[1].style.visibility = "visible";
		document.querySelectorAll(".virtualInput-button")[0].style.visibility = "visible";
		document.querySelectorAll(".virtualInput-button")[1].style.visibility = "visible";
	} else {
		document.querySelectorAll(".virtualInput-joystick")[0].style.visibility = "hidden";
		document.querySelectorAll(".virtualInput-joystick")[1].style.visibility = "hidden";	
		document.querySelectorAll(".virtualInput-button")[0].style.visibility = "hidden";
		document.querySelectorAll(".virtualInput-button")[1].style.visibility = "hidden";
	};
});

/////////////////////////
// 3D + Camera preset
var EMPTY = {};

var cameraPresets = [
  {
    position: {
      x: -2965.8590458155036,
      y: 2235.5054451015108,
      z: 3467.8805523319147
    },
    rotation: {
      x: -0.5725920499272357,
      y: -0.6232494536532424,
      z: -0.35987178331501773
    }
  },
  {
    position: {
      x: 0,
      y: 1e4,
      z: 0
    },
    rotation: {
      x: -Math.PI / 2,
      y: 0,
      z: 0
    }
  },
  {
    position: {
      x: 4952.937923945333,
      y: -75.39736997065991,
      z: 1132.5728047255002
    },
    rotation: {
      x: 0.06647368377615936,
      y: 1.345513565303963,
      z: -0.06479871684945059
    }
  },
  {
    position: {
      x: 0,
      y: 0,
      z: 5080
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    }
  }
];

var heavenPreset = {
  position: {
    x: -340.39172412110474,
    y: 210.1353999906835,
    z: 403.68047358695467
  },
  rotation: {
    x: -0.4799512237452751,
    y: -0.6421887695903379,
    z: -0.3022310914885656
  }
};

var cameraTarget;
//tween camera
var cameraPosition = {
  tweenCamera: function( cameraPresets ) {
		var preset = {};
		preset.duration = 1000;
		preset.cameraStart = {
			position: new THREE.Vector3(),
			rotation: new THREE.Vector3(),
			fov: 0
		};

	    preset.cameraStart.position.copy( soccer3D.camera.position );
    	preset.cameraStart.rotation.copy( soccer3D.camera.rotation );
		preset.cameraStart.fov = soccer3D.camera.fov;
		preset.action = "camera3D";
		preset.cameraEnd = cameraPresets;
		
		preset.position = {
			x: 0,				
			y: 0,
			z: 0
		};
		
		preset.rotation = {
			x: 0,
			y: 0,
			z: 0
		};
		
		tween( preset, {
			onUpdate: function onUpdate( values ) {
        		soccer3D.camera.position.x = values.position.x;				
        		soccer3D.camera.position.y = values.position.y;
				soccer3D.camera.position.z = values.position.z;
				soccer3D.camera.rotation.x = values.rotation.x;
				soccer3D.camera.rotation.y = values.rotation.y;
				soccer3D.camera.rotation.z = values.rotation.z;						
			},
			onComplete: function onComplete() {
				console.log("complete");
			},
			ease: EasingFunctions.easeOutCubic
		});
	},

	applyCamera: function( preset ) {
		soccer3D.camera.position.copy( preset.position );
		soccer3D.camera.lookAt( new THREE.Vector3( 0,0,0 ) );
	}
};

let presetButton = document.getElementById("camera-presets").getElementsByTagName("li");
presetButton[0].addEventListener( "click", function() {
  cameraPosition.tweenCamera( cameraPresets[0] );
}, false );
presetButton[1].addEventListener( "click", function() {
  cameraPosition.tweenCamera( cameraPresets[1] );
}, false );
presetButton[2].addEventListener( "click", function() {
  cameraPosition.tweenCamera( cameraPresets[2] );
}, false );
presetButton[3].addEventListener( "click", function() {
  cameraPosition.tweenCamera( cameraPresets[3] );
}, false );
presetButton[4].addEventListener( "click", function() {
  cameraPosition.applyCamera( heavenPreset );
}, false );
