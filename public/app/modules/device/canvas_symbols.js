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

      PANEL: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.GRID(center)
        ]);
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
      }

    }, function(memo, draw, key){
      memo[key] = function(_center, _scale){
        var item = draw(new paper.Point(0, 0), 50),
          symbol = new paper.Symbol(item),

          func = symbols[key] = function(center, scale){
            var placed = symbol.place(center);

            if (scale) {
              placed.scale(scale);
            }

            return placed;
          };

        item.remove();

        return func(_center, _scale);
      };
      return memo;
    }, {});

    return function(type, center){
      return (symbols.hasOwnProperty(type) ?
        symbols[type] :
        symbols.SQUARE
      )(center);
    };
  };
});
