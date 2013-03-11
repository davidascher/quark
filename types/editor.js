if (Meteor.isClient) {

  (function() {
    var Editor = function() {
      this.visible = false;
    }
    
    Editor.prototype._setup = function(initialValue, mode, pageEl, onUpdateCB) {
      var self = this;
      self.mode = mode;
      self.persistOnHide = false;
      self.pageEl = pageEl;
      self.onUpdateCB = onUpdateCB;
      self._editor = CodeMirror(function(elt) {
        self.visible = true;
        $(".modal-body").append(elt);
        $(".modal").modal();
      }, {value: initialValue, mode: mode});
      self._editor.on("change", function(instance, changeObj) {
        // onUpdateCB(instance.getValue())
      })
      $(".modal").on("hide", function(instance) {
        if (self.persistOnHide) {
          persistPageByPageElement(self.pageEl);
        } else {
          Quark.editor.revertchanges();
        }
      })
    }

    Editor.prototype.show = function(initialValue, mode, pageEl, onUpdateCB) {
      this._originalValue = initialValue;
      if (!this._editor) {
        this._setup(initialValue, mode, pageEl, onUpdateCB);
      } else {
        $(".modal").modal("show");
      }
    }

    Editor.prototype.savechanges = function() {
      this.persistOnHide = true;
    }

    Editor.prototype.revertchanges = function() {
      this._editor.setValue(this._originalValue);
      this.onUpdateCB(this._originalValue)
    }

    Editor.prototype.editpage = function(chunkid) {
      var page = Template.main.topmostpage();
      var json = JSON.stringify(page.contents, undefined, 2);
      this._editor.setValue(json);
      $("#editorlabel").text("Editing page")
    }

    Editor.prototype.editchunk = function(chunkid) {
      var chunk = $("[guid=\"" + chunkid + "\"]");
      var json = chunk.attr("data-json");
      console.log("json", json);
      var obj = JSON.parse(json);
      console.log("obj", obj);
      this._editor.setValue(obj.value);
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
        Quark.editor.editchunk(chunkid);
      }
    })

    Template.editor.editables = function() {
      var parts = [{editor: 'editpage', label: 'Edit page'}];
      var page = Template.main.topmostpage();
      if (!page) return;
      _.each(page.contents, function(chunk, index) {
        parts.push({'editor': 'editchunk', 'chunkid': chunk.guid, 'label': 'Edit chunk ' + index})
      })
      return parts;
    }

    Template.editor.visible = function() {
      return Quark.editor.visible ? "" : "hide";
    }
  })();
}

