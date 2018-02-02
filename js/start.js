
"use strict";

let RAF;

function pause(){
	cancelAnimationFrame( RAF );
};

let container = document.getElementById( 'container' );

let scene, renderer, camera, controls;
let mesh, skeleton, mixer;

let crossFadeControls = [];

let idleAction, walkAction, runAction;
let idleWeight, walkWeight, runWeight;
let actions;
let settings;
let characterController;

var clock = new THREE.Clock();

var singleStepMode = false;
var sizeOfNextStep = 0;


// Initialize scene, light and renderer
scene = new THREE.Scene();

scene.add ( new THREE.AmbientLight( 0xffffff ) );

let lightOffset = new THREE.Vector3( 0, 1000, 1000.0 );	
let light = new THREE.DirectionalLight( 0x666666, 1.5 );
light.position.copy( lightOffset );
light.castShadow = true;
light.shadow.mapSize.width = 4096;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 10;
light.shadow.camera.far = 10000;
light.shadow.bias = 0.00001;
light.shadow.camera.right = 4000;
light.shadow.camera.left = -4000;
light.shadow.camera.top = 4000;
light.shadow.camera.bottom = -4000;

let helper = new THREE.CameraHelper(light.shadow.camera);

scene.add( light );
scene.add( helper );

renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor("#dddddd", 1);
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.autoClear = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			
var ctx = renderer.context;
ctx.getShaderInfoLog = function () { return '' };

container.appendChild( renderer.domElement );

//////////////////////////////////////
// Load skinned mesh
//var url = '../lib/three.js-master/examples/models/skinned/marine/marine_anims_core.json';
var url = url = 'models/player/Player.json';

new THREE.ObjectLoader().load( url, function ( loadedObject ) {
	loadedObject.traverse( function ( child ) {
		if ( child instanceof THREE.SkinnedMesh ) {
			mesh = child;
		}
	} );

	if ( mesh === undefined ) {
		alert( 'Unable to find a SkinnedMesh in this place:\n\n' + url + '\n\n' );
		return;
	};

	addPlayer();
});

//////////////////////////////////////
// Create Ground			
new THREE.JSONLoader().load( "models/pitch/Pitch.js", function( geometry, materials ) {
		
		materials[0].side = THREE.DoubleSide;					
		var ground =  new THREE.Mesh( geometry, materials[0] );
		ground.scale.set( 20, 20, 20 );
		ground.receiveShadow = true;

		scene.add( ground );

});

//////////////////////////////////////
// Create Sky Scene
var path = "models/skyscene/";
var format = '.jpg';
var urls = [
  path + 'px' + format, path + 'nx' + format,
  path + 'py' + format, path + 'ny' + format,
  path + 'pz' + format, path + 'nz' + format
 ];

var textureLoader = new THREE.CubeTextureLoader();
var textureCube = textureLoader.load(urls);

var shader = THREE.ShaderLib["cube"];
shader.uniforms["tCube"].value = textureCube;

// We're inside the box, so make sure to render the backsides
// It will typically be rendered first in the scene and without depth so anything else will be drawn in front
var material = new THREE.ShaderMaterial({
  fragmentShader : shader.fragmentShader,
  vertexShader   : shader.vertexShader,
  uniforms       : shader.uniforms,
  depthWrite     : false,
  side           : THREE.BackSide
});

// The box dimension size doesn't matter that much when the camera is in the center.  Experiment with the values.
let skyMesh = new THREE.Mesh( new THREE.CubeGeometry( 10000, 10000, 10000, 1, 1, 1 ), material );
skyMesh.renderDepth = -10;
scene.add(skyMesh);	


function addPlayer(){
	// Add mesh and skeleton helper to scene
	//mesh.rotation.y = - 135 * Math.PI;
	scene.add( mesh );

	skeleton = new THREE.SkeletonHelper( mesh );
	skeleton.visible = false;
	scene.add( skeleton );

    //mesh.rotation.y = Math.PI * -135;
	mesh.castShadow = true;

	scene.add( mesh );

	var aspect = window.innerWidth / window.innerHeight;
	var radius = mesh.geometry.boundingSphere.radius;

	camera = new THREE.PerspectiveCamera( 45, aspect, 1, 20000 );
	camera.position.set( 0.0, radius * 3, radius * 3.5 );

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, radius, 0 );
	controls.enabled = false;
	//controls.enablePan = true;

	// Create the control panel
	createPanel();

	// Initialize mixer and clip actions
	mixer = new THREE.AnimationMixer( mesh );

	idleAction = mixer.clipAction( 'idle' );
	walkAction = mixer.clipAction( 'walk' );
	runAction = mixer.clipAction( 'run' );
	actions = [ idleAction, walkAction, runAction ];

	activateAllActions();

	characterController = new CharacterController( mesh );
	
	render();

};

//////////////////////////////////////
// animate
function render() {

	// Render loop
	RAF = requestAnimationFrame( render );

	idleWeight = idleAction.getEffectiveWeight();
	walkWeight = walkAction.getEffectiveWeight();
	runWeight = runAction.getEffectiveWeight();

	// Update the panel values if weights are modified from "outside" (by crossfadings)
	updateWeightSliders();

	// Enable/disable crossfade controls according to current weight values
	updateCrossFadeControls();

	// Get the time elapsed since the last frame, used for mixer update (if not in single step mode)
	var mixerUpdateDelta = clock.getDelta();

	// If in single step mode, make one step and then do nothing (until the user clicks again)
	if ( singleStepMode ) {
		mixerUpdateDelta = sizeOfNextStep;
		sizeOfNextStep = 0;
	}

	// Update the animation mixer, and render this frame
	mixer.update( mixerUpdateDelta );
	
	//updateCamera();
	
	// update character position
    var scale = 1;//gui.getTimeScale();		        
    var delta = 0.033;//clock.getDelta();
    var stepSize = delta * scale;

	//console.log(`delta ${delta} scale ${scale} stepsize ${stepSize}`);

    characterController.update( stepSize, scale );
    //gui.setSpeed( blendMesh.speed );

    //THREE.AnimationHandler.update( stepSize );
    //blendMesh.updateSkeletonHelper();		

	renderer.render( scene, camera );

};

//////////////////////////////////////
// resize
window.addEventListener( 'resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}, false);

//////////////////////////////////////
// animate
function updateCamera() {

    controls.target.copy( mesh.position );
    controls.target.y += mesh.geometry.boundingSphere.radius * 2;
    controls.update();

    var camOffset = camera.position.clone().sub(controls.target);
    camOffset.normalize().multiplyScalar( 750 );
    camera.position.copy(controls.target.clone().add(camOffset));	

};

//////////////////////////////////////
// Dat gui panel
function createPanel() {

	var panel = new dat.GUI( { width: 310 } );

	var folder1 = panel.addFolder( 'Visibility' );
	var folder2 = panel.addFolder( 'Activation/Deactivation' );
	var folder3 = panel.addFolder( 'Pausing/Stepping' );
	var folder4 = panel.addFolder( 'Crossfading' );
	var folder5 = panel.addFolder( 'Blend Weights' );
	var folder6 = panel.addFolder( 'General Speed' );

	settings = {
		'show model':            true,
		'show skeleton':         false,
		'use controls':          false,
		'speed by menu':         false,
		'deactivate all':        deactivateAllActions,
		'activate all':          activateAllActions,
		'pause/continue':        pauseContinue,
		'make single step':      toSingleStepMode,
		'modify step size':      0.05,
		'from walk to idle':     function () { prepareCrossFade( walkAction, idleAction, 1.0 ) },
		'from idle to walk':     function () { prepareCrossFade( idleAction, walkAction, 0.5 ) },
		'from walk to run':      function () { prepareCrossFade( walkAction, runAction, 2.5 ) },
		'from run to walk':      function () { prepareCrossFade( runAction, walkAction, 5.0 ) },
		'use default duration':  true,
		'set custom duration':   3.5,
		'modify idle weight':    0.0,
		'modify walk weight':    1.0,
		'modify run weight':     0.0,
		'modify time scale':     1.0
	};

	folder1.add( settings, 'show model' ).onChange( showModel );
	folder1.add( settings, 'show skeleton' ).onChange( showSkeleton );
	folder1.add( settings, 'use controls' ).onChange( useControls );
	folder1.add( settings, 'speed by menu' );
	folder2.add( settings, 'deactivate all' );
	folder2.add( settings, 'activate all' );
	folder3.add( settings, 'pause/continue' );
	folder3.add( settings, 'make single step' );
	folder3.add( settings, 'modify step size', 0.01, 0.1, 0.001 );
	crossFadeControls.push( folder4.add( settings, 'from walk to idle' ) );
	crossFadeControls.push( folder4.add( settings, 'from idle to walk' ) );
	crossFadeControls.push( folder4.add( settings, 'from walk to run' ) );
	crossFadeControls.push( folder4.add( settings, 'from run to walk' ) );
	folder4.add( settings, 'use default duration' );
	folder4.add( settings, 'set custom duration', 0, 10, 0.01 );
	folder5.add( settings, 'modify idle weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) { setWeight( idleAction, weight ) } );
	folder5.add( settings, 'modify walk weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) { setWeight( walkAction, weight ) } );
	folder5.add( settings, 'modify run weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) { setWeight( runAction, weight ) } );
	folder6.add( settings, 'modify time scale', 0.0, 1.5, 0.01 ).onChange( modifyTimeScale );

	folder1.open();
	folder2.open();
	folder3.open();
	folder4.open();
	folder5.open();
	folder6.open();

	crossFadeControls.forEach( function ( control ) {

		control.classList1 = control.domElement.parentElement.parentElement.classList;
		control.classList2 = control.domElement.previousElementSibling.classList;

		control.setDisabled = function () {

			control.classList1.add( 'no-pointer-events' );
			control.classList2.add( 'control-disabled' );

		};

		control.setEnabled = function () {

			control.classList1.remove( 'no-pointer-events' );
			control.classList2.remove( 'control-disabled' );

		};

	} );
}

function showModel( visibility ) {
	mesh.visible = visibility;
}

function showSkeleton( visibility ) {
	skeleton.visible = visibility;
}

function useControls( useControls ) {
	controls.enabled = useControls;
}

function modifyTimeScale( speed ) {
	mixer.timeScale = speed;
}

function deactivateAllActions() {
	actions.forEach( function ( action ) {
		action.stop();
	} );
}


function activateAllActions() {
	setWeight( idleAction, settings[ 'modify idle weight' ] );
	setWeight( walkAction, settings[ 'modify walk weight' ] );
	setWeight( runAction, settings[ 'modify run weight' ] );

	actions.forEach( function ( action ) {
		action.play();
	} );
}

function pauseContinue() {
	if ( singleStepMode ) {
		singleStepMode = false;
		unPauseAllActions();
	} else {
		if ( idleAction.paused ) {
			unPauseAllActions();
		} else {
			pauseAllActions();
		}
	}
}

function pauseAllActions() {
	actions.forEach( function ( action ) {
		action.paused = true;
	} );
};

function unPauseAllActions() {
	actions.forEach( function ( action ) {
		action.paused = false;
	} );
};

function toSingleStepMode() {
	unPauseAllActions();
	singleStepMode = true;
	sizeOfNextStep = settings[ 'modify step size' ];
};

function prepareCrossFade( startAction, endAction, defaultDuration ) {
	// Switch default / custom crossfade duration (according to the user's choice)
	var duration = setCrossFadeDuration( defaultDuration );
	// Make sure that we don't go on in singleStepMode, and that all actions are unpaused
	singleStepMode = false;
	unPauseAllActions();

	// If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
	// else wait until the current action has finished its current loop
	if ( startAction === idleAction ) {
		executeCrossFade( startAction, endAction, duration );
	} else {
		synchronizeCrossFade( startAction, endAction, duration );
	};
};

function setCrossFadeDuration( defaultDuration ) {
	// Switch default crossfade duration <-> custom crossfade duration
	if ( settings[ 'use default duration' ] ) {
		return defaultDuration;
	} else {
		return settings[ 'set custom duration' ];
	};
};


function synchronizeCrossFade( startAction, endAction, duration ) {
	mixer.addEventListener( 'loop', onLoopFinished );
	function onLoopFinished( event ) {
		if ( event.action === startAction ) {
			mixer.removeEventListener( 'loop', onLoopFinished );
			executeCrossFade( startAction, endAction, duration );
		};
	};
};

function executeCrossFade( startAction, endAction, duration ) {
	// Not only the start action, but also the end action must get a weight of 1 before fading
	// (concerning the start action this is already guaranteed in this place)
	setWeight( endAction, 1 );
	endAction.time = 0;
	// Crossfade with warping - you can also try without warping by setting the third parameter to false
	startAction.crossFadeTo( endAction, duration, true );
};

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))
function setWeight( action, weight ) {
	action.enabled = true;
	action.setEffectiveTimeScale( 1 );
	action.setEffectiveWeight( weight );
}

// Called by the render loop
function updateWeightSliders() {
	settings[ 'modify idle weight' ] = idleWeight;
	settings[ 'modify walk weight' ] = walkWeight;
	settings[ 'modify run weight' ] = runWeight;
};

// Called by the render loop
function updateCrossFadeControls() {
	crossFadeControls.forEach( function ( control ) {
		control.setDisabled();
	} );

	if ( idleWeight === 1 && walkWeight === 0 && runWeight === 0 ) {
		crossFadeControls[ 1 ].setEnabled();
	}

	if ( idleWeight === 0 && walkWeight === 1 && runWeight === 0 ) {
		crossFadeControls[ 0 ].setEnabled();
		crossFadeControls[ 2 ].setEnabled();
	}

	if ( idleWeight === 0 && walkWeight === 0 && runWeight === 1 ) {
		crossFadeControls[ 3 ].setEnabled();
	}
};

