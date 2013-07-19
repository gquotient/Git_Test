define([
  'jquery',
  'handsontable'
], function(
  $,
  Handsontable
){
  var DropdownCell = {},
    clonableITEM = document.createElement('LI');

  clonableITEM.appendChild(document.createElement('A'));
  clonableITEM.firstChild.href = '#';

  function Dropdown(instance){
    this.instance = instance;
    this.items = [];
    this.createElements();
    this.bindEvents();
  }

  Dropdown.prototype.createElements = function(){
    var that = this;

    this.UL = document.createElement('UL');
    this.UL.className = 'handsontableDropdown';
    this.ulStyle = this.UL.style;
    this.$ul = $(this.UL);

    this.instance.textEditor.TEXTAREA_PARENT.appendChild(this.UL);

    Handsontable.PluginHooks.add('afterRender', function(){
      that.instance.registerTimeout('refresh_dropdown', function(){
        that.refresh();
      }, 0);
    });
  };

  Dropdown.prototype.bindEvents = function(){
    var that = this;

    this.$ul.off('.dropdown').on('click.dropdown', function(e){
      var $target = $(e.target);

      if ($target) {
        e.preventDefault();

        that.instance.textEditor.$textarea.val($target.text());
        that.finishEditing(false);
      }
    });
  };

  Dropdown.prototype.bindTemporaryEvents = function(td, row, col, prop, value, cellProperties){
    this.row = row;
    this.col = col;
    this.source = cellProperties.source;

    this.lookup();
  };

  Dropdown.prototype.lookup = function(){
    var row, items;

    if ($.isFunction(this.source)) {
      row = this.instance.getDataAtRow(this.row);
      items = this.source(row, $.proxy(this.process, this));
    } else {
      items = this.source;
    }

    if (items) {
      this.process(items);
    }
  };

  Dropdown.prototype.process = function(items){
    this.items = items;
    this.refresh();
  };

  Dropdown.prototype.refresh = function(){
    var $td, that = this;

    this.instance.view.wt.wtDom.empty(this.UL);

    this.TD = this.instance.getCell(this.row, this.col);
    $td = $(this.TD);

    this.ulStyle.top = $td.height() + 'px';
    this.ulStyle.width = $td.width() + 6 + 'px';

    $.each(this.items, function(index, item){
      var LI = clonableITEM.cloneNode(true);

      LI.firstChild.appendChild(document.createTextNode(item));
      that.UL.appendChild(LI);
    });
  };

  Dropdown.prototype.finishEditing = function(isCancelled){
    this.instance.textEditor.finishEditing(isCancelled);
  };

  DropdownCell.editor = function(instance, td, row, col, prop, value, cellProperties){
    Handsontable.TextEditor.apply(this, arguments);

    if (!instance.dropdown) {
      instance.dropdown = new Dropdown(instance);
    }
    instance.dropdown.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
    return function(isCancelled){
      instance.dropdown.finishEditing(isCancelled);
    };
  };

  DropdownCell.renderer = Handsontable.AutocompleteRenderer;
  Handsontable.cellTypes.dropdown = DropdownCell;
  Handsontable.cellLookup.editor.dropdown = DropdownCell.editor;

  return DropdownCell;
});
