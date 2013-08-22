define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!project/templates/adminList',
  'hbs!project/templates/adminListItem',
  'hbs!project/templates/adminDetail',
  'hbs!project/templates/adminGeosearch'
], function(
  $,
  _,
  Backbone,
  Marionette,

  adminListTemplate,
  adminListItemTemplate,
  adminDetailTemplate,
  adminGeosearchTemplate
){
  var views = {};

  views.AdminListItem = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    },

    triggers: {
      'click': 'show:detail',
      'click button.model': 'editor',
      'click button.delete': 'delete'
    },

    onEditor: function(){
      Backbone.history.navigate('/admin/projects/' + this.model.id + '/power', true);
    },

    onDelete: function(){
      if (window.confirm('Are you sure you want to delete this project?')) {
        this.model.destroy({
          wait: true
        });
      }
    }
  });

  views.AdminList = Marionette.CompositeView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminListTemplate
    },

    itemView: views.AdminListItem,
    itemViewContainer: 'tbody'
  });

  views.AdminDetail = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminDetailTemplate
    },

    schema: {
      display_name: {
        el: '#name',
        validate: function(value){
          return value && value !== '';
        }
      },

      site_label: {
        el: '#site_label',
        editable: false,
        parse: function(value){
          return value.toUpperCase().replace(/[^A-Z]+/g, '');
        },
        validate: function(value){
          return (/^[A-Z]{3,}$/).test(value);
        }
      },

      address: {
        el: '#address'
      },

      city: {
        el: '#city'
      },

      state: {
        el: '#state'
      },

      zipcode: {
        el: '#zipcode'
      },

      description: {
        el: '#description'
      },

      latitude: {
        el: '#latitude',
        parse: function(value){
          return parseFloat(value);
        },
        validate: function(value){
          return !isNaN(value);
        }
      },

      longitude: {
        el: '#longitude',
        parse: function(value){
          return parseFloat(value);
        },
        validate: function(value){
          return !isNaN(value);
        }
      },

      elevation: {
        el: '#elevation',
        parse: function(value){
          return value !== '' ? parseFloat(value) : 0;
        },
        validate: function(value){
          return !isNaN(value);
        }
      }
    },

    onShow: function(){
      var events = {};

      this.ui = {};

      _.each(this.schema, function(obj, key){
        var $el = this.$(obj.el);

        if (!$el) { return; }

        if (obj.editable === false && !this.model.isNew()) {
          $el.attr('disabled', true);
        }

        events['blur ' + obj.el] = function(){
          var value = $el.val().trim();

          if (obj.parse) {
            value = obj.parse.call(this, value);
          }

          if (!obj.validate || obj.validate.call(this, value)) {
            this.model.set(key, value);
          } else {
            $el.addClass('invalid');
          }
        };

        this.ui[key] = $el;
      }, this);

      this.delegateEvents(events);
    },

    modelEvents: {
      'change': 'update',
      'change:display_name': 'generateLabel',
      'destroy': 'close'
    },

    update: function(){
      _.each(this.model.changed, function(value, key){
        if (_.has(this.ui, key)) {
          this.ui[key].val(value).removeClass('invalid');
        }
      }, this);
    },

    generateLabel: function(){
      if (this.ui.site_label.val() !== '') { return; }

      var parts = this.model.get('display_name').split(' ');

      this.ui.site_label.val(_.reduce(parts, function(memo, part){
        if (memo.length < 8) {
          memo += part.toUpperCase().replace(/[^A-Z]+/g, '');
        }

        return memo;
      }, ''));
    }
  });

  views.AdminGeosearch = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: adminGeosearchTemplate
    },

    attributes: {
      id: 'geosearch'
    },

    ui: {
      input: 'input'
    },

    events: {
      'keyup': function(e){
        switch (e.which) {
        case 13:
          this.geosearch(this.ui.input.val());
          break;

        case 27:
          this.ui.input.val('');
          this.ui.input.blur();
          break;
        }
      },

      'mousedown input': function(e){
        e.stopPropagation();
      }
    },

    geosearch: _.throttle(function(query){
      var that = this;

      $.ajax('http://nominatim.openstreetmap.org/search', {
        dataType: 'json',
        data: {
          q: query,
          limit: 1,
          format: 'json',
          addressdetails: true
        },
        timeout: 3000
      }).done(function(data){
        if (data.length > 0) {
          that.triggerMethod('found', data[0]);
        } else {
          window.alert('No address matches your query');
        }
      }).fail(function(jqxhr, stat){
        window.alert('Address search failed (' + stat + ')');
      });
    }, 1000)
  });

  return views;
});
