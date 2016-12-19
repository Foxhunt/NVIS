$('document').ready(() => {

	$.post('/modus', data => {
		$('#' + data.modus).prop('checked', true);
	});

	$('#submitModus').on('click', () => {

		let params = {
			modus: $('input[name=modus]:checked').val()
		};

		console.log(params);

		$.post('/modus', params, data => {
			$('#' + data.modus).prop('checked', true);
		});

	});

});
