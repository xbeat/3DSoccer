//////////////////////////////
// Main

document.querySelector('.nav-toggle').addEventListener( "click", function(e){
  e.currentTarget.classList.toggle('open');
  document.querySelector('.menu-container').classList.toggle('nav-open');
});

//toggle button styles
document.querySelector('.toggle').addEventListener( "click", function(e){
  document.querySelector('.selected').classList.remove('selected');
  e.currentTarget.classList.add('selected');
});

//////////////////////
//Joystick
var virtualInput = {};

( function( ns ) {
  var _ua = (function() {
    return {
      Touch: typeof document.ontouchstart != "undefined",
      Pointer: window.navigator.pointerEnabled,
      MSPoniter: window.navigator.msPointerEnabled
    };
  })();

  ns._start = ["pointerdown", "MSPointerDown", "touchstart", "mousedown"];
  ns._move = ["pointermove", "MSPointerMove", "touchmove", "mousemove"];
  ns._end = ["pointerup", "MSPointerUp", "touchend", "mouseup"];

  // https://github.com/mrdoob/eventdispatcher.js/
  /**
   * @author mrdoob / http://mrdoob.com/
   */
  var EventDispatcher = function() {};

  EventDispatcher.prototype = {
    constructor: EventDispatcher,
    apply: function(object) {
      object.addEventListener = EventDispatcher.prototype.addEventListener;
      object.hasEventListener = EventDispatcher.prototype.hasEventListener;
      object.removeEventListener = EventDispatcher.prototype.removeEventListener;
      object.dispatchEvent = EventDispatcher.prototype.dispatchEvent;
    },

    addEventListener: function(type, listener) {
      if (this._listeners === undefined) this._listeners = {};
      var listeners = this._listeners;
      if (listeners[type] === undefined) {
        listeners[type] = [];
      }

      if (listeners[type].indexOf(listener) === -1) {
        listeners[type].push(listener);
      }
    },

    hasEventListener: function(type, listener) {
      if (this._listeners === undefined) return false;
      var listeners = this._listeners;
      if (
        listeners[type] !== undefined &&
        listeners[type].indexOf(listener) !== -1
      ) {
        return true;
      }
      return false;
    },

    removeEventListener: function(type, listener) {
      if (this._listeners === undefined) return;
      var listeners = this._listeners;
      var listenerArray = listeners[type];
      if (listenerArray !== undefined) {
        var index = listenerArray.indexOf(listener);
        if (index !== -1) {
          listenerArray.splice(index, 1);
        }
      }
    },

    dispatchEvent: function(event) {
      if (this._listeners === undefined) return;
      var listeners = this._listeners;
      var listenerArray = listeners[event.type];

      if (listenerArray !== undefined) {
        event.target = this;
        var array = [];
        var length = listenerArray.length;
        for (var i = 0; i < length; i++) {
          array[i] = listenerArray[i];
        }

        for (var i = 0; i < length; i++) {
          array[i].call(this, event);
        }
      }
    }
  };

  ///////////////////////////
  //Joystick
  ns.Joystick = function(container, size, params) {
    EventDispatcher.prototype.apply(this);
    this.angle = 0;
    this.position = { x: 0, y: 0 };
    this.pointerId = null;
    this.isActive = false;

    this.width = size * 2;
    this.halfWidth = size;

    var that = this;
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

    container.insertAdjacentHTML("beforeend", template);

    this.all = document.getElementById(id);
    this.all.style.width = this.width + "px";
    this.all.style.height = this.width + "px";

    this.button = this.all.querySelector(".virtualInput-joystick__button");
    this.button.style.width = size * 0.6 + "px";
    this.button.style.height = size * 0.6 + "px";

    this.offset = {};
    this.offset.left = this.all.offsetLeft;
    this.offset.top = this.all.offsetTop;

    this.buttonRadius = parseInt(this.button.style.width) / 2;
    this.frameRadius = size / 2;

    /////////////////////
    // Events
    var onbuttondown = function(event) {
      event.preventDefault();
      event.stopPropagation();

      that.dispatchEvent({ type: "active" });
      that.isActive = true;

      if (event.changedTouches) {
        that.pointerId =
          event.changedTouches[event.changedTouches.length - 1].identifier;
      }

      var coordinate = that.getEventCoordinate(event);

      if (!coordinate) {
        return;
      }

      that.setPosition(coordinate.x, coordinate.y);
      that.dispatchEvent({ type: "move" });

      addListenerMulti(window, ns._move, onbuttonmove);
      addListenerMulti(window, ns._end, onbuttonup);
    };

    var onbuttonmove = function(event) {
      event.preventDefault();
      event.stopPropagation();
      var coordinate = that.getEventCoordinate(event);

      if (!coordinate) {
        return;
      }
      that.setPosition(coordinate.x, coordinate.y);
      that.dispatchEvent({ type: "move" });
    };

    var onbuttonup = function(event) {
      event.stopPropagation();
      var wasEventHappend;

      if (event.changedTouches) {
        for ((i = 0), (l = event.changedTouches.length); i < l; i++) {
          if (that.pointerId === event.changedTouches[i].identifier) {
            wasEventHappend = true;
            break;
          }
          if (!wasEventHappend) {
            return;
          }
        }
      }

      that.dispatchEvent({ type: "disactive" });
      that.isActive = false;
      that.setPosition(0, 0);
      quadrant = 0;

      removeListenerMulti(window, ns._move, onbuttonmove);
      removeListenerMulti(window, ns._end, onbuttonup);
    };

    this.setCSSPosition(0, 0);

    addListenerMulti(this.all, ns._start, onbuttondown);
    window.addEventListener("resize", function() {
      that.offset.left = that.all.offsetLeft;
      that.offset.top = that.all.offsetTop;
    });
  };

  ///////////////////////////////////
  //math
  ns.Joystick.prototype.getLength = function(x, y) {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  };

  ns.Joystick.prototype.setAngle = function(lengthX, lengthY) {
    if (lengthX === 0 && lengthY === 0) {
      return this.angle;
    }

    var angle = Math.atan(lengthY / lengthX);

    if (0 > lengthX && 0 <= lengthY) {
      //the second quadrant
      angle += Math.PI;
    } else if (0 > lengthX && 0 > lengthY) {
      //the third quadrant
      angle += Math.PI;
    } else if (0 <= lengthX && 0 > lengthY) {
      //the fourth quadrant
      angle += Math.PI * 2;
    }
    this.angle = angle;
    return angle;
  };

  ns.Joystick.prototype.getAngle = function() {
    return this.angle;
  };

  ns.Joystick.prototype.getPointOnRadius = function() {
    return {
      x: Math.cos(this.angle),
      y: Math.sin(this.angle)
    };
  };
  // geometry
  ns.Joystick.prototype.getEventCoordinate = function(event) {
    var x, y, i, _event = null, l;

    if (event.changedTouches) {
      for ((i = 0), (l = event.changedTouches.length); i < l; i++) {
        if (this.pointerId === event.changedTouches[i].identifier) {
          _event = event.changedTouches[i];
        }
      }
    } else {
      _event = event;
    }
    if (_event === null) {
      return false;
    }

    x = (_event.clientX - this.offset.left - this.halfWidth) / this.halfWidth * 2;
    y = (-(_event.clientY - this.offset.top) + this.halfWidth) / this.halfWidth * 2;

    return { x: x, y: y };
  };

  ns.Joystick.prototype.setPosition = function(x, y) {
    this.position.x = x;
    this.position.y = y;
    var length = this.getLength(x, y);
    var angle = this.setAngle(x, y);

    if (1 >= length) {
      this.setCSSPosition(x, y);
      return;
    }

    var pointOnRadius = this.getPointOnRadius();
    this.setCSSPosition(pointOnRadius.x, pointOnRadius.y);
  };

  ns.Joystick.prototype.setCSSPosition = function(x, y) {
    this.button.style.left =
      this.halfWidth + x * this.frameRadius - this.buttonRadius + "px";
    this.button.style.top =
      this.halfWidth - y * this.frameRadius - this.buttonRadius + "px";
  };

  ////////////////////////
  //button
  ns.Button = function(container, size, params) {
    EventDispatcher.prototype.apply(this);
    var ns = {};
    var that = this;
    var id = params && params.id ? params.id : "";
    var label = params.label;
    var template = [
      '<div class="virtualInput-button" id="' + id + '">',
      '<div class="virtualInput-button__inner">',
      label,
      "</div>",
      "</div>"
    ].join("");

    container.insertAdjacentHTML("beforeend", template);
    var button = document.getElementById(id);
    button.style.width = size + "px";
    button.style.height = size + "px";

    ns._start = ["pointerdown", "MSPointerDown", "touchstart", "click"];
    var fn = function() {
      that.dispatchEvent({ type: "press" });
    };
    addListenerMulti(button, ns._start, fn);
  };
})(virtualInput);

///////////////////////////
// Code
var joystick1 = new virtualInput.Joystick(document.body, 120, {
  id: "joystick1"
});
var joystick2 = new virtualInput.Joystick(document.body, 120, {
  id: "joystick2"
});
var button1 = new virtualInput.Button(document.body, 70, {
  id: "button1",
  label: "button1"
});
var button2 = new virtualInput.Button(document.body, 70, {
  id: "button2",
  label: "button2"
});

var ns = {};
ns._start = ["click"];

//addListenerMulti
function addListenerMulti(el, a, fn) {
  a.forEach(function(ev) {
    el.addEventListener(ev, fn, false);
  });
}

//removeListenerMulti
function removeListenerMulti(el, a, fn) {
  a.forEach(function(ev) {
    el.removeEventListener(ev, fn, false);
  });
}

function degToRad(deg) {
  return deg * Math.PI / 180;
}

var rotate = 0;
var cameraStart = 0;
var quadrant = 0;

function updateView(){
  var currentDirX = "", currentDirY = "";
  if ( quadrant === 0) return;
  if ( quadrant > 4.750 || quadrant <= 1.250 ) { currentDirX = "right"; currentDirY = "";	}			
  if ( quadrant > 1.250 && quadrant <= 1.750 ) { currentDirX = "right"; currentDirY = "up"; }	
  if ( quadrant > 1.750 && quadrant <= 2.250 ) { currentDirX = ""; currentDirY = "up";	}
  if ( quadrant > 2.250 && quadrant <= 2.750 ) { currentDirX = "left"; currentDirY = "up";	}	
  if ( quadrant > 2.750 && quadrant <= 3.250 ) { currentDirX = "left"; currentDirY = "";	}	
  if ( quadrant > 3.250 && quadrant <= 3.750 ) { currentDirX = "left"; currentDirY = "down"; }	
  if ( quadrant > 3.750 && quadrant <= 4.250 ) { currentDirX = ""; currentDirY = "down"; }
  if ( quadrant > 4.250 && quadrant <= 4.750 ) { currentDirX = "right"; currentDirY = "down"; }

  if (currentDirX === "left") {
    cameraStart = cameraStart - 4;
    soccer3D.camera.position.setZ(cameraStart);
    //pointLight.position.setZ(cameraStart);
  } else if (currentDirX === "right") {
    cameraStart += 4;
    soccer3D.camera.position.setZ(cameraStart);
  }
  if (currentDirY === "up") {
    rotate -= 0.04;
    soccer3D.scene.rotation.y = rotate;
    //pointLight.rotation.y = rotate;
  } else if (currentDirY === "down") {
    rotate += 0.04;
    soccer3D.scene.rotation.y = rotate;
  };

};

//radToDeg
function radToDeg(rad) {
  var angle = rad * 180 / Math.PI;
  angle %= 360.0; // [0..360) if angle is positive, (-360..0] if negative
  if ( angle < 0 ) angle += 360.0; // Back to [0..360)
  quadrant = ( angle/90 ) % 4 + 1; // Quadrant
  return angle;
};

joystick1.addEventListener("move", function() {
  var rad = this.getAngle();
  updateView();
  radToDeg( rad );
});

joystick2.addEventListener("move", function() {
  var rad = this.getAngle();
  updateView();
  radToDeg(rad);
});

button1.addEventListener("press", function() {
  console.log("button1");
});

button2.addEventListener("press", function() {
  console.log("button2");
});