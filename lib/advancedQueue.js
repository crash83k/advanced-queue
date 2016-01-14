module.exports = AdvancedQueue;

var Queue = require('./queue');

function AdvancedQueue(options) {

	var Q             = new Queue(),
		lastLength    = 0,
		checkTimer    = null,
		softScale     = 0,
		maScale       = 0,
		movingAverage = [];


	options = {
		checkFreq:     (options.checkFreq) ? options.checkFreq : 500,
		scaleTrigger:  (options.scaleTrigger) ? options.scaleTrigger : 50,
		scaleFunction: (options.scaleFunction) ? options.scaleFunction : function () {
			console.warn("Scale Alert");
		}
	};

	console.log("Starting with scale trigger: " + options.scaleTrigger);

	function startCheckTimer() {
		if (checkTimer !== null) {
			try {
				clearInterval(checkTimer);
			}
			catch (e) {}
		}

		checkTimer = setInterval(function () {
			checkLength();

			if (options.scaleTrigger > 0 && maScale >= options.scaleTrigger) {
				if (typeof options.scaleFunction === 'function') {
					maScale = 0;
					softScale = 0;
					options.scaleFunction();
				}
			}

		}, options.checkFreq);
	}

	function checkLength() {
		var newLen = Q.getLength();
		if (lastLength > 0) {
			if (newLen > lastLength) {
				softScale += 1;
			} else if (lastLength < newLen && softScale !== 0) {
				softScale -= 1;
			}
			movingAverage.push(newLen - lastLength);
		} else {
			movingAverage.push(0);
		}

		maScale += getMovingAvg();
		if (maScale < 0) maScale = 0;
		lastLength = newLen;
	}

	function getMovingAvg() {
		if (movingAverage.length < 3) return 0;
		var sum = 0;
		for (var i = 1; i < 3; i += 1) {
			sum += movingAverage[movingAverage.length - i];
		}

		// Clean this up once in a while.
		if (movingAverage.length > 10) {
			movingAverage = movingAverage.slice(2);
		}

		return Math.floor((sum / 3) * 10000) / 10000;
	}

	startCheckTimer();

	this.isEmpty = Q.isEmpty;
	this.getLength = Q.getLength;
	this.enqueue = Q.enqueue;
	this.dequeue = Q.dequeue;
	this.peek = Q.peek;
	this.getMovingAverage = function () { return getMovingAvg(); };
	this.getMAScale = function () { return maScale; };
	this.setScaleTrigger = function (number) {
		options.scaleTrigger = number || options.scaleTrigger;
	};
	this.setScaleFunction = function (func) {
		if (typeof func === 'function') {
			options.scaleFunction = func;
		}
	};

	return this;

}