// QUnit.autoStart = false;
function runTests() {
// QUnit.autoStart = false;
	// $("body").append('<div class="testbox"><div id="qunit"></div> <div id="qunit-fixture"></div></div>');

	$.getScript('/qunit-1.11.0.js', function(a) {
		QUnit.config['notrycatch'] = true;
		QUnit.init();
		$.getScript('/tests.js', function(a) {
			start();
		});
	});
}

