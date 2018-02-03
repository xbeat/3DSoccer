//==============================================================================
let CharacterController = function ( speedBlendCharacter ) {

	var scope = this;
	var duration = 2;
	var keys = {
		LEFT:  { code: 37, isPressed: false },
		UP:    { code: 38, isPressed: false },
		RIGHT: { code: 39, isPressed: false },
		A:     { code: 65, isPressed: false },
		D:     { code: 68, isPressed: false },
		W:     { code: 87, isPressed: false }
	};

	this.character = speedBlendCharacter;
	this.walkSpeed = 3;
	this.runSpeed = 7;
	this.forward = new THREE.Vector3(); 
	var newSpeed = 0;
	var lastSpeed = 0;

	// ---------------------------------------------------------------------------
	this.update = function( dt ) {

		if ( settings[ 'speed by menu' ] == true ) return;

		if ( keys.UP.isPressed || keys.W.isPressed )
			newSpeed += dt / duration;
		else
			newSpeed -= dt / duration;

		newSpeed = Math.min( 1, Math.max( newSpeed, 0 ) );

		if ( keys.LEFT.isPressed || keys.A.isPressed )
			this.character.rotation.y += dt * 2;
		else if ( keys.RIGHT.isPressed || keys.D.isPressed )
			this.character.rotation.y -= dt * 2;


		this.forward.set(
			this.character.matrixWorld.elements[ 8 ],
			this.character.matrixWorld.elements[ 9 ],
			this.character.matrixWorld.elements[ 10 ]
		);

		var finalSpeed = ( newSpeed > 0.5 ) ? newSpeed * this.runSpeed: ( newSpeed / 0.5 ) * this.walkSpeed;

		if( newSpeed == 0 ) {   //idle
			idleAction.setEffectiveWeight( 1 );    				
			walkAction.setEffectiveWeight( 0 );
			runAction.setEffectiveWeight( 0 );
		};

		if( newSpeed == 1 ) {   //max
			idleAction.setEffectiveWeight( 0 );    				
			walkAction.setEffectiveWeight( 0 );
			runAction.setEffectiveWeight( 1 );
		};

		document.getElementById("data").innerText = newSpeed;

		if( newSpeed > 0 && newSpeed <= 0.5 ) { // from idle to walk < - > from walk to idle
			idleAction.setEffectiveWeight( 1 - ( newSpeed / 0.5 ) );    				
			walkAction.setEffectiveWeight( newSpeed / 0.5  );
			runAction.setEffectiveWeight( 0 );
		};

		if( newSpeed > 0.5 && newSpeed < 1 ) {  // from walk to run < - > from run to walk
			idleAction.setEffectiveWeight( 0 );    				
			walkAction.setEffectiveWeight( 1 - (( newSpeed - 0.5 ) / 0.5 ) );
			runAction.setEffectiveWeight(( newSpeed - 0.5 ) / 0.5 );
		};

		lastSpeed = newSpeed;

		//this.character.setSpeed( newSpeed );    
		this.character.position.add( this.forward.multiplyScalar( finalSpeed ) );
	};

	// ---------------------------------------------------------------------------
	var onKeyDown = function( event ) {
		for ( var k in keys ) {
			if ( event.keyCode === keys[ k ].code ) {
				keys[ k ].isPressed = true; 
			};
		};
	};

	// ---------------------------------------------------------------------------
	var onKeyUp = function( event ) {
		for ( var k in keys ) {
			if ( event.keyCode === keys[ k ].code ) {
				keys[ k ].isPressed = false;
			};
		};
	};

	// ---------------------------------------------------------------------------
	var onDurationChange = function( event ) {
		duration = event.detail.duration;
	};

	window.addEventListener( 'keydown', onKeyDown, false );
	window.addEventListener( 'keyup', onKeyUp, false );
	window.addEventListener( 'change-duration', onDurationChange, false );

};