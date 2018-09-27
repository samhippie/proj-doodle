window.onload = () => {
	const inCanvas = document.getElementById("input-canvas");
	const outCanvas = document.getElementById("output-canvas");

	const xTrans = document.getElementById("xTrans");
	const yTrans = document.getElementById("yTrans");
	const apply = document.getElementById("trans-submit");
	const clear = document.getElementById("clear");


	const projector = new Projector(inCanvas, outCanvas);

	inCanvas.onmousedown = (e) => projector.startStroke(e);
	inCanvas.onmousemove = (e) => projector.continueStroke(e);
	inCanvas.onmouseup = (e) => projector.endStroke(e);

	apply.onclick = () => {
		projector.setTransform(xTrans.value, yTrans.value);
	}

	clear.onclick = () => projector.clear();

	const inputSubmit = (event) => {
		if(event.which == 13) {
			apply.onclick();
			return false;
		}
		return true;
	}
	xTrans.onkeydown = inputSubmit;
	yTrans.onkeydown = inputSubmit;
}

class Projector {
	constructor(inCanvas, outCanvas) {
		//DOM elements
		this.inCanvas = inCanvas;
		this.outCanvas = outCanvas;
		this.width = inCanvas.width;
		this.height = inCanvas.height;

		//brush info
		this.brush = {
			size: 10,
			color: '#000000',
		}

		//internal data
		this.strokes = [];
		this.inBuf = Array.from({length: this.width * this.height}, 
			() => 'white');
		this.outBuf = Array.from({length: this.width * this. height}, 
			() => 'white');

		this.transform = (x,y) => [x,y]
	}

	setTransform(xStr, yStr) {
		this.transform = (x,y) => [eval(xStr), eval(yStr)];
		this.drawOutput();
	}

	startStroke(event) {
		if(!(event.buttons & 1)) return;
		const rect = this.inCanvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		//init a new stroke
		const stroke = {
			size: this.brush.size,
			color: this.brush.color,
			points: [[x,y]],
		}
		this.strokes.push(stroke);

		this.drawInput();
		this.drawOutput();
	}

	continueStroke(event) {
		if(!(event.buttons & 1)) return;
		const rect = this.inCanvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		//add current location to stroke
		this.strokes[this.strokes.length-1].points.push([x,y]);

		this.drawInput();
		this.drawOutput();
	}

	endStroke(event) {
		const rect = this.inCanvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		
		//also add current location to stroke
		this.strokes[this.strokes.length-1].points.push([x,y]);

		this.drawInput();
		this.drawOutput();
	}

	drawInput() {
		//be lazy and only draw the last stroke
		if(this.strokes.length === 0) return;

		const stroke = this.strokes[this.strokes.length - 1];
		if(stroke.points.length === 0) return;

		const ctx = this.inCanvas.getContext('2d');
		ctx.lineWidth = stroke.size;
		ctx.strokeStyle = stroke.color;
		ctx.beginPath();
		//start with first point, then add each point in order
		ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
		for(const pt of stroke.points) {
			ctx.lineTo(pt[0], pt[1]);
		}
		ctx.stroke();
	}

	drawOutput() {
		//maps x,y from canvas to [-1,1]^2, flipping y
		const normalize = (x,y) => {
			return [
				2 * x / this.width - 1,
				-1 * (2 * y / this.height - 1),
			];
		}
		//maps x,y back to canvas from [-1,1]^2, unflipping y
		const denormalize = (x,y) => {
			return [
				(x + 1) * this.width / 2,
				((-1 * y) + 1) * this.height / 2,
			];
		}
		//combines this.transform with norm/denorm
		//so user gets [-1,1], but canvas code is unchanged
		const nTrans = (x,y) => 
			denormalize(...this.transform(...normalize(x,y)));

		const ctx = this.outCanvas.getContext('2d');
		ctx.clearRect(0, 0, this.width, this.height);

		//can't be lazy, have to draw every path
		for(const stroke of this.strokes) {
			ctx.lineWidth = stroke.size;
			ctx.strokeStyle = stroke.color;
			ctx.beginPath();
			//start with first points, then add each point in order
			//making sure to transform each point
			ctx.moveTo(...nTrans(...stroke.points[0]));
			for(const pt of stroke.points) {
				ctx.lineTo(...nTrans(...pt));
			}
			ctx.stroke();
		}
	}

	clear() {
		this.strokes = [];
		this.drawOutput();
		//have to clear input manually
		const ctx = this.inCanvas.getContext('2d');
		ctx.clearRect(0, 0, this.width, this.height);
	}
}

