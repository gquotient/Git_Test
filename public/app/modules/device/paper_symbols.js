define([
  'underscore',
  'paper'
], function(
  _,
  paperDoNotUse
){
  var paper = window.paper;

  var symbols = _.reduce({

      circle: function(center, size){
        var path = new paper.Path.Circle(center, size / 2);

        path.strokeColor = 'black';
        path.fillColor = 'white';

        return path;
      },

      square: function(center, size){
        var path = new paper.Path.Rectangle(center.subtract(size / 2), size);

        path.strokeColor = 'black';
        path.fillColor = 'white';

        return path;
      },

      divider: function(center, size){
        var path, dx, dy;

        dx = dy = size / 2;

        path = new paper.Path.Line(center.add(-dx, dy), center.add(dx, -dy));
        path.strokeColor = 'black';

        return path;
      },

      ac: function(center, size){
        var path, dx, dy;

        dx = size / 4;
        dy = size / 2;

        path = new paper.Path(center.subtract(size / 2, 0));
        path.curveBy([dx, -dy], [dx * 2, 0]);
        path.curveBy([dx, dy], [dx * 2, 0]);
        path.strokeColor = 'black';

        return path;
      },

      dc: function(center, size){
        var group, dx, dy, points;

        dx = size / 2;
        dy = size / 8;

        points = [
          [[-dx, -dy], [dx, -dy]],
          [[-dx, dy], [dx, dy]]
        ];

        group = new paper.Group(_.map(points, function(pts){
          return new paper.Path.Line(center.add(pts[0]), center.add(pts[1]));
        }));
        group.lastChild.dashArray = [size / 4, size / 8];
        group.strokeColor = 'black';

        return group;
      },

      grid: function(center, size){
        var group, dx, dy, points;

        dx = dy = size / 4;

        points = [
          [[-dx * 2, -dy], [dx * 2, -dy]],
          [[-dx * 2, 0], [dx * 2, 0]],
          [[-dx * 2, dy], [dx * 2, dy]],
          [[-dx, -dy * 2], [-dx, dy * 2]],
          [[0, -dy * 2], [0, dy * 2]],
          [[dx, -dy * 2], [dx, dy * 2]]
        ];

        group = new paper.Group(_.map(points, function(pts){
          return new paper.Path.Line(center.add(pts[0]), center.add(pts[1]));
        }));
        group.strokeColor = 'black';

        return group;
      },

      m: function(center, size){
        var group, dx, dy, points;

        dx = size / 3;
        dy = size / 2;

        points = [
          [[-dx, -dy], [-dx, dy]],
          [[dx, -dy], [dx, dy]],
          [[-dx, -dy], [0, 0]],
          [[dx, -dy], [0, 0]]
        ];

        group = new paper.Group(_.map(points, function(pts){
          return new paper.Path.Line(center.add(pts[0]), center.add(pts[1]));
        }));
        group.strokeColor = 'black';

        return group;
      },

      ct: function(center, size){
        var group, points;

        points = [
          [[0, 0], [0, -size / 4]],
          [[0, 0], [-size / 4, size / 4], [-size / 2, 0]],
          [[0, 0], [size / 4, size / 4], [size / 2, 0]]
        ];

        group = new paper.Group(_.map(points, function(pts){
          if (pts.length === 3) {
            return new paper.Path.Arc(center.add(pts[0]),
                                      center.add(pts[1]),
                                      center.add(pts[2]));
          } else {
            return new paper.Path.Line(center.add(pts[0]), center.add(pts[1]));
          }
        }));
        group.strokeColor = 'black';

        return group;
      },

      coils: function(center, size){
        var group, dx, dy, points;

        dx = dy = size / 8;

        points = [
          [[0, -dy * 4], [0, dy * 4]],
          [[-dx * 3, -dy * 4], [-dx * 2, -dy * 4]],
          [[dx * 3, -dy * 4], [dx * 2, -dy * 4]],
          [[-dx * 2, -dy * 4], [-dx, -dy * 3], [-dx * 2, -dy * 2]],
          [[dx * 2, -dy * 4], [dx, -dy * 3], [dx * 2, -dy * 2]],
          [[-dx * 2, -dy * 2], [-dx, -dy], [-dx * 2, 0]],
          [[dx * 2, -dy * 2], [dx, -dy], [dx * 2, 0]],
          [[-dx * 2, 0], [-dx, dy], [-dx * 2, dy * 2]],
          [[dx * 2, 0], [dx, dy], [dx * 2, dy * 2]],
          [[-dx * 2, dy * 2], [-dx, dy * 3], [-dx * 2, dy * 4]],
          [[dx * 2, dy * 2], [dx, dy * 3], [dx * 2, dy * 4]],
          [[-dx * 3, dy * 4], [-dx * 2, dy * 4]],
          [[dx * 3, dy * 4], [dx * 2, dy * 4]]
        ];

        group = new paper.Group(_.map(points, function(pts){
          if (pts.length === 3) {
            return new paper.Path.Arc(center.add(pts[0]),
                                      center.add(pts[1]),
                                      center.add(pts[2]));
          } else {
            return new paper.Path.Line(center.add(pts[0]), center.add(pts[1]));
          }
        }));
        group.strokeColor = 'black';

        return group;
      },

      wye: function(center, size){
        var group, points;

        points = [
          [[-size / 3, -size / 2], [0, -size / 6]],
          [[size / 3, -size / 2], [0, -size / 6]],
          [[0, size / 2], [0, -size / 6]]
        ];

        group = new paper.Group(_.map(points, function(pts){
          return new paper.Path.Line(center.add(pts[0]), center.add(pts[1]));
        }));
        group.strokeColor = 'black';

        return group;
      },

      panel: function(center, size){
        return new paper.Group([symbols.square(center), symbols.grid(center)]);
      },

      dc_bus: function(center, size){
        return new paper.Group([symbols.square(center), symbols.dc(center, 2 / 3)]);
      },

      ac_bus: function(center, size){
        return new paper.Group([symbols.square(center), symbols.ac(center, 2 / 3)]);
      },

      inverter: function(center, size){
        return new paper.Group([symbols.square(center), symbols.divider(center),
                                symbols.dc(center.subtract(size / 4), 1 / 3),
                                symbols.ac(center.add(size / 4), 1 / 3)]);
      },

      meter: function(center, size){
        return new paper.Group([symbols.square(center),
                                symbols.circle(center.subtract(0, size / 9), 4 / 9),
                                symbols.m(center.subtract(0, size / 9), 1 / 4),
                                symbols.ct(center.add(0, size * 2 / 9), 4 / 9)]);
      },

      transformer: function(center, size){
        return new paper.Group([symbols.square(center), symbols.coils(center, 2 / 3)]);
      },

      interconnect: function(center, size){
        return new paper.Group([symbols.square(center), symbols.wye(center, 2 / 3)]);
      }

    }, function(memo, func, name){
      memo[name] = function(_center, _scale){
        var item, symbol;

        item = func(new paper.Point(0, 0), 50);
        symbol = new paper.Symbol(item);
        item.remove();

        symbols[name] = function(center, scale){
          var placed = symbol.place(center);

          if (scale) {
            placed.scale(scale);
          }
          return placed;
        };
        return symbols[name](_center, _scale);
      };
      return memo;
    }, {});

  return {
    factory: function(type, center){
      return symbols[symbols.hasOwnProperty(type) ? type : 'square'](center);
    }
  };
});
