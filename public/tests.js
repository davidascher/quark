test( "a basic test example", function() {
  var value = "hello";
  equal( value, "hello", "We expect value to be hello" );
});

// var link.on("click", function() {
// });
test( "navigation", function() {
console.log("$", $);
	 try {
		var link = $('a[href="/Caramel Apple Cake"]');
		console.log(link);

		 equal( 0, 0, "Zero; equal succeeds" );
		// link.trigger('click');
	} catch (e) {
		console.log(e);
	}

});

