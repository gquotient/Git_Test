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

    templateHelpers: function(){
      return {
        locked: this.model.isLocked()
      };
    },

    ui: {
      lock: '.lock-icon',
      commission: 'button.commission',
      del: 'button.delete'
    },

    triggers: {
      'click': 'show:detail',
      'click .lock-icon': 'unlock',
      'click button.commission': 'commission',
      'click button.model': 'editor',
      'click button.delete': 'delete'
    },

    modelEvents: {
      'change:display_name': 'render',
      'change:editor': 'render'
    },

    onRender: function(){
      var editable = this.model.isEditable(),
        disabled = !editable && this.model.isLocked();

      this.ui.lock.toggleClass('active', editable);
      this.ui.commission.attr('disabled', disabled);
      this.ui.del.attr('disabled', disabled);
    },

    onUnlock: function(){
      if (this.model.isEditable()) {
        this.model.setLock(false);
      }
    },

    onCommission: function(){
      this.model.commission();
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
    itemViewContainer: 'tbody',

    setActive: function(model){
      var view = model && this.children.findByModel(model);

      this.$('tr.active').removeClass('active');

      if (view) {
        view.$el.addClass('active');
      }
    }
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
        },
        success: function(value){
          var label;

          if (this.model.isNew() && this.ui.site_label.val() === '') {
            label = _.reduce(value.split(' '), function(memo, word){
              if (memo.length < 8) {
                memo += word.toUpperCase().replace(/[^A-Z]+/g, '');
              }
              return memo;
            }, '');

            this.ui.site_label.val(label).removeClass('invalid');
          }
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
      var locked = this.model.isLocked() && !this.model.isEditable(),
        existing = !this.model.isNew(),
        events = {};

      this.ui = {};
      this.changed = {};

      _.each(this.schema, function(obj, key){
        var $el = this.$(obj.el);

        // Skip if no matching element.
        if (!$el) { return; }

        // Disable the element if not editable.
        if (locked || (existing && obj.editable === false)) {
          $el.attr('disabled', true);

        // Otherwise add a validation listener.
        } else {
          events['blur ' + obj.el] = function(){
            var value = $el.val().trim();

            if (obj.parse) {
              value = obj.parse.call(this, value);
            }

            if (obj.validate && !obj.validate.call(this, value)) {
              $el.addClass('invalid');

              if (obj.error) {
                obj.error.call(this, value);
              }
            } else {
              this.changed[key] = value;

              if (obj.success) {
                obj.success.call(this, value);
              }
            }
          };
        }

        this.ui[key] = $el;
      }, this);

      this.delegateEvents(events);
    },

    isValid: function(){
      this.$el.find('input textarea').blur();
      return !this.$el.find('.invalid').length;
    },

    modelEvents: {
      'change': 'updateValues',
      'destroy': 'close'
    },

    updateValues: function(){
      _.each(this.model.changed, function(value, key){
        if (_.has(this.ui, key)) {
          this.ui[key].val(value).removeClass('invalid');
        }
      }, this);
    }
  });

  views.AdminGeosearch = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: adminGeosearchTemplate
    },

    className: 'geosearch',

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
