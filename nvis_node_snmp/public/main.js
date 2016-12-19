$('document').ready(() => {

	$.get('/modus/get', data => {
		$('#' + data.modus).prop('checked', true);
	});

});
