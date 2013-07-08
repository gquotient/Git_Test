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

      SQUARE: function(center, size){
        var half = size / 2,

          path = new paper.Path.Rectangle(center.subtract(half), size);

        path.strokeColor = 'black';
        path.fillColor = 'white';

        return path;
      },

      LINE: function(center, size){
        var half = size / 2,

          path = new paper.Path.Line(
            center.subtract(half, 0),
            center.add(half, 0)
          );

        path.strokeColor = 'black';
        path.fillColor = 'white';

        return path;
      },

      CIRCLE: function(center, size){
        var half = size / 2,

          path = new paper.Path.Circle(center, half);

        path.strokeColor = 'black';
        path.fillColor = 'white';

        return path;
      },



      _DIVIDER: function(center, size){
        var half = size / 2,

          path = new paper.Path.Line(
            center.add(-half, half),
            center.add(half, -half)
          );

        path.strokeColor = 'black';

        return path;
      },

      _AC: function(center, size){
        var half = size / 2,
          quarter = size / 4,

          path = new paper.Path(center.subtract(half, 0));

        path.curveBy([quarter, -half], [half, 0]);
        path.curveBy([quarter, half], [half, 0]);

        path.strokeColor = 'black';

        return path;
      },

      _DC: function(center, size){
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

      _CT: function(center, size){
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

      _M: function(center, size){
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

      _V: function(center, size){
        var half = size / 2,

          group = new paper.Group(pathsFromPoints([
            [[-half, -half], [0, 0]],
            [[half, -half], [0, 0]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      _T: function(center, size){
        var half = size / 2,

          group = new paper.Group(pathsFromPoints([
            [[-half, -half], [half, -half]],
            [[0, -half], [0, half]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      _PYRA: function(center, size){
        var half = size / 2,
          quarter = size / 4,
          eighth = size / 8,

          group = new paper.Group(pathsFromPoints([
            [[-quarter, 0], [0, -quarter], [quarter, 0]],

            [[-quarter, 0], [quarter, 0]],
            [[-half, eighth], [half, eighth]],
            [[-half, quarter], [half, quarter]],

            [[-quarter, 0], [-quarter, eighth]],
            [[quarter, 0], [quarter, eighth]],
            [[-half, eighth], [-half, quarter]],
            [[half, eighth], [half, quarter]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      _GILL: function(center, size){
        var half = size / 2,
          third = size / 3,
          quarter = size / 4,
          sixth = size / 6,

          group = new paper.Group(pathsFromPoints([
            [[-quarter, -third], [quarter, -third]],
            [[-half, -sixth], [half, -sixth]],
            [[-half, 0], [half, 0]],
            [[-half, sixth], [half, sixth]],
            [[-half, third], [half, third]],
            [[-half, half], [half, half]],

            [[-quarter, -third], [-half, -sixth]],
            [[quarter, -third], [half, -sixth]],
            [[-quarter, -sixth], [-half, 0]],
            [[quarter, -sixth], [half, 0]],
            [[-quarter, 0], [-half, sixth]],
            [[quarter, 0], [half, sixth]],
            [[-quarter, sixth], [-half, third]],
            [[quarter, sixth], [half, third]],
            [[-quarter, third], [-half, half]],
            [[quarter, third], [half, half]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      _ANEM: function(center, size){
        var half = size / 2,
          quarter = size / 4,
          eighth = size / 8,

          group = new paper.Group(pathsFromPoints([
            [[-quarter, -quarter], [quarter, -quarter]],

            [[-half, -quarter], [-eighth * 3, -eighth * 3], [-quarter, -quarter]],
            [[-half, -quarter], [-eighth * 3, -eighth], [-quarter, -quarter]],
            [[half, -quarter], [eighth * 3, -eighth * 3], [quarter, -quarter]],
            [[half, -quarter], [eighth * 3, -eighth], [quarter, -quarter]],

            [[0, -quarter], [0, half]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      _VANE: function(center, size){
        var half = size / 2,
          quarter = size / 4,
          eighth = size / 8,

          group = new paper.Group(pathsFromPoints([
            [[-half, 0], [-eighth * 3, -eighth]],
            [[-half, 0], [-eighth * 3, eighth]],
            [[-eighth * 3, -eighth], [-eighth * 3, eighth]],

            [[-eighth * 3, 0], [quarter, 0]],

            [[quarter, 0], [eighth * 3, -eighth * 3]],
            [[quarter, 0], [eighth * 3, eighth * 3]],
            [[eighth * 3, -eighth * 3], [half, -eighth * 3]],
            [[eighth * 3, eighth * 3], [half, eighth * 3]],
            [[half, -eighth * 3], [half, eighth * 3]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      _TIP: function(center, size){
        var half = size / 2,
          quarter = size / 4,
          eighth = size / 8,

          group = new paper.Group(pathsFromPoints([
            [[-eighth * 3, -half], [-eighth * 3, -quarter]],
            [[eighth * 3, -half], [eighth * 3, -quarter]],
            [[-eighth * 3, -quarter], [0, eighth]],
            [[eighth * 3, -quarter], [0, eighth]],

            [[-quarter, eighth * 3], [quarter, eighth]],

            [[0, quarter], [-eighth, eighth * 3]],
            [[0, quarter], [eighth, eighth * 3]],
            [[-eighth, eighth * 3], [eighth, eighth * 3]]
          ], center));

        group.strokeColor = 'black';

        return group;
      },

      _WYE: function(center, size){
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

      _DOWN: function(center, size){
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

      _GRID: function(center, size){
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

      _COMBINE: function(center, size){
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

      _COILS: function(center, size){
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



      DSS: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center)
        ]);
      },

      DSC: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.SQUARE(center, 1 / 2, 2 / 3),
          symbols.SQUARE(center.subtract(0, size / 12), 1 / 3),
          symbols.LINE(center.add(size / 24, size / 5), 1 / 4)
        ]);
      },

      ESI: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center)
        ]);
      },

      IRRA: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._PYRA(center.subtract(size / 16), 2 / 3).rotate(-45)
        ]);
      },

      IRRZ: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._PYRA(center, 2 / 3)
        ]);
      },

      TMPC: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.CIRCLE(center, 1 / 2),
          symbols._T(center.add(0, size / 32), 1 / 4)
        ]);
      },

      TMPA: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._GILL(center, 2 / 3)
        ]);
      },

      WSPD: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._ANEM(center, 2 / 3)
        ]);
      },

      WDIR: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._VANE(center, 2 / 3)
        ]);
      },

      BARO: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center)
        ]);
      },

      RAIN: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._TIP(center, 2 / 3)
        ]);
      },



      INV: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._DIVIDER(center),
          symbols._DC(center.subtract(size / 4), 1 / 3),
          symbols._AC(center.add(size / 4), 1 / 3)
        ]);
      },

      RM: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols.CIRCLE(center.subtract(0, size / 9), 4 / 9),
          symbols._M(center.subtract(0, size / 9), 1 / 4),
          symbols._CT(center.add(0, size * 2 / 9), 4 / 9)
        ]);
      },

      LD: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._DOWN(center, 2 / 3)
        ]);
      },

      ACB: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._AC(center, 2 / 3)
        ]);
      },

      XFR: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._COILS(center, 2 / 3)
        ]);
      },

      IC: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._WYE(center, 2 / 3)
        ]);
      },

      DCB: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._DC(center, 2 / 3)
        ]);
      },

      APH: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._GRID(center)
        ]);
      },

      RCB: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._COMBINE(center.subtract(size / 4, 0), 1, 2 / 3),
          symbols.CIRCLE(center, 1 / 4)
        ]);
      },

      CMB: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._COMBINE(center.subtract(size / 4, 0), 1, 2 / 3),
          symbols.CIRCLE(center, 1 / 4)
        ]);
      },

      S: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._V(center.subtract(0, size / 4)),
          symbols._V(center.subtract(0, size / 8)),
          symbols._V(center),
          symbols._V(center.add(0, size / 8))
        ]);
      },

      P: function(center, size){
        return new paper.Group([
          symbols.SQUARE(center),
          symbols._V(center.subtract(0, size / 4))
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
