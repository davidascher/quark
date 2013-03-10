// Pages -- {name: String}
Pages = new Meteor.Collection("pages");
Redirects = new Meteor.Collection("redirects");

// // Publish complete set of lists to all clients.
Meteor.publish('pages', function () {
  return Pages.find();
});
Meteor.publish('redirects', function () {
  return Redirects.find();
});
