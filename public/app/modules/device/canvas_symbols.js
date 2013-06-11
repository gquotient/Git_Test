define(['underscore'], function(_){

  return function(paper){

    function pathsFromPoints(points, center){
      var paths = [];

      _.each(points, function(pts){

        if (pts.length === 2) {
          paths.push(new paper.Path.Line(
            center.add(pts[0]),
            center.add(pts[1])
          ));

        } else if (pts.length === 3) {
          paths.push(new paper.Path.Arc(
            center.add(pts[0]),
            center.add(pts[1]),
            center.add(pts[2])
          ));
        }
      });

      return paths;
    }

    var symbols = _.reduce({

      CIRCLE: function(center, size){
        var half = size / 2,

          path = new paper.Path.Circle(center, half);

        path.strokeColor = 'black';
        path.fillColor = 'white';

        return path;
      },

      SQUARE: function(center, size){
        var half = size / 2,

          path = new paper.Path.Rectangle(center.subtract(half), size);

        path.strokeColor = 'black';
        path.fillColor = 'white';

        return path;
      },

      DIVIDER: function(center, size){
        var half = size / 2,

          path = new paper.Path.Line(
            center.add(-half, half),
            center.add(half, -half)
          );

        path.strokeColor = 'black';

        return path;
      },

      AC: function(center, size){
        var half = size / 2,
          quarter = size / 4,

          path = new paper.Path(center.subtract(half, 0));

        path.curveBy([quarter, -half], [half, 0]);
        path.curveBy([quarter, half], [half, 0]);

        path.strokeColor = 'black';

        return path;
      },

      DC: function(center, size){
        var half = size / 2,
          quarter = size / 4,
          eighth = size / 8,

          group = new paper.Group(pathsFromPoints([
            [[-half, -eighth], [half, -eighth]],
            [[-half, eighth], [half, eighth]]
          ], center));

        group.lastChild.dashArray = [quarter, eighth];
        group.strokeColor = 'black';

        return group;
      },

      GRID: function(center, size){
        var half = size / 2,
          quarter = size / 4,

          group = new paper.Group(pathsFromPoints([
            [[-half, -quarter], [half, -quarter]],
            [[-half, 0], [half, 0]],
            [[-half, quarter], [half, quarter]],

            [[-quarter, -half], [-quarter, half]],
            [[0, -half], [0, half]],
            [[quarter, -half], [quarter, half]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      M: function(center, size){
        var half = size / 2,
          third = size / 3,

          group = new paper.Group(pathsFromPoints([
            [[-third, -half], [-third, half]],
            [[third, -half], [third, half]],
            [[-third, -half], [0, 0]],
            [[third, -half], [0, 0]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      CT: function(center, size){
        var half = size / 2,
          quarter = size / 4,

          group = new paper.Group(pathsFromPoints([
            [[0, 0], [0, -quarter]],
            [[0, 0], [-quarter, quarter], [-half, 0]],
            [[0, 0], [quarter, quarter], [half, 0]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      COILS: function(center, size){
        var half = size / 2,
          quarter = size / 4,
          eighth = size / 8,

          group = new paper.Group(pathsFromPoints([
            [[0, -half], [0, half]],

            [[-eighth * 3, -half], [-quarter, -half]],
            [[eighth * 3, -half], [quarter, -half]],
            [[-eighth * 3, half], [-quarter, half]],
            [[eighth * 3, half], [quarter, half]],

            [[-quarter, -half], [-eighth, -eighth * 3], [-quarter, -quarter]],
            [[quarter, -half], [eighth, -eighth * 3], [quarter, -quarter]],
            [[-quarter, -quarter], [-eighth, -eighth], [-quarter, 0]],
            [[quarter, -quarter], [eighth, -eighth], [quarter, 0]],
            [[-quarter, 0], [-eighth, eighth], [-quarter, quarter]],
            [[quarter, 0], [eighth, eighth], [quarter, quarter]],
            [[-quarter, quarter], [-eighth, eighth * 3], [-quarter, half]],
            [[quarter, quarter], [eighth, eighth * 3], [quarter, half]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      WYE: function(center, size){
        var half = size / 2,
          third = size / 3,
          sixth = size / 6,

          group = new paper.Group(pathsFromPoints([
            [[-third, -half], [0, -sixth]],
            [[third, -half], [0, -sixth]],
            [[0, half], [0, -sixth]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      DOWN: function(center, size){
        var half = size / 2,
          third = size / 3,
          sixth = size / 6,

          group = new paper.Group(pathsFromPoints([
            [[0, -half], [0, sixth]],
            [[-third, sixth], [third, sixth]],
            [[-third, sixth], [0, half]],
            [[third, sixth], [0, half]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      COMBINE: function(center, size){
        var half = size / 2,
          quarter = size / 4,
          fourteenth = size / 14,

          group = new paper.Group(pathsFromPoints([
            [[-half, -half], [-quarter, -half]],
            [[-half, -fourteenth * 5], [-quarter, -fourteenth * 5]],
            [[-half, -fourteenth * 3], [-quarter, -fourteenth * 3]],
            [[-half, -fourteenth], [-quarter, -fourteenth]],
            [[-half, fourteenth], [-quarter, fourteenth]],
            [[-half, fourteenth * 3], [-quarter, fourteenth * 3]],
            [[-half, fourteenth * 5], [-quarter, fourteenth * 5]],
            [[-half, half], [-quarter, half]],

            [[-quarter, -half], [0, 0]],
            [[-quarter, -fourteenth * 5], [0, 0]],
            [[-quarter, -fourteenth * 3], [0, 0]],
            [[-quarter, -fourteenth], [0, 0]],
            [[-quarter, fourteenth], [0, 0]],
            [[-quarter, fourteenth * 3], [0, 0]],
            [[-quarter, fourteenth * 5], [0, 0]],
            [[-quarter, half], [0, 0]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      V: function(center, size){
        var half = size / 2,

          group = new paper.Group(pathsFromPoints([
            [[-half, -half], [0, 0]],
            [[half, -half], [0, 0]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      DC_BUS: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.DC(center, 2 / 3)
        ]);
      },

      AC_BUS: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.AC(center, 2 / 3)
        ]);
      },

      INVERTER: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.DIVIDER(center),
          symbols.DC(center.subtract(size / 4), 1 / 3),
          symbols.AC(center.add(size / 4), 1 / 3)
        ]);
      },

      METER: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.CIRCLE(center.subtract(0, size / 9), 4 / 9),
          symbols.M(center.subtract(0, size / 9), 1 / 4),
          symbols.CT(center.add(0, size * 2 / 9), 4 / 9)
        ]);
      },

      TRANSFORMER: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.COILS(center, 2 / 3)
        ]);
      },

      INTERCONNECT: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.WYE(center, 2 / 3)
        ]);
      },

      LOAD: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.DOWN(center, 2 / 3)
        ]);
      },

      ARRAY: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.GRID(center)
        ]);
      },

      RECOMBINER: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.COMBINE(center.subtract(size / 4, 0), 1, 2 / 3),
          symbols.CIRCLE(center, 1 / 4)
        ]);
      },

      COMBINER: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.COMBINE(center.subtract(size / 4, 0), 1, 2 / 3),
          symbols.CIRCLE(center, 1 / 4)
        ]);
      },

      STRING: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.V(center.subtract(0, size / 4)),
          symbols.V(center.subtract(0, size / 8)),
          symbols.V(center),
          symbols.V(center.add(0, size / 8))
        ]);
      },

      PANEL: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.V(center.subtract(0, size / 4))
        ]);
      }

    }, function(memo, draw, key){
      memo[key] = function(){
        var item = draw(new paper.Point(0, 0), 50),
          symbol = new paper.Symbol(item),

          func = symbols[key] = function(center){
            var placed = symbol.place(center);

            if (arguments.length > 1) {
              placed.scale.apply(placed, Array.prototype.slice.call(arguments, 1));
            }

            return placed;
          };

        item.remove();

        return func.apply(this, arguments);
      };
      return memo;
    }, {});

    return function(type, center){
      return (_.has(symbols, type) ?
        symbols[type] :
        symbols.SQUARE
      )(center);
    };
  };
});
