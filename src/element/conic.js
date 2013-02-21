/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
    
    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    
    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 math/math
 math/geometry
 math/numerics
 utils/type
  elements:
   point
   curve
 */

/**
 * @fileoverview In this file the conic sections defined.
 */

define([
    'jxg', 'base/constants', 'math/math', 'math/numerics', 'math/geometry', 'utils/type', 'base/point', 'base/curve'
], function (JXG, Const, Mat, Numerics, Geometry, Type, Point, Curve) {

    "use strict";

    /**
     * @class This element is used to provide a constructor for an ellipse. An ellipse is given by two points (the foci) and a third point on the the ellipse or
     * the length of the major axis.
     * @pseudo
     * @description
     * @name Ellipse
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point,array_JXG.Point,array_JXG.Point,array} point1,point2,point3 Parent elements can be three elements either of type {@link JXG.Point} or array of
     * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
     * @param {JXG.Point,array_JXG.Point,array_number,function} point1,point2,number Parent elements can be two elements either of type {@link JXG.Point} or array of
     * numbers describing the coordinates of a point. The third parameter is a number/function which defines the length of the major axis
     * Optional parameters four and five are numbers which define the curve length (e.g. start/end). Default values are -pi and pi.
     * @example
     * // Create an Ellipse by three points
     * var A = board.create('point', [-1,4]);
     * var B = board.create('point', [-1,-4]);
     * var C = board.create('point', [1,1]);
     * var el = board.create('ellipse',[A,B,C]);
     * </pre><div id="a4d7fb6f-8708-4e45-87f2-2379ae2bd2c0" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var glex1_board = JXG.JSXGraph.initBoard('a4d7fb6f-8708-4e45-87f2-2379ae2bd2c0', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
     *   var A = glex1_board.create('point', [-1,4]);
     *   var B = glex1_board.create('point', [-1,-4]);
     *   var C = glex1_board.create('point', [1,1]);
     *   var el = glex1_board.create('ellipse',[A,B,C]);
     * </script><pre>
     */
    JXG.createEllipse = function (board, parents, attributes) {
        var polarForm, curve, transformFunc, M,
            C, majorAxis, i,
            rotationMatrix,
            // focus 1 and focus 2
            F = [],
            attr_foci = Type.copyAttributes(attributes, board.options, 'conic', 'foci'),
            attr_curve = Type.copyAttributes(attributes, board.options, 'conic');

        // The foci and the third point are either points or coordinate arrays.
        for (i = 0; i < 2; i++) {
            // focus i given by coordinates
            if (parents[i].length > 1) {
                F[i] = board.create('point', parents[i], attr_foci);
            // focus i given by point
            } else if (Type.isPoint(parents[i])) {
                F[i] = board.select(parents[i]);
            // given by function
            } else if ((typeof parents[i] === 'function') && (parents[i]().elementClass === Const.OBJECT_CLASS_POINT)) {
                F[i] = parents[i]();
            // focus i given by point name
            } else if (Type.isString(parents[i])) {
                F[i] = board.select(parents[i]);
            } else {
                throw new Error("JSXGraph: Can't create Ellipse with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [point,point,point], [point,point,number|function]");
            }
        }

        // length of major axis
        if (Type.isNumber(parents[2])) {
            majorAxis = Type.createFunction(parents[2], board);
        } else if ((typeof parents[2] === 'function') && (Type.isNumber(parents[2]()))) {
            majorAxis = parents[2];
        } else {
            // point on ellipse
            if (Type.isPoint(parents[2])) {
                C = board.select(parents[2]);
            // point on ellipse given by coordinates
            } else if (parents[2].length > 1) {
                C = board.create('point', parents[2], attr_foci);
            // given by function
            } else if ((typeof parents[2] === 'function') && (parents[2]().elementClass === Const.OBJECT_CLASS_POINT)) {
                C = parents[2]();
            // focus i given by point name
            } else if (Type.isString(parents[2])) {
                C = board.select(parents[2]);
            } else {
                throw new Error("JSXGraph: Can't create Ellipse with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                    "\nPossible parent types: [point,point,point], [point,point,number|function]");
            }
            /** @ignore */
            majorAxis = function () {
                return C.Dist(F[0]) + C.Dist(F[1]);
            };
        }

        // to
        if (!Type.exists(parents[4])) {
            parents[4] = 1.0001 * Math.PI;
        }

        // from
        if (!Type.exists(parents[3])) {
            parents[3] = -1.0001 * Math.PI;
        }

        M = board.create('point', [
            function () {
                return (F[0].X() + F[1].X()) * 0.5;
            },
            function () {
                return (F[0].Y() + F[1].Y()) * 0.5;
            }
        ], attr_foci);

        /** @ignore */
        transformFunc = function () {
            var beta, co, si, sgn, m,
                ax = F[0].X(),
                ay = F[0].Y(),
                bx = F[1].X(),
                by = F[1].Y();

            // Rotate by the slope of the line [F[0],F[1]]
            sgn = (bx - ax > 0) ? 1 : -1;

            if (Math.abs(bx - ax) > 0.0000001) {
                beta = Math.atan2(by - ay, bx - ax) + ((sgn < 0) ? Math.PI : 0);
            } else {
                beta = ((by - ay > 0) ? 0.5 : -0.5) * Math.PI;
            }

            co = Math.cos(beta);
            si = Math.sin(beta);

            m = [
                [1, 0, 0],
                [M.X(), co, -si],
                [M.Y(), si, co]
            ];

            return m;
        };

        curve = board.create('curve', [
            function (x) {
                return 0;
            },
            function (x) {
                return 0;
            },
            parents[3],
            parents[4]], attr_curve);

        /** @ignore */
        polarForm = function (phi, suspendUpdate) {
            var mx, my,
                a = majorAxis() * 0.5,
                aa = a * a,
                e = F[1].Dist(F[0]) * 0.5,
                bb = aa - e * e,
                b = Math.sqrt(bb),
                transformMat = [
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]
                ];

            if (!suspendUpdate) {
                rotationMatrix = transformFunc();
                mx = M.X();
                my = M.Y();
                transformMat[0][0] = rotationMatrix[0][0];
                transformMat[0][1] = 0;
                transformMat[0][2] = 0;
                transformMat[1][0] = mx * (1 - rotationMatrix[1][1]) + my * rotationMatrix[1][2];
                transformMat[1][1] = rotationMatrix[1][1];
                transformMat[1][2] = rotationMatrix[2][1];
                transformMat[2][0] = my * (1 - rotationMatrix[1][1]) - mx * rotationMatrix[1][2];
                transformMat[2][1] = rotationMatrix[1][2];
                transformMat[2][2] = rotationMatrix[2][2];

                curve.quadraticform =
                    Mat.matMatMult(
                        Mat.transpose(transformMat),
                        Mat.matMatMult([
                            [-1 + mx * mx / (a * a) + my * my / bb, -mx / aa, -mx / bb],
                            [-mx / aa, 1 / aa, 0],
                            [-my / bb, 0, 1 / bb]
                        ], transformMat)
                    );
            }
            return Mat.matVecMult(rotationMatrix, [1, a * Math.cos(phi), b * Math.sin(phi)]);
        };

        /** @ignore */
        curve.X = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[1];
        };
        /** @ignore */
        curve.Y = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[2];
        };
        curve.midpoint = M;
        curve.type = Const.OBJECT_TYPE_CONIC;

        M.addChild(curve);
        for (i = 0; i < 2; i++) {
            if (Type.isPoint(F[i])) {
                F[i].addChild(curve);
            }
        }
        if (Type.isPoint(C)) {
            C.addChild(curve);
        }
        curve.parents = [];
        for (i = 0; i < parents.length; i++) {
            if (parents[i].id) {
                curve.parents.push(parents[i].id);
            }
        }

        return curve;
    };

    /**
     * @class This element is used to provide a constructor for an hyperbola. An hyperbola is given by two points (the foci) and a third point on the the hyperbola or
     * the length of the major axis.
     * @pseudo
     * @description
     * @name Hyperbola
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point,array_JXG.Point,array_JXG.Point,array} point1,point2,point3 Parent elements can be three elements either of type {@link JXG.Point} or array of
     * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
     * @param {JXG.Point,array_JXG.Point,array_number,function} point1,point2,number Parent elements can be two elements either of type {@link JXG.Point} or array of
     * numbers describing the coordinates of a point. The third parameter is a number/function which defines the length of the major axis
     * Optional parameters four and five are numbers which define the curve length (e.g. start/end). Default values are -pi and pi.
     * @example
     * // Create an Hyperbola by three points
     * var A = board.create('point', [-1,4]);
     * var B = board.create('point', [-1,-4]);
     * var C = board.create('point', [1,1]);
     * var el = board.create('hyperbola',[A,B,C]);
     * </pre><div id="cf99049d-a3fe-407f-b936-27d76550f8c4" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var glex1_board = JXG.JSXGraph.initBoard('cf99049d-a3fe-407f-b936-27d76550f8c4', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
     *   var A = glex1_board.create('point', [-1,4]);
     *   var B = glex1_board.create('point', [-1,-4]);
     *   var C = glex1_board.create('point', [1,1]);
     *   var el = glex1_board.create('hyperbola',[A,B,C]);
     * </script><pre>
     */
    JXG.createHyperbola = function (board, parents, attributes) {
        var polarForm, curve, transformFunc, M, C, majorAxis, i, rotationMatrix,
            // focus 1 and focus 2
            F = [],
            attr_foci = Type.copyAttributes(attributes, board.options, 'conic', 'foci'),
            attr_curve = Type.copyAttributes(attributes, board.options, 'conic');

        // The foci and the third point are either points or coordinate arrays.
        for (i = 0; i < 2; i++) {
            // focus i given by coordinates
            if (parents[i].length > 1) {
                F[i] = board.create('point', parents[i], attr_foci);
            // focus i given by point
            } else if (Type.isPoint(parents[i])) {
                F[i] = board.select(parents[i]);
            // given by function
            } else if ((typeof parents[i] === 'function') && (parents[i]().elementClass === Const.OBJECT_CLASS_POINT)) {
                F[i] = parents[i]();
            // focus i given by point name
            } else if (Type.isString(parents[i])) {
                F[i] = board.select(parents[i]);
            } else {
                throw new Error("JSXGraph: Can't create Hyperbola with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                    "\nPossible parent types: [point,point,point], [point,point,number|function]");
            }
        }

        // length of major axis
        if (Type.isNumber(parents[2])) {
            majorAxis = Type.createFunction(parents[2], board);
        } else if ((typeof parents[2] === 'function') && (Type.isNumber(parents[2]()))) {
            majorAxis = parents[2];
        } else {
            // point on ellipse
            if (Type.isPoint(parents[2])) {
                C = board.select(parents[2]);
            // point on ellipse given by coordinates
            } else if (parents[2].length > 1) {
                C = board.create('point', parents[2], attr_foci);
            // given by function
            } else if ((typeof parents[2] === 'function') && (parents[2]().elementClass === Const.OBJECT_CLASS_POINT)) {
                C = parents[2]();
            // focus i given by point name
            } else if (Type.isString(parents[2])) {
                C = board.select(parents[2]);
            } else {
                throw new Error("JSXGraph: Can't create Hyperbola with parent types '" +
                    (typeof parents[0]) + "' and '" + (typeof parents[1]) + "' and '" + (typeof parents[2]) + "'." +
                    "\nPossible parent types: [point,point,point], [point,point,number|function]");
            }
            /** @ignore */
            majorAxis = function () {
                return C.Dist(F[0]) - C.Dist(F[1]);
            };
        }

        // to
        if (!Type.exists(parents[4])) {
            parents[4] = 1.0001 * Math.PI;
        }

        // from
        if (!Type.exists(parents[3])) {
            parents[3] = -1.0001 * Math.PI;
        }

        M = board.create('point', [
            function () {
                return (F[0].X() + F[1].X()) * 0.5;
            },
            function () {
                return (F[0].Y() + F[1].Y()) * 0.5;
            }
        ], attr_foci);

        /** @ignore */
        transformFunc = function () {
            var m, sgn, beta,
                ax = F[0].X(),
                ay = F[0].Y(),
                bx = F[1].X(),
                by = F[1].Y();

            // Rotate by the slope of the line [F[0],F[1]]
            sgn = (bx - ax > 0) ? 1 : -1;
            if (Math.abs(bx - ax) > 0.0000001) {
                beta = Math.atan2(by - ay, bx - ax) + ((sgn < 0) ? Math.PI : 0);
            } else {
                beta = ((by - ay > 0) ? 0.5 : -0.5) * Math.PI;
            }

            m = [
                [1, 0, 0],
                [M.X(), Math.cos(beta), -Math.sin(beta)],
                [M.Y(), Math.sin(beta), Math.cos(beta)]
            ];

            return m;
        };

        curve = board.create('curve', [
            function (x) {
                return 0;
            },
            function (x) {
                return 0;
            }, parents[3], parents[4]], attr_curve);


        // Hyperbola is defined by (a*sec(t),b*tan(t)) and sec(t) = 1/cos(t)
        /** @ignore */
        polarForm = function (phi, suspendUpdate) {
            var mx, my,
                a = majorAxis() * 0.5,
                aa = a * a,
                e = F[1].Dist(F[0]) * 0.5,
                b = Math.sqrt(-a * a + e * e),
                bb = b * b,
                transformMat = [
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]
                ];

            if (!suspendUpdate) {
                rotationMatrix = transformFunc();
                mx = M.X();
                my = M.Y();
                transformMat[0][0] = rotationMatrix[0][0];
                transformMat[0][1] = 0.0;
                transformMat[0][2] = 0.0;
                transformMat[1][0] = mx * (1 - rotationMatrix[1][1]) + my * rotationMatrix[1][2];
                transformMat[1][1] = rotationMatrix[1][1];
                transformMat[1][2] = rotationMatrix[2][1];
                transformMat[2][0] = my * (1 - rotationMatrix[1][1]) - mx * rotationMatrix[1][2];
                transformMat[2][1] = rotationMatrix[1][2];
                transformMat[2][2] = rotationMatrix[2][2];
                curve.quadraticform =
                    Mat.matMatMult(Mat.transpose(transformMat),
                        Mat.matMatMult([
                            [-1 + mx * mx / aa + my * my / bb, -mx / aa, my / bb],
                            [-mx / aa, 1 / aa, 0],
                            [my / bb, 0, -1 / bb]
                        ], transformMat));
            }
            return Mat.matVecMult(rotationMatrix, [1, a / Math.cos(phi), b * Math.tan(phi)]);
        };

        /** @ignore */
        curve.X = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[1];
        };
        /** @ignore */
        curve.Y = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[2];
        };

        curve.midpoint = M;
        curve.type = Const.OBJECT_TYPE_CONIC;

        M.addChild(curve);
        for (i = 0; i < 2; i++) {
            if (Type.isPoint(F[i])) {
                F[i].addChild(curve);
            }
        }
        if (Type.isPoint(C)) {
            C.addChild(curve);
        }
        curve.parents = [];
        for (i = 0; i < parents.length; i++) {
            if (parents[i].id) {
                curve.parents.push(parents[i].id);
            }
        }

        return curve;
    };

    /**
     * @class This element is used to provide a constructor for a parabola. A parabola is given by one point (the focus) and a line (the directrix).
     * @pseudo
     * @description
     * @name Parabola
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Curve
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point,array_JXG.Line} point,line Parent elements are a point and a line.
     * Optional parameters three and four are numbers which define the curve length (e.g. start/end). Default values are -pi and pi.
     * @example
     * // Create a parabola by a point C and a line l.
     * var A = board.create('point', [-1,4]);
     * var B = board.create('point', [-1,-4]);
     * var l = board.create('line', [A,B]);
     * var C = board.create('point', [1,1]);
     * var el = board.create('parabola',[C,l]);
     * </pre><div id="524d1aae-217d-44d4-ac58-a19c7ab1de36" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var glex1_board = JXG.JSXGraph.initBoard('524d1aae-217d-44d4-ac58-a19c7ab1de36', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
     *   var A = glex1_board.create('point', [-1,4]);
     *   var B = glex1_board.create('point', [-1,-4]);
     *   var l = glex1_board.create('line', [A,B]);
     *   var C = glex1_board.create('point', [1,1]);
     *   var el = glex1_board.create('parabola',[C,l]);
     * </script><pre>
     */
    JXG.createParabola = function (board, parents, attributes) {
        var polarForm, curve, transformFunc, M, i, rotationMatrix,
            // focus
            F1 = parents[0],
            // directrix
            l = parents[1],
            attr_foci = Type.copyAttributes(attributes, board.options, 'conic', 'foci'),
            attr_curve = Type.copyAttributes(attributes, board.options, 'conic');

        // focus 1 given by coordinates
        if (parents[0].length > 1) {
            F1 = board.create('point', parents[0], attr_foci);
        // focus i given by point
        } else if (Type.isPoint(parents[0])) {
            F1 = board.select(parents[0]);
        // given by function
        } else if ((typeof parents[0] === 'function') && (parents[0]().elementClass === Const.OBJECT_CLASS_POINT)) {
            F1 = parents[0]();
        // focus i given by point name
        } else if (Type.isString(parents[0])) {
            F1 = board.select(parents[0]);
        } else {
            throw new Error("JSXGraph: Can't create Parabola with parent types '" +
                (typeof parents[0]) + "' and '" + (typeof parents[1]) + "'." +
                "\nPossible parent types: [point,line]");
        }

        // to
        if (!Type.exists(parents[3])) {
            parents[3] = 10;
        }

        // from
        if (!Type.exists(parents[2])) {
            parents[2] = -10;
        }

        M = board.create('point', [
            function () {
                var v = [0, l.stdform[1], l.stdform[2]];

                v = Mat.crossProduct(v, F1.coords.usrCoords);
                return Geometry.meetLineLine(v, l.stdform, 0, board).usrCoords;
            }
        ], attr_foci);

        /** @ignore */
        transformFunc = function () {
            var m,
                beta = Math.atan(l.getSlope()),
                x = (M.X() + F1.X()) * 0.5,
                y = (M.Y() + F1.Y()) * 0.5;

            beta += (F1.Y() - M.Y() < 0 || (F1.Y() === M.Y() && F1.X() > M.X())) ? Math.PI : 0;

            // Rotate by the slope of the line l (Leitlinie = directrix)
            m = [
                [1, 0, 0],
                [x * (1 - Math.cos(beta)) + y * Math.sin(beta), Math.cos(beta), -Math.sin(beta)],
                [y * (1 - Math.cos(beta)) - x * Math.sin(beta), Math.sin(beta), Math.cos(beta)]
            ];
            return m;
        };

        curve = board.create('curve', [
            function (x) {
                return 0;
            },
            function (x) {
                return 0;
            }, parents[2], parents[3]], attr_curve);

        /** @ignore */
        polarForm = function (t, suspendUpdate) {
            var e = M.Dist(F1) * 0.5,
                e4 = e * 4,
                transformMat = [
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]
                ],
                a = (M.X() + F1.X()) * 0.5,
                b = (M.Y() + F1.Y()) * 0.5;

            if (!suspendUpdate) {
                rotationMatrix = transformFunc();
                transformMat[0][0] = rotationMatrix[0][0];
                transformMat[0][1] = 0;
                transformMat[0][2] = 0;
                transformMat[1][0] = a * (1 - rotationMatrix[1][1]) + b * rotationMatrix[1][2];
                transformMat[1][1] = rotationMatrix[1][1];
                transformMat[1][2] = rotationMatrix[2][1];
                transformMat[2][0] = b * (1 - rotationMatrix[1][1]) - a * rotationMatrix[1][2];
                transformMat[2][1] = rotationMatrix[1][2];
                transformMat[2][2] = rotationMatrix[2][2];
                curve.quadraticform =
                    Mat.matMatMult(Mat.transpose(transformMat),
                        Mat.matMatMult([
                            [-b * e4 - a * a, a, 2 * e],
                            [a, -1, 0],
                            [2 * e, 0, 0]
                        ], transformMat));
            }
            return Mat.matVecMult(rotationMatrix, [e4, e4 * (t + a), t * t + b * e4]);
        };

        /** @ignore */
        curve.X = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[1];
        };

        /** @ignore */
        curve.Y = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[2];
        };

        curve.type = Const.OBJECT_TYPE_CONIC;
        M.addChild(curve);

        if (Type.isPoint(F1)) {
            F1.addChild(curve);
        }

        l.addChild(curve);
        curve.parents = [];

        for (i = 0; i < parents.length; i++) {
            if (parents[i].id) {
                curve.parents.push(parents[i].id);
            }
        }

        return curve;
    };

    /**
     *
     * @class This element is used to provide a constructor for a generic conic section uniquely defined by five points.
     * @pseudo
     * @description
     * @name Conic
     * @augments JXG.Curve
     * @constructor
     * @type JXG.Conic
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point,array_JXG.Point,array_JXG.Point,array_JXG.Point,array_JXG.Point,array_} point,point,point,point,point Parent elements are five points.
     * @param {number_number_number_number_number_number} 6 numbers (a_00,a_11,a_22,a_01,a_12,a_22)
     * @example
     * // Create a conic section through the points A, B, C, D, and E.
     *  var A = board.create('point', [1,5]);
     *  var B = board.create('point', [1,2]);
     *  var C = board.create('point', [2,0]);
     *  var D = board.create('point', [0,0]);
     *  var E = board.create('point', [-1,5]);
     *  var conic = board.create('conic',[A,B,C,D,E]);
     * </pre><div id="2d79bd6a-db9b-423c-9cba-2497f0b06320" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var glex1_board = JXG.JSXGraph.initBoard('2d79bd6a-db9b-423c-9cba-2497f0b06320', {boundingbox:[-6,6,6,-6], keepaspectratio:true, showcopyright: false, shownavigation: false});
     *   var A = glex1_board.create('point', [1,5]);
     *   var B = glex1_board.create('point', [1,2]);
     *   var C = glex1_board.create('point', [2,0]);
     *   var D = glex1_board.create('point', [0,0]);
     *   var E = glex1_board.create('point', [-1,5]);
     *   var conic = glex1_board.create('conic',[A,B,C,D,E]);
     * </script><pre>
     */
    JXG.createConic = function (board, parents, attributes) {
        var polarForm, curve, fitConic, degconic, sym,
            eigen, a, b, c, c1, c2,
            i, definingMat, givenByPoints,
            rotationMatrix = [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ],
            M = [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ],
            points = [],
            p = [],
            attr_foci = Type.copyAttributes(attributes, board.options, 'conic', 'foci'),
            attr_curve = Type.copyAttributes(attributes, board.options, 'conic');

        if (parents.length === 5) {
            givenByPoints = true;
        } else if (parents.length === 6) {
            givenByPoints = false;
        } else {
            throw new Error("JSXGraph: Can't create generic Conic with " + parents.length + " parameters.");
        }

        if (givenByPoints) {
            for (i = 0; i < 5; i++) {
                // point i given by coordinates
                if (parents[i].length > 1) {
                    points[i] = board.create('point', parents[i], attr_foci);
                // point i given by point
                } else if (Type.isPoint(parents[i])) {
                    points[i] = board.select(parents[i]);
                // given by function
                } else if ((typeof parents[i] === 'function') && (parents[i]().elementClass === Const.OBJECT_CLASS_POINT)) {
                    points[i] = parents[i]();
                // point i given by point name
                } else if (Type.isString(parents[i])) {
                    points[i] = board.select(parents[i]);
                } else {
                    throw new Error("JSXGraph: Can't create Conic section with parent types '" + (typeof parents[i]) + "'." +
                        "\nPossible parent types: [point,point,point,point,point], [a00,a11,a22,a01,a02,a12]");
                }
            }
        } else {
            /* Usual notation (x,y,z):
             *  [[A0,A3,A4],
             *   [A3,A1,A5],
             *   [A4,A5,A2]].
             * Our notation (z,x,y):
             *  [[-A2   , A4*2.0, A5*0.5],
             *   [A4*2.0,    -A0, A3*0.5],
             *   [A5*0.5, A3*0.5,    -A1]]
             * New: (z,x,y):
             *  [[A2, A4, A5],
             *   [A4, A0, A3],
             *   [A5, A3, A1]]
             */
            definingMat = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];
            definingMat[0][0] = (Type.isFunction(parents[2])) ? function () { return parents[2](); } : function () { return parents[2]; };
            definingMat[0][1] = (Type.isFunction(parents[4])) ? function () { return parents[4](); } : function () { return parents[4]; };
            definingMat[0][2] = (Type.isFunction(parents[5])) ? function () { return parents[5](); } : function () { return parents[5]; };
            definingMat[1][1] = (Type.isFunction(parents[0])) ? function () { return parents[0](); } : function () { return parents[0]; };
            definingMat[1][2] = (Type.isFunction(parents[3])) ? function () { return parents[3](); } : function () { return parents[3]; };
            definingMat[2][2] = (Type.isFunction(parents[1])) ? function () { return parents[1](); } : function () { return parents[1]; };
        }

        // sym(A) = A + A^t . Manipulates A in place.
        sym = function (A) {
            var i, j;
            for (i = 0; i < 3; i++) {
                for (j = i; j < 3; j++) {
                    A[i][j] += A[j][i];
                }
            }
            for (i = 0; i < 3; i++) {
                for (j = 0; j < i; j++) {
                    A[i][j] = A[j][i];
                }
            }
            return A;
        };

        // degconic(v,w) = sym(v*w^t)
        degconic = function (v, w) {
            var i, j, mat = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];

            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    mat[i][j] = v[i] * w[j];
                }
            }

            return sym(mat);
        };

        // (p^t*B*p)*A-(p^t*A*p)*B
        fitConic = function (A, B, p) {
            var i, j, pBp, pAp, Mv,
                mat = [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ];

            Mv = Mat.matVecMult(B, p);
            pBp = Mat.innerProduct(p, Mv);
            Mv = Mat.matVecMult(A, p);
            pAp = Mat.innerProduct(p, Mv);

            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    mat[i][j] = pBp * A[i][j] - pAp * B[i][j];
                }
            }
            return mat;
        };

        // Here, the defining functions for the curve are just dummy functions.
        // In polarForm there is a reference to curve.quadraticform.
        curve = board.create('curve', [
            function (x) {
                return 0;
            },
            function (x) {
                return 0;
            }, 0, 2 * Math.PI], attr_curve);

        /** @ignore */
        polarForm = function (phi, suspendUpdate) {
            var i, j, len, v;

            if (!suspendUpdate) {
                if (givenByPoints) {
                    // Copy the point coordinate vectors
                    for (i = 0; i < 5; i++) {
                        p[i] = points[i].coords.usrCoords;
                    }

                    // Compute the quadratic form
                    c1 = degconic(Mat.crossProduct(p[0], p[1]), Mat.crossProduct(p[2], p[3]));
                    c2 = degconic(Mat.crossProduct(p[0], p[2]), Mat.crossProduct(p[1], p[3]));
                    M = fitConic(c1, c2, p[4]);
                } else {
                    for (i = 0; i < 3; i++) {
                        for (j = i; j < 3; j++) {
                            M[i][j] = definingMat[i][j]();
                            if (j > i) {
                                M[j][i] = M[i][j];
                            }
                        }
                    }
                }

                // Here is the reference back to the curve.
                curve.quadraticform = M;

                // Compute Eigenvalues and Eigenvectors
                eigen = Numerics.Jacobi(M);

                // Scale the Eigenvalues such that the first Eigenvalue is positive
                if (eigen[0][0][0] < 0) {
                    eigen[0][0][0] *= (-1);
                    eigen[0][1][1] *= (-1);
                    eigen[0][2][2] *= (-1);
                }

                // Normalize the Eigenvectors
                for (i = 0; i < 3; i++) {
                    len = 0.0;
                    for (j = 0; j < 3; j++) {
                        len += eigen[1][j][i] * eigen[1][j][i];
                    }
                    len = Math.sqrt(len);
                    /*for (j = 0; j < 3; j++) {
                        //eigen[1][j][i] /= len;
                    }*/
                }
                rotationMatrix = eigen[1];
                c = Math.sqrt(Math.abs(eigen[0][0][0]));
                a = Math.sqrt(Math.abs(eigen[0][1][1]));
                b = Math.sqrt(Math.abs(eigen[0][2][2]));

            }

            // The degenerate cases with eigen[0][i][i]==0 are not handled correct yet.
            if (eigen[0][1][1] <= 0.0 && eigen[0][2][2] <= 0.0) {
                v = Mat.matVecMult(rotationMatrix, [1 / c, Math.cos(phi) / a, Math.sin(phi) / b]);
            } else if (eigen[0][1][1] <= 0.0 && eigen[0][2][2] > 0.0) {
                v = Mat.matVecMult(rotationMatrix, [Math.cos(phi) / c, 1 / a, Math.sin(phi) / b]);
            } else if (eigen[0][2][2] < 0.0) {
                v = Mat.matVecMult(rotationMatrix, [Math.sin(phi) / c, Math.cos(phi) / a, 1 / b]);
            }

            // Normalize
            v[1] /= v[0];
            v[2] /= v[0];
            v[0] = 1.0;

            return v;
        };

        /** @ignore */
        curve.X = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[1];
        };

        /** @ignore */
        curve.Y = function (phi, suspendUpdate) {
            return polarForm(phi, suspendUpdate)[2];
        };

        // Center coordinates see http://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections
        curve.midpoint = board.create('point', [
            function () {
                var m = curve.quadraticform;

                return [
                    m[1][1] * m[2][2] - m[1][2] * m[1][2],
                    m[1][2] * m[0][2] - m[2][2] * m[0][1],
                    m[0][1] * m[1][2] - m[1][1] * m[0][2]
                ];
            }
        ], attr_foci);

        curve.type = Const.OBJECT_TYPE_CONIC;

        if (givenByPoints) {
            for (i = 0; i < 5; i++) {
                if (Type.isPoint(points[i])) {
                    points[i].addChild(curve);
                }
            }
            curve.parents = [];
            for (i = 0; i < parents.length; i++) {
                if (parents[i].id) {
                    curve.parents.push(parents[i].id);
                }
            }
        }
        curve.addChild(curve.midpoint);

        return curve;
    };

    JXG.registerElement('ellipse', JXG.createEllipse);
    JXG.registerElement('hyperbola', JXG.createHyperbola);
    JXG.registerElement('parabola', JXG.createParabola);
    JXG.registerElement('conic', JXG.createConic);

    return {
        createEllipse: JXG.createEllipse,
        createHyperbola: JXG.createHyperbola,
        createParabola: JXG.createParabola,
        createConic: JXG.createConic
    };
});