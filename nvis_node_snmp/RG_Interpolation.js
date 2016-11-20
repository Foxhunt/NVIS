var pi2 = Math.PI*2;

function rgbFromPercent(t){

	var rad = (t/100)*(pi2/4);

	var r = 255 * Math.sin(rad);
	var g = 255 * Math.cos(rad);
	var b = 0;

	var n = 255/(r > g ? r : g);

	r = r*n;
	g = g*n;
	b = b*n;

	var out = `${r}, ${g}, ${b}`;

	return out;
}

console.log(spline(50));
