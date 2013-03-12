if (Meteor.isClient) {

  (function() {
    var Editor = function() {
      this.visible = false;
    }
    Template.page.preserve([".modal"]);

    Editor.prototype._setup = function(initialValue, mode, pageEl) {
      var self = this;
      self.mode = mode;
      self.persistOnHide = false;
      self.pageEl = pageEl;
      self._editor = CodeMirror(function(elt) {
        self.visible = true;
        $(".modal-body").html(elt);
      }, {value: initialValue, mode: mode});
      self._editor.on("change", function(instance, changeObj) {
        if (self.onUpdateCB) 
          self.onUpdateCB(instance.getValue())
      })
      $(".modal").on("hidden", function(instance) {
        if (self.persistOnHide) {
          persistPageByPageElement(self.pageEl);
        } else {
          Quark.editor.revertchanges();
        }
      })
    }

    Editor.prototype.show = function(initialValue, mode, pageEl) {
      this._originalValue = initialValue;
      this._setup(initialValue, mode, pageEl);
      $(".modal").modal("show");
    }

    Editor.prototype.savechanges = function() {
      this.persistOnHide = true;
      $(".modal").modal("hide");
    }

    Editor.prototype.revertchanges = function() {
      this._editor.setValue(this._originalValue);
      this.onUpdateCB(this._originalValue)
    }

    Editor.prototype.onPageEdit = function(newjson) {
      this.pageElt.attr("data-json", newjson);
      // var page = Template.main.topmostpage();
      // page.contents = JSON.parse(newjson);
      // Pages.update(page._id, {$set: {contents: JSON.parse(newjson)}});
    }

    Editor.prototype.editchunk = function(chunkid, pageElt) {
      if (!chunkid) { //just pick the first one
        chunkid = $(".chunk").attr("guid");
      }
      var chunk = $("[guid=\"" + chunkid + "\"]");
      var json = chunk.attr("data-json");
      var obj = JSON.parse(json);
      this.onUpdateCB = null; // otherwise new text will be sent to old plugin.
      this.show(obj.value, TYPES[obj.type].editorMode, pageElt)
      this._editor.setValue(obj.value);
      this.onUpdateCB = function (newcontents) {
        TYPES[obj.type].onCodeChange(chunkid, newcontents)
      }
      $("#editorlabel").text("Editing " + obj.type + " chunk")
    }

    if (typeof(Quark) == 'undefined') Quark = {};
    Quark.editor = new Editor();

    Template.editor.events({
      'click .savechanges': function(event, tmpl) {
        Session.set("editing_code", false);
        Quark.editor.savechanges();
      },
      'click .revertchanges': function(event, tmpl) {
        Quark.editor.revertchanges();
      },
      'click .editpage': function(event, tmpl) {
        Quark.editor.editpage();
      },
      'click .editchunk': function(event, tmpl) {
        var chunkid = $(event.target.parentNode).attr('chunkid');
        var pageElt = $(".page");
        Quark.editor.editchunk(chunkid, pageElt);
      }
    })

    Template.editor.editables = function() {
      var parts = [];
      var page = Template.main.topmostpage();
      if (!page) return;
      _.each(page.contents, function(chunk, index) {
        parts.push({'editor': 'editchunk', 'chunkid': chunk.guid, 'label': 'Edit ' + chunk.type +' chunk (' + index + ')'})
      })
      return parts;
    }

    Template.editor.visible = function() {
      return Quark.editor.visible ? "" : "hide";
    }

    Template.page.events({
      'click .edit': function(event, tmpl) {
        Quark.editor.editchunk();
      }
    })
  })();
}

