$('document').ready(() => {

	//hole aktuellen modus vom Server und selektiere ihn
	$.get('/modus/get', data => {
		$('#' + data.modus).prop('checked', true);
		$('#' + data.modus + "Form").css('display', 'block');
	});


});
