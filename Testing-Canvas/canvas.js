/* GESTION DE LA PHYSIQUE DES BALLES */

// Moteur physique g�rant des balles
function BallEngine(handler, canvas, context) {
	var self = this;
	var _balls = [];
	var _i; // It�rateur pour le parcours des balles

	// Param�tres du moteur physique
	var _ballsAmount = 1;
	var _duplicationMode = false;

	this.setBallsAmount = function(amount) {
		_ballsAmount = amount;
		updateBallsAmount();
	};
	this.setDuplicationMode = function(state) { _duplicationMode = state; };

	// Param�tres des balles
	var _radiusMin = 4;
	var _radiusMax = 30;
	var _speedMin = 2;
	var _speedMax = 10;

	this.setRadiusMin = function(radiusMin) { _radiusMin = radiusMin ; };
	this.setRadiusMax = function(radiusMax) { _radiusMax = radiusMax ; };
	this.setSpeedMin = function(speedMin) { _speedMin = speedMin ; };
	this.setSpeedMax = function(speedMax) { _speedMax = speedMax ; };

	this.getRadiusMin = function() { return _radiusMin; };
	this.getRadiusMax = function() { return _radiusMax };
	this.getSpeedMin = function() { return _speedMin; };
	this.getSpeedMax = function() { return _speedMax; };

	this.update = function() {
		for(_i = _balls.length - 1; _i >= 0; _i--) {
			_balls[_i].update();
			verifyCollisionWithBorders(_balls[_i]);
		}
	};

	this.draw = function() {
		for(var i in _balls) {
			_balls[i].draw();
		}
	};

	// Ajoute une balle instanci�e al�atoirement
	var addRandomBall = function() {
		var ball = new Ball(self, canvas, context);
		ball.initRandom();
		_balls.push(ball);
	};

	// Ajoute ou retire des balles en fonction du nombre d�sir�e
	var updateBallsAmount = function() {
		if(_ballsAmount === 1) {
			_balls = [];
			addRandomBall();
			return;
		}

		if(_balls.length < _ballsAmount) {
			var ballsNeeded = _ballsAmount - _balls.length;
			for(var i = 0; i < ballsNeeded; i++) {
				addRandomBall();
			}
		}
		else if(_balls.length > _ballsAmount) {
			var ballsToRemove = _balls.length - _ballsAmount;
			for(var i = 0; i < ballsToRemove; i++) {
				_balls.pop();
			}
		}
	};

	// Supprime une balle et en cr�e une nouvelle si la balle n'est pas un duplicata
	var removeBall = function(id) {
		if(_balls[id].getIsOriginal()) {
			addRandomBall();
		}
		_balls.splice(id, 1);
	};

	// Duplique une balle en la divisant en deux
	var duplicateBall = function(ball) {
		var newRadius = ball.getRadius() / 2;
		if(newRadius < 0.5) {
			removeBall(_i);
			return;
		}

		ball.setRadius(newRadius);
			
		var duplicata = new Ball(self, canvas, context);
		var d = ball.getDirection(), newDir;

		if(d > 0) newDir = d - Math.PI;
		else if(d < 0) newDir = d + Math.PI;
		else newDir = 0;

		duplicata.setOldXY(ball.getOldX(), ball.getOldY());
		duplicata.setDirection(newDir);
		duplicata.setSpeed(ball.getSpeed());
		duplicata.setRadius(newRadius);
		duplicata.setColor(ball.getColor());
		duplicata.setIsOriginal(false);
		duplicata.updateOld();
		
		_balls.push(duplicata);
	};

	// Post-correction des rebonds sur les bordures
	var verifyCollisionWithBorders = function(ball) {
		var x = ball.getX(), y = ball.getY(), d = ball.getDirection(), s = ball.getSpeed(), r = ball.getRadius();

		if ((x > (canvas.width - r)) || (x < r)) {
			if(_duplicationMode) duplicateBall(ball);

			if(d === Math.PI)
				ball.setDirection(0);
			else if(d > 0)
				ball.setDirection(Math.PI - d);
			else if(d < 0)
				ball.setDirection(-Math.PI - d);
			else 
				ball.setDirection(Math.PI);

			ball.updateOld();
			return true;
		}
		else if ((y > (canvas.height - r)) || (y < r)) {
			if(_duplicationMode) duplicateBall(ball);

			ball.setDirection(-d);

			ball.updateOld();
			return true;
		}

		return false;
	};

	// Init
	updateBallsAmount();
}

/* RECTANGLE DE COLLISION */

// Objet de collision de boite AABB
function BoundaryAABB(x, y, w, h) {
	var self = this;
	this._x = x;
	this._y = y;
	this._w = w;
	this._h = h;

	// Dessine le rectangle sur "context"
	this.draw = function(context) {
		context.fillStyle = "#000000";
		context.strokeRect(this._x, this._y, this._w, this._h);
	};

	// Test si le rectangle contient le point de coordonn�es xy
	this.containsPoint = function(x, y) {
		return (
			x > this._x &&
			x < this._x + this._w &&
			y > this._y &&
			y < this._y + this._h
		);
	};

	// Test si le rectangle croise un rectangle donn�
	this.intersectsAABB = function(boundaryAABB) {
		return !(
			boundaryAABB._x + boundaryAABB._w <= this._x || // Gauche
			boundaryAABB._y + boundaryAABB._h <= this._y || // Haut
			boundaryAABB._x >= this._x + this._w || // Droite
			boundaryAABB._y >= this._y + this._h // Bas
		);
	};

	// Test si le rectangle croise un cercle donn�
	this.intersectsCircle = function(boundaryCircle) {
		return boundaryCircle.intersectsAABB(this);
	};
}

/* CERCLE DE COLLISION */

// Objet de collision de cercle
function BoundaryCircle(x, y, r) {
	var self = this;
	this._x = x;
	this._y = y;
	this._r = r;

	// Dessine le cercle sur "context"
	this.draw = function(context) {
		context.strokeStyle = "#000000";
		context.beginPath();
		context.arc(this._x, this._y, this._r, 0, Math.PI*2);
    	context.stroke();
		context.closePath();
	};

	// Test si le cercle contient le point de coordonn�es xy
	this.containsPoint = function(x, y) {
		var d = (x - this._x) * (x - this._x) + 
				(y - this._y) * (y - this._y);

		return (d < this._r * this._r);
	};

	// Test si le cercle croise un cercle donn�
	this.intersectsCircle = function(boundaryCircle) {
		var d = (boundaryCircle._x - this._x) * (boundaryCircle._x - this._x) + 
				(boundaryCircle._y - this._y) * (boundaryCircle._y - this._y);

		return (d < (boundaryCircle._r + this._r) * (boundaryCircle._r + this._r));
	};

	// Test si il est possible de projeter le centre du cercle sur un segment AB donn�
	var canProjectCenterOnSegment = function(aX, aY, bX, bY) {
		var acX = self._x - aX;
		var acY = self._y - aY;
		var abX = bX - aX;
		var abY = bY - aY;
		var bcX = self._x - bX;
		var bcY = self._y - bY;
		var s1 = (acX * abX) + (acY * abY);
		var s2 = (bcX * abX) + (bcY * abY);
		return !(s1 * s2 > 0);
	}

	// Test si le cercle croise un rectangle donn�
	this.intersectsAABB = function(boundaryAABB) {
		if(
			boundaryAABB._x + boundaryAABB._w <= this._x - this._r || // Gauche
			boundaryAABB._y + boundaryAABB._h <= this._y - this._r || // Haut
			boundaryAABB._x >= this._x + this._r || // Droite
			boundaryAABB._y >= this._y + this._r // Bas
		) return false;

		// Test d'un coin du rectangle pr�sent dans le cercle
		if(
			this.containsPoint(boundaryAABB._x, boundaryAABB._y) ||
			this.containsPoint(boundaryAABB._x + boundaryAABB._w, boundaryAABB._y) ||
			this.containsPoint(boundaryAABB._x, boundaryAABB._y + boundaryAABB._h) ||
			this.containsPoint(boundaryAABB._x + boundaryAABB._w, boundaryAABB._y + boundaryAABB._h)
		) return true;

		// Test du cercle contenu dans le rectangle
		if(boundaryAABB.containsPoint(this._x, this._y)) return true;

		// Test du cercle traversant un unique segment du rectangle
		var verticalProjection = canProjectCenterOnSegment(boundaryAABB._x, boundaryAABB._y, boundaryAABB._x, boundaryAABB._y + boundaryAABB._h);
		var horizontalProjection = canProjectCenterOnSegment(boundaryAABB._x, boundaryAABB._y, boundaryAABB._x + boundaryAABB._w, boundaryAABB._y);
		if(verticalProjection || horizontalProjection) return true;
		return true;
	};
}

/* QUADTREE */

// Objet de gestion des collisions
function QuadTree(boundaryAABB, maxObjects) {
	var _objects = [];
	var _nodes;

	var subdivide = function() {
		var halfWidth = boundaryAABB._w / 2;
		var halfHeight = boundaryAABB._h / 2;

		var _nodes = [];
		_nodes.push(new QuadTree(new BoundaryAABB(boundaryAABB._x, boundaryAABB._y, halfWidth, halfHeight), maxObjects));
		_nodes.push(new QuadTree(new BoundaryAABB(boundaryAABB._x + halfWidth, boundaryAABB._y, halfWidth, halfHeight), maxObjects));
		_nodes.push(new QuadTree(new BoundaryAABB(boundaryAABB._x, boundaryAABB._y + halfHeight, halfWidth, halfHeight), maxObjects));
		_nodes.push(new QuadTree(new BoundaryAABB(boundaryAABB._x+ halfWidth, boundaryAABB._y + halfHeight, halfWidth, halfHeight), maxObjects));
	};
}