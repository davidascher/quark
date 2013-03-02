var require = __meteor_bootstrap__.require;
var fs = require('fs');
var path = require('path');
// if the database is empty on server start, create some sample data.
var bootstrap_data_path = './recipes';

Meteor.startup(function () {
  if (Pages.find().count() === 0) {
    var data = [
      {name: "Welcome",
       id:"Welcome",
       contents: [
         ["This is a first paragraph"],
         ["This is a second paragraph linking to [[Other page]]"],
         ["This is a third paragraph"]
       ]
      },
      {name: "Other page",
       id:"whatever",
       contents: [
         ["This is a first paragraph"],
         ["This is a second paragraph paragraph"],
         ["This is a third paragraph linking back to the [[Welcome]] page."]
       ]
      }
    ];
    // Redirects.insert({'old_name': 'xxx', 'new_name': 'xxy'})

    for (var i = 0; i < data.length; i++) {
      var timestamp = (new Date()).getTime();
      var list_id = Pages.insert({_id: data[i].id, name: data[i].name, mtime: timestamp});
      for (var j = 0; j < data[i].contents.length; j++) {
        Paras.insert({index: j, page: list_id, content: data[i].contents[j]})
      }
    }
    Meteor._debug("looking at " + bootstrap_data_path);
    // load recipes from disk
    if (fs.existsSync(bootstrap_data_path)) {
      Meteor._debug("exists!");
      var files = fs.readdirSync(bootstrap_data_path);
      Meteor._debug("files: ", files)
      Meteor._debug("files.length: ", files.length)
      for (var k = 0; k < files.length; k++) {
        var filepath = path.join(bootstrap_data_path, files[k]);
        Meteor._debug(k + ': ' + filepath);
        var stats = fs.statSync(filepath);
        if (stats.isFile(filepath)) {
          var page_name = path.basename(files[k], '.md');
          page_name = page_name.split('-').join(' ');
          Meteor._debug(k + ': ' + page_name);
          var contents = fs.readFileSync(filepath, 'utf8');
          var subparas = contents.split(/\n\n+/);
          var timestamp = (new Date()).getTime();
          var pageId = Pages.insert({name: page_name, mtime: timestamp});
          for (var j = 0; j < subparas.length; j++) {
            Paras.insert({index: j, page: pageId, content: [subparas[j]]})
          }
        }
      }
      Meteor._debug("Added " + files.length + " pages.");
    } else {
      Meteor._debug("directory doesn't exist");
    }
  }
});
