var screvst = 0, woff = [0,0], candim = {}, zoomid = null, zoomta = null, dirs, data = undefined, svg, fcdata, fca, fco, viewbox = {}, rbox, yesno = null, routestack, xws = [], yws = [], deststk = [];
var debug = 0;

// scp flowchart.js ecsrtwiki.emea.vzbi.com:/prod/Foswiki-2.1.6/pub/System/FlowchartPlugin/flowchart_test.js

function flowchart_main (fcid)
{
if (data == undefined)
        data = JSON.parse ($('.FlowchartPlugin_flowchartdata').text ());
fcdata = data[fcid];
svg = $('#' + fcid);

prepare_fcsvg (fcid);
}

//==============================================================================
//
//
//
//==============================================================================

function prepare_fcsvg (fcid)
{
fca = [];
fco = {};
var rrow, i, j, k, l, m, e, eid;

viewbox[fcid] = [ 0, 0, 0, 0 ];
rbox = [];
routestack = [];

var can = initial_traverse_data (fcdata[1]);

// cutting last row, if unused
cut_loop: for (i = can.length - 1; i >= 0; --i)
        {
        for (j = 0, e = can[i]; j < e.length; ++j)
                if (e[j] >= 0)
                        break cut_loop;
        can.pop ();
        }

if (fcdata[0]['max-path']      == undefined) fcdata[0]['max-path']      = 3;    else fcdata[0]['max-path']      = parseInt (fcdata[0]['max-path'], 10) | 1;
var mp = fcdata[0]['max-path'];

// storing position and length of elements into the elements
for (i = can.length - 1; i >= 0; --i)
        {
        for (j = (e = can[i]).length - 1; j >= 0; --j)
                {
                if ((eid = e[j]) >= 0)
                        {
                        if (fca[eid][0]['row'] < 0)
                                fca[eid][0]['row'] = i;
                        fca[eid][0]['col'] = j;
                        ++fca[eid][0]['len'];
                        }
                }
        }

//initializing the router-box
var rbx = can[0].length * (2 * mp + 2) + mp;
var rby = can.length    * (2 * mp + 2) + mp;
console.log ('rbx: ' + rbx + ', rby: ' + rby);

//  0: H-status     - 0 -> free, 1 -> blocked
//  1: V-status     - 0 -> free, 1 -> blocked
//  2: entrance     - -1 -> no entrance, >= 0 entrance to element-ID
//  3: H-occupation - eid of horizontal line, going through this area
//  4: V-occupation - eid of vertical line, going through this area
//  5: X-Pos        - left edge of the element
//  6: Y-Pos        - top edge of the element
//  7: route from   - previous dot from canvas
//  8: route to     - max 3 possible next dots
//  9: occupied     - During routing process
// 10: pathcosts    - distance in walked dots and preferences from origin dot
// 11: Exit to      - bit, showing where the exiting line is

for (i = 0; i < rby; ++i)
        {
        rbox.push ((rrow = []));
        for (j = 0; j < rbx; ++j)
                rrow.push ([ ((i % (mp + 1)) == mp) ? 1 : 0, ((j % (mp + 1)) == mp) ? 1 : 0, -1, -1, -1, 0, 0, null, [], -1, 0, 0 ]);
        }
console.log ('rbox-Y: ' + rbox.length);
console.log ('rbox-X: ' + rbox[0].length);

// setting the entrance points of each element and the blocked areas
for (i = (fca.length - 1); i >= 0; --i)
        {
        e = fca[i][0];
        l = e['row'] * (2 * mp + 2) + mp + 1;
        j = e['col'] * (2 * mp + 2) + mp + 1;
        console.log ('i: ' + i + ', e[col]: ' + e['col'] + ', l: ' + l);

        for (k = j + (e['len'] - 1) * (2 * mp + 2) + mp - 1; k >= j; --k)
                for (m = l + mp - 1; m >= l; --m)
                        rbox[m][k][0] = rbox[m][k][1] = 1;

        k = j + (e['len'] / 2 - 1) * (2 * mp + 2) + mp + 1 + (mp >> 1);
        rbox[l-1][k][1] = 0;
        rbox[l-1][k][2] = i;
        rbox[l-1][k][11] = 8;
        deststk.push ([ k, l - 1, 4, i ]);
        }

if (fcdata[0]['item-w']    == undefined) fcdata[0]['item-w']    = 100;   else fcdata[0]['item-w']    = parseInt (fcdata[0]['item-w'], 10);
if (fcdata[0]['text-size'] == undefined) fcdata[0]['text-size'] = 10;    else fcdata[0]['text-size'] = parseInt (fcdata[0]['text-size'], 10);
if (fcdata[0]['max-lines'] == undefined) fcdata[0]['max-lines'] = 5;     else fcdata[0]['max-lines'] = parseInt (fcdata[0]['max-lines'], 10);
if (fcdata[0]['elborder']  == undefined) fcdata[0]['elborder']  = 10;    else fcdata[0]['elborder']  = parseInt (fcdata[0]['elementborder'], 10);

fcdata[0]['corad']         = 3;
fcdata[0]['pawidth']       = fcdata[0]['max-path'] * 10;
fcdata[0]['item-h'] = (fcdata[0]['text-size'] + 2) * fcdata[0]['max-lines'] + 4;

// to avoid long decimal numbers in SVG, make those three values dividable by the value of 'max-path'
while (fcdata[0]['pawidth'] % mp)       ++fcdata[0]['pawidth'];
while (fcdata[0]['item-w'] % mp)  ++fcdata[0]['item-w'];
while (fcdata[0]['item-h'] % mp) ++fcdata[0]['item-h'];

fcdata[0]['fcwidth']  = viewbox[fcid][2] = can[0].length * (2 * fcdata[0]['elborder'] + fcdata[0]['pawidth'] + fcdata[0]['item-w']) + fcdata[0]['pawidth'];
fcdata[0]['fcheight'] = viewbox[fcid][3] = can.length    * (2 * fcdata[0]['elborder'] + fcdata[0]['pawidth'] + fcdata[0]['item-h']) + fcdata[0]['pawidth'];
can = undefined;

var clhei, clwid = svg.parent ().get (0)['clientWidth'];

if (viewbox[fcid][2] > clwid)
        {
        clhei = (clwid * viewbox[fcid][3]) / viewbox[fcid][2];
        }
else
        {
        clwid = viewbox[fcid][2];
        clhei = viewbox[fcid][3];
        }
clwid = Math.ceil ((clwid * fcdata[0]['percent']) / 100);
clhei = Math.ceil ((clhei * fcdata[0]['percent']) / 100);

fcdata[0]['area-w'] = (fcdata[0]['area-w'] == undefined) ? clwid : parseInt (fcdata[0]['area-w'], 10);
fcdata[0]['area-h'] = (fcdata[0]['area-h'] == undefined) ? clhei : parseInt (fcdata[0]['area-h'], 10);

var asrh = viewbox[fcid][2] / viewbox[fcid][3]; // if > 1.0, it's horizontal
var asrv = viewbox[fcid][3] / viewbox[fcid][2]; // if > 1.0, it's vertical

// if the aspect ratio of the canvas is within 2/5 and 5/2, and it's different from the SVGs ratio, use the canvas's ratio for the SVGs ratio.
if (asrh >= 0.4 && asrv >= 0.4)
        {
        if (asrv == asrh) // a square... use the shorter side!
                {
                if      (fcdata[0]['area-w'] < fcdata[0]['area-h']) fcdata[0]['area-h'] = fcdata[0]['area-w'];
                else if (fcdata[0]['area-h'] < fcdata[0]['area-w']) fcdata[0]['area-w'] = fcdata[0]['area-h'];
                }

        else if (asrh > asrv) // Horizontal... use the shorter side!
                {
                var v = fcdata[0]['area-w'] * asrv;
                if (v > fcdata[0]['area-h'])
                        fcdata[0]['area-w'] = fcdata[0]['area-h'] * asrh;
                else
                        fcdata[0]['area-h'] = v;
                }

        else // Vertical... use the shorter side!
                {
                var v = fcdata[0]['area-h'] * asrh;
                if (v > fcdata[0]['area-w'])
                        fcdata[0]['area-h'] = fcdata[0]['area-w'] * asrv;
                else
                        fcdata[0]['area-w'] = v;
                }
        }

// Limiting the aspect ratio of the SVG to either 2/5 or 5/2
if ((fcdata[0]['area-w'] / fcdata[0]['area-h']) < 0.4)
        fcdata[0]['area-w'] = Math.ceil (fcdata[0]['area-h'] * 0.4);
else if ((fcdata[0]['area-h'] / fcdata[0]['area-w']) < 0.4)
        fcdata[0]['area-h'] = Math.ceil (fcdata[0]['area-w'] * 0.4);

if (fcdata[0]['bgcolor']      == undefined) fcdata[0]['bgcolor']      = '#bec8be';
if (fcdata[0]['bgStart']      == undefined) fcdata[0]['bgStart']      = '#b0c8b0';
if (fcdata[0]['bgEnd']        == undefined) fcdata[0]['bgEnd']        = '#a0b8c0';
if (fcdata[0]['bgEnd-Error']  == undefined) fcdata[0]['bgEnd-Error']  = '#e0a0a0';
if (fcdata[0]['bgAction']     == undefined) fcdata[0]['bgAction']     = '#90a030';
if (fcdata[0]['bgQuestion']   == undefined) fcdata[0]['bgQuestion']   = '#d09030';
if (fcdata[0]['bgSwitch']     == undefined) fcdata[0]['bgSwitch']     = '#d09030';

svg.attr ('style', 'stroke-width: 0px; background-color: ' + fcdata[0]['bgcolor'] + ';');
svg.attr ('width', fcdata[0]['area-w'] + 'px');
svg.attr ('height', fcdata[0]['area-h'] + 'px');
svg.get (0).setAttribute ('viewBox', viewbox[fcid].join (' '));

svg.mouseenter (show_onmouseenter);
svg.mouseleave (show_onmouseleave);
svg.mousemove (show_onmousemove);

xws[mp] = yws[mp] = xws[mp * 2 + 1] = yws[mp * 2 + 1] = fcdata[0]['elborder'];
for (i = 0; i < mp; ++i)
        {
        xws[i] = yws[i] = fcdata[0]['pawidth'] / mp;
        xws[i + mp + 1] = fcdata[0]['item-w'] / mp;
        yws[i + mp + 1] = fcdata[0]['item-h'] / mp;
        }

var bx, by;
for (by = i = 0; i < viewbox[fcid][3]; )
        {
        for (l = 0; l < yws.length && i < viewbox[fcid][3]; ++l)
                {
                for (bx = j = 0; j < viewbox[fcid][2]; )
                        {
                        for (k = 0; k < xws.length && j < viewbox[fcid][2]; ++k)
                                {
//                              if (!i) svg.append (SVG ('line', { x1: j, x2: j, y1: 0, y2: viewbox[fcid][3], style: 'stroke:#e0e0ff;stroke-width:1' }));
                                if (bx < rbx && by < rby)
                                        {
                                        rbox[by][bx][5] = j;
                                        rbox[by][bx][6] = i;
                                        }
                                j += xws[k];
                                ++bx;
                                }
                        }
//              svg.append (SVG ('line', { y1: i, y2: i, x1: 0, x2: viewbox[fcid][2], style: 'stroke:#e0e0ff;stroke-width:1' }));
                i += yws[l];
                ++by;
                }
        }

svg.css ('font-weight', 'normal');
svg.css ('font-style', 'normal');
svg.css ('font-variant', 'normal');
svg.css ('font-strech', 'normal');
svg.css ('font-family', 'Bitstream Vera Sans');
svg.css ('fill', '#000000');
svg.css ('stroke', 'none');
svg.css ('text-anchor', 'middle');
svg.css ('writing-mode', 'lr-tb');
svg.css ('font-size', fcdata[0]['text-size'] + 'px');

for (i = (fca.length - 1); i >= 0; --i)
        show_element (fca[i]);

//            left          right        up            down
dirs = [ [ -1, 0, 1 ], [ 1, 0, 2 ], [ 0, -1, 4 ], [ 0, 1, 8 ] ];
var pathcosts = [];

k = (mp >> 1);
pathcosts[k] = pathcosts[mp] = 10;
for (i = 0; i < k; ++i)
        pathcosts[i] = pathcosts[mp - (i + 1)] = 10 + (k - i) * 1;

routestack.map (function (x) { route_connections (x, pathcosts); });

draw_connections (fcdata[0]['item-w'], fcdata[0]['item-h'], fcdata[0]['pawidth']);

candim[fcid] = [ viewbox[fcid][2], viewbox[fcid][3], fcdata[0]['item-w'], fcdata[0]['item-h'], fcdata[0]['area-w'], fcdata[0]['area-h'] ];

/*
for (l = '    ', j = 0; j < rbox[i].length; ++j)
        l += sprintf ("%2d ", j);
console.log (l);
for (i = 0; i < rbox.length; ++i)
        {
        l = sprintf ("%2d: ", i);
        for (j = 0; j < rbox[i].length; ++j)
                {
//              l += sprintf ("%2d%d ", rbox[i][j][2], rbox[i][j][7] == null ? 0 : 1);
                l += sprintf ("%2d%2d ", rbox[i][j][0], rbox[i][j][1]);
//              l += sprintf ("%2d ", (rbox[i][j][9] >= 0) ? rbox[i][j][9] : rbox[i][j][2]);
                }
        console.log (l);
        }
console.log ('');
*/
}

//==============================================================================
//
//
//
//==============================================================================

function show_wheel (t)
{
if (zoomid == null || zoomid == undefined || zoomid == '')
        {
        var id, ta;
        for (id = (ta = t['target'])['id']; id == undefined || id == '' || candim[id] == undefined; id = (ta = ta['parentNode'])['id']) ;
        zoomid = id;
        zoomta = ta;
        }
if (!screvst)
        {
        $(window).bind ('mousewheel DOMMouseScroll', function(event){ return false});
        zoomid = (zoomta = t['target'])['id'];
        screvst = 1;
        }

var cd = candim[zoomid];
var cw = cd[0];
var ch = cd[1];
var ew = cd[2] * 2.5;
var eh = cd[3];
var svgw = cd[4];
var svgh = cd[5];
var vb = viewbox[zoomid];
var vb2, vb3, ax = 1, ay = 1;

if      (cw > ch) ay = ch / cw;
else if (cw < ch) ax = cw / ch;

var ud = t['deltaY'];
ud = ((ud > 0) ? 1 : ((ud < 0) ? -1 : 0)) * 25;
vb2 = vb[2] - ud * ax;
vb3 = vb[3] - ud * ay;

if (((ud > 0) && (vb2 >= ew) && (vb3 >= eh)) || ((ud < 0) && (vb2 <= cw) && (vb3 <= ch)))
        {
        vb[2] = vb2;
        vb[3] = vb3;
        }

vb[0] = ((t['clientX'] - woff[0]) / svgw) * (cw - vb[2]);
vb[1] = ((t['clientY'] - woff[1]) / svgh) * (ch - vb[3]);

if (vb[0] < 0) vb[0] = 0;
if (vb[1] < 0) vb[1] = 0;

zoomta.setAttribute ('viewBox', vb.join (' '));
}

//==============================================================================
//
//
//
//==============================================================================

function show_onmousemove (t)
{
if (zoomid == null || zoomid == undefined || zoomid == '')
        {
        var id, ta;
        for (id = (ta = t['target'])['id']; id == undefined || id == '' || candim[id] == undefined; id = (ta = ta['parentNode'])['id']) ;
        zoomid = id;
        zoomta = ta;
        }
if (!screvst)
        {
        $(window).bind ('mousewheel DOMMouseScroll', function(event){ return false});
        zoomid = (zoomta = t['target'])['id'];
        screvst = 1;
        }

var cd = candim[zoomid];
var cw = cd[0];
var ch = cd[1];
var svgw = cd[4];
var svgh = cd[5];
var vb = viewbox[zoomid];

vb[0] = ((t['clientX'] - woff[0]) / svgw) * (cw - vb[2]);
vb[1] = ((t['clientY'] - woff[1]) / svgh) * (ch - vb[3]);

if (vb[0] < 0) vb[0] = 0;
if (vb[1] < 0) vb[1] = 0;

zoomta.setAttribute ('viewBox', vb.join (' '));
}

//==============================================================================
//
//
//
//==============================================================================

function evh_DOMMouseScroll (e) { e.preventDefault(); }

//==============================================================================
//
//
//
//==============================================================================

function show_onmouseenter (t)
{
t['target']['onwheel'] = show_wheel;

document.addEventListener('wheel', evh_DOMMouseScroll, { passive: false });
if (!screvst)
        {
        $(window).bind ('mousewheel DOMMouseScroll', function(event){ return false});
        zoomid = (zoomta = t['target'])['id'];
        screvst = 1;
        }

if (zoomid == null || zoomid == undefined || zoomid == '')
        {
        var id, ta;
        for (id = (ta = t['target'])['id']; id == undefined || id == '' || candim[id] == undefined; id = (ta = ta['parentNode'])['id']) ;
        zoomid = id;
        zoomta = ta;
        }

svg = $('#' + zoomid);
var wp = svg.position ();

woff = [ wp['left'] - window.scrollX, wp['top'] - window.scrollY ];
}

//==============================================================================
//
//
//
//==============================================================================

function show_onmouseleave (t)
{
t['target']['onwheel'] = null;

if (screvst)
        {
        $(window).unbind ('mousewheel DOMMouseScroll');
        document.removeEventListener('wheel', evh_DOMMouseScroll, { passive: false });
        screvst = 0;
        }
zoomta = zoomid = null;
}

//==============================================================================
//
//
//
//==============================================================================

function route_connections (rse, pathcosts)
{
var sp, phv, hv, rbe, di, rbn, i, i2, j, x, y, nx, ny, px, py, el = rse[0], rte;
var teid = el[0]['eid'];
var mp = fcdata[0]['max-path'];
var sx = rbox[0].length, sy = rbox.length;
var found = null;

var rts = [];
for (i = rse[1].length - 1; i >= 0; --i)
        {
        sp = rse[1][i];
        rbe = rbox[sp[1]][sp[0]];
        if (rbe[3 + sp[2]] == -1)
                {
                rbe[9] = -2;
                rbe[10] = 0;
                rts.push ([ sp[0], sp[1], 0 ]);
                }
        }

for (; rts.length && found == null; )
        {
        rte = rts.shift ();
        rbe = rbox[(y = rte[1])][(x = rte[0])];

        for (i = 0; i < 4 && found == null; ++i)
                {
                i2 = (i >> 1) & 1;
                di = dirs[i];
                if ((nx = x + di[0]) >= 0 && nx < sx && (ny = y + di[1]) >= 0 && ny < sy)
                        {
                        rbn = rbox[ny][nx];
                        hv = (rbe[7] == null) ? 'NA' : ((y == rbe[7][1]) ? 'H' : 'V');
                        if (!rbe[i2] && !rbn[i2] && ((rbn[i2 + 3] == -1) || (rbn[i2 + 3] == teid)) && rbn[9] == -1)
                                {
                                rbn[7] = [ x, y ];
                                rbn[9] = -2;

                                if (rbe[7] == null)
                                        rbn[10] = rbe[10] + pathcosts[ ((i2 ? x : y) % (mp + 1)) ];
                                else
                                        {
                                        hv = (x == rbe[7][0]) ? 1 : 0; // 1 -> V, 0 -> H
                                        rbn[10] = rbe[10] + ((hv == i2) ? pathcosts[ ((i2 ? x : y) % (mp + 1)) ] : 50);
                                        }

                                if (rbn[2] == teid || rbn[3] == teid || rbn[4] == teid)
                                        {
                                        if (found == null || found[2] > rbe[10])
                                                found = [ nx, ny, rbe[10] ];
                                        }
                                else
                                        {
                                        if (found == null)
                                                {
                                                if (rts.length)
                                                        {
                                                        for (j = rts.length - 1; j >= 0; --j)
                                                                {
                                                                if (rbn[10] >= rts[j][2])
                                                                        {
                                                                        rts.splice (j + 1, 0, [ nx, ny, rbn[10] ]);
                                                                        break;
                                                                        }
                                                                }
                                                        if (j < 0)
                                                                rts.unshift ([ nx, ny, rbn[10] ]);
                                                        }
                                                else
                                                        rts.push ([ nx, ny, rbn[10] ]);
                                                }
                                        }
                                }
                        }
                }
        }

if (found != null)
        {
        for (phv = -1, rbe = rbox[(y = found[1])][(x = found[0])]; ; rbe = rbox[(y = rbe[7][1])][(x = rbe[7][0])])
                {
                rbe[9] = teid;

                if (rbe[7] != null)
                        {
                        hv = (x == rbe[7][0]) ? 1 : 0;
                        for (i = 0; i < 4; ++i)
                                {
                                if (x == (rbe[7][0] + dirs[i][0]) && y == (rbe[7][1] + dirs[i][1]))
                                        rbox[rbe[7][1]][rbe[7][0]][11] = dirs[i][2];
                                }
                        }

                rbe[3 + hv] = teid;

                if (hv != phv && phv != -1 && rbe[3 + phv] != teid)
                        rbe[3 + phv] = teid;

                if (rbe[7] == null)
                        {
                        for (i = rse[1].length - 1; i >= 0; --i)
                                {
                                sp = rse[1][i];
                                if (x == sp[0] && y == sp[1] && sp[3] != undefined)
                                        sp[5].append (SVG ('text', sp[3], sp[4]));
                                }
                        break;
                        }
                phv = hv;
                }
        }

for (y = rbox.length - 1; y >= 0; --y)
        {
        for (x = (rbe = rbox[y]).length - 1; x >= 0; --x)
                {
                if ((rbn = rbe[x])[9] != -1)
                        {
                        rbn[7] = null;
                        rbn[9] = -1;
                        rbn[10] = 0;
                        }
                }
        }

}

//==============================================================================
//
//
//
//==============================================================================

function draw_connections (ew, eh, pw)
{
var pastk, de, e, x, y, xl, yl, ymo, ymo, d;
var mp = fcdata[0]['max-path'];
var wsmo = (2 * mp + 2);

while (deststk.length)
        {
        de = deststk.shift ();
        e = rbox[(y = de[1])][(x = de[0])];
        xmo = x % wsmo;
        ymo = y % wsmo;
        xl = e[5] + (xws[xmo] / 2);
        yl = e[6] + (yws[ymo] / 2);

        if (e[2] != -1)
                {
                if (e[11] == 8 && e[4] == e[2])
                        svg.prepend (SVG ('polyline', { points: [ xl - 3, e[6], xl, e[6] + yws[ymo], xl + 3, e[6] ].join (' '), style: 'stroke:black;stroke-width:1;fill:none' }));

                pastk = [ 'M' + xl, e[6] + yws[ymo] ];
                }
        else
                {
                var r = fcdata[0]['corad'];
                switch (de[2])
                        {
                        case 1: d = 0; break;
                        case 2: d = 1; break;
                        case 4: d = 2; break;
                        case 8: d = 3; break;
                        }
                pastk = [ 'M' + (xl + dirs[d][0] * r), yl + dirs[d][1] * r ];
                x += dirs[d][0];
                y += dirs[d][1];
                e = rbox[y][x];
                }

        get_directions (pastk, de[3], e[11], x, y, mp, pw);
        svg.prepend (SVG ('path', { d: pastk.join (' '), style: 'stroke:black;stroke-width:1;fill:none' }));
        }
}

//==============================================================================
//
//
//
//==============================================================================

function get_directions (pa, eid, d, x, y, mp, pw)
{
var c, e, rv = 0, i, xs, ys, xl, yl, poi;
var spw = pw / mp;
var spwh = spw / 2;
var wsmo = (2 * mp + 2);

for (c = 0 ; c < 100; ++c)
        {
        rv = 0;
        if (x > 0 && rbox[y][x - 1][3] == eid)
                rv |= 1;

        if (x < (rbox[0].length - 1) && rbox[y][x + 1][3] == eid)
                rv |= 2;

        if (y > 0 && rbox[y - 1][x][4] == eid)
                rv |= 4;

        if (y < (rbox.length - 1) && rbox[y + 1][x][4] == eid)
                rv |= 8;

        e = rbox[y][x];
        xs = xws[x % wsmo];
        ys = yws[y % wsmo];
        xl = e[5] + (xs / 2);
        yl = e[6] + (ys / 2);

        if (rv == 1 && c)
                {
                pa.push ('L' + (e[5] + xs), yl);
                break;
                }

        else if (rv == 2 && c)
                {
                pa.push ('L' + e[5], yl);
                break;
                }

        else if (rv == 4 && c)
                {
                pa.push ('L' + xl, e[6] + ys);
                break;
                }

        else if (rv == 8 && c)
                {
                pa.push ('L' + xl, e[6]);
                break;
                }

        else if (rv == 3)
                x -= dirs[(d == 1) ? 0 : 1][0];

        else if (rv == 12 || e[2] > -1)
                y -= dirs[(d == 4) ? 2 : 3][1];

        else if (rv == 5)
                {
                if (d == 1) // from left to top
                        {
                        if ((e[5] + spwh) != xl)
                                pa.push ('L' + (xl - spwh), yl, 'C' + xl, yl, xl, yl, xl, yl - spwh);
                        else
                                pa.push ('L' + e[5],        yl, 'C' + xl, yl, xl, yl, xl, e[6]);
                        d = 8;
                        --y;
                        }
                else // from top to left
                        {
                        if ((e[6] + spwh) != yl)
                                pa.push ('L' + xl, yl - spwh, 'C' +  xl, yl, xl, yl, xl - spwh, yl);
                        else
                                pa.push ('L' + xl, e[6],      'C' +  xl, yl, xl, yl, e[5], yl);
                        d = 2;
                        --x;
                        }
                }

        else if (rv == 6)
                {
                if (d == 2) // from right to top
                        {
                        if ((e[5] + spwh) != xl)
                                pa.push ('L' + (xl + spwh), yl, 'C' +  xl, yl, xl, yl, xl, yl - spwh);
                        else
                                pa.push ('L' + (e[5] + xs), yl, 'C' +  xl, yl, xl, yl, xl, e[6]);
                        d = 8;
                        --y;
                        }
                else // from top to right
                        {
                        if ((e[6] + spwh) != yl)
                                pa.push ('L' + xl, yl - spwh, 'C' +  xl, yl, xl, yl, xl + spwh, yl);
                        else
                                pa.push ('L' + xl, e[6],      'C' +  xl, yl, xl, yl, e[5] + xs, yl);
                        d = 1;
                        ++x;
                        }
                }

        else if (rv == 9)
                {
                if (d == 1) // from left to bottom
                        {
                        if ((e[5] + spwh) != xl)
                                pa.push ('L' + (xl - spwh), yl, 'C' +  xl, yl, xl, yl, xl, yl + spwh);
                        else
                                pa.push ('L' + e[5],        yl, 'C' +  xl, yl, xl, yl, xl, e[6] + ys);
                        d = 4;
                        ++y;
                        }
                else // from bottom to left
                        {
                        if ((e[6] + spwh) != yl)
                                pa.push ('L' + xl, yl + spwh, 'C' +  xl, yl, xl, yl, xl - spwh, yl);
                        else
                                pa.push ('L' + xl, e[6] + ys, 'C' +  xl, yl, xl, yl, e[5], yl);
                        d = 2;
                        --x;
                        }
                }

        else if (rv == 10)
                {
                if (d == 2) // from right to bottom
                        {
                        if ((e[5] + spwh) != xl)
                                pa.push ('L' + (xl + spwh), yl, 'C' +  xl, yl, xl, yl, xl, yl + spwh);
                        else
                                pa.push ('L' + (e[5] + xs), yl, 'C' +  xl, yl, xl, yl, xl, e[6] + ys);
                        d = 4;
                        ++y;
                        }
                else // from bottom to right
                        {
                        if ((e[5] + spwh) != xl)
                                pa.push ('L' + xl, yl + spwh, 'C' +  xl, yl, xl, yl, xl + spwh, yl);
                        else
                                pa.push ('L' + xl, e[6] + ys, 'C' +  xl, yl, xl, yl, e[5] + xs, yl);
                        d = 1;
                        ++x;
                        }
                }

        else if (rv == 7 || rv == 11 || rv == 13 || rv == 14 || rv == 15)
                {
                var r = fcdata[0]['corad'];
                svg.prepend (SVG ('circle', { cx: xl, cy: yl, 'r': r, style: 'stroke:black;stroke-width:1;fill:white' }));

                if      (d == 1) pa.push ('L' + (xl - r), yl);
                else if (d == 2) pa.push ('L' + (xl + r), yl);
                else if (d == 4) pa.push ('L' + xl,       yl - r);
                else if (d == 8) pa.push ('L' + xl,       yl + r);

                if ((rv & ~d) & 1) deststk.push ([ x, y, 1, eid ]); 
                if ((rv & ~d) & 2) deststk.push ([ x, y, 2, eid ]); 
                if ((rv & ~d) & 4) deststk.push ([ x, y, 4, eid ]); 
                if ((rv & ~d) & 8) deststk.push ([ x, y, 8, eid ]);

                if (e[11] != 0)
                        {
                        if (rv & 1 && e[11] != 1)
                                svg.prepend (SVG ('polyline', { points: [ xl - r - 3, yl - 2, xl + 1 - r, yl, xl - r - 3, yl + 2 ].join (' '), style: 'stroke:black;stroke-width:1;fill:none' }));
                        if (rv & 2 && e[11] != 2)
                                svg.prepend (SVG ('polyline', { points: [ xl + r + 3, yl - 2, xl + r - 1, yl, xl + r + 3, yl + 2 ].join (' '), style: 'stroke:black;stroke-width:1;fill:none' }));
                        if (rv & 4 && e[11] != 4)
                                svg.prepend (SVG ('polyline', { points: [ xl - 2, yl - r - 3, xl, yl + 1 - r, xl + 2, yl - r - 3 ].join (' '), style: 'stroke:black;stroke-width:1;fill:none' }));
                        if (rv & 8 && e[11] != 8)
                                svg.prepend (SVG ('polyline', { points: [ xl - 2, yl + r + 3, xl, yl + r - 1, xl + 2, yl + r + 3 ].join (' '), style: 'stroke:black;stroke-width:1;fill:none' }));
                        }

                break;
                }
        }
}

//==============================================================================
//
//
//
//==============================================================================

function show_full_text (ft, eid, reattach)
{
var g = $('#element_' + eid);
var eh = fcdata[0]['item-h'];
var cw = fcdata[0]['fcwidth'];
var ch = fcdata[0]['fcheight'];
var ts = fcdata[0]['text-size'];
var grp = ft['grp'];

g.on ('mouseenter', function (e)
        {
        if (ft['timerout'] != null)
                {
                clearTimeout (ft['timerout']);
                ft['timerout'] = null;
                }

        if (ft['timerin'] == null && ft['popup'] == null)
                {
                ft['timerin'] = window.setTimeout (function ()
                        {
                        var gr, t, ani, pa, ol, nol, height, c = 0;

                        pa = g.parent ();
                        svg.append (pa.detach ());
                        if (reattach)
                                pa.append (g.detach ());

                        ft['timerin'] = null;
                        nol = (ol = ft['text']).length;
                        height = (nol * (ts + 2)) + 10;
                        var x = ft['x'], y = ft['y'] - ((height - eh) / 2) - (ts + 2), wot = ft['width'] + 8;

                        if (x < (wot / 2))        x = wot / 2;
                        if (y < 0)                y = 0;
                        if ((x + (wot / 2)) > cw) x = (cw - (wot / 2)) - 1;
                        if ((y + height) > ch)    y = (ch - height) - 1;

                        gr = SVG ('g', { 'opacity': 0 });
                        grp.append (gr);
                        t = SVG ('rect', { 'x': x - (wot / 2), 'y': y, width: wot, 'height': height, rx: 4, ry: 4, style: "stroke:black; stroke-width:1; fill:#ffffc0" });
                        ani = SVG ('animate', { 'attributeName': 'opacity', 'begin': 'indefinite', 'dur': '0.15s', 'from': 0, 'to': 1, 'restart': 'never', 'fill': 'freeze' });
                        ft['popup'] = [ t, ani, gr ];
                        gr.append (t);
                        for (i = j = 0; i < nol; ++i, j += (ts + 2))
                                {
                                gr.append ((t = SVG ('text', { 'x': x, 'y': y + j + ts + 5, style: 'font-size:' + ts + 'px' }, ol[i])));
                                ft['popup'].unshift (t);
                                }
                        gr.append (ani);
                        ani.beginElement ();
                        }, 1500);
                }
        });

g.on ('mouseleave', function (e)
        {
        if (ft['timerin'] != null)
                {
                clearTimeout (ft['timerin']);
                ft['timerin'] = null;
                }

        if (ft['timerout'] == null && ft['popup'] != null)
                {
                var gr = ft['popup'][ft['popup'].length - 1];
                var ani = SVG ('animate', { 'attributeName': 'opacity', 'begin': 'indefinite', 'dur': '0.15s', 'from': 1, 'to': 0, 'restart': 'never', 'fill': 'freeze' });
                gr.append (ani);
                ani.beginElement ();
                ft['popup'].unshift (ani);

                ft['timerout'] = window.setTimeout (function ()
                        {
                        ft['timerout'] = null;
                        if (ft['popup'] != null)
                                {
                                ft['popup'].map (function (t) { t.remove (); });
                                ft['popup'] = null;
                                }
                        }, 160);
                }
        });
}

//==============================================================================
//
//
//
//==============================================================================

function show_element (el)
{
var ew = fcdata[0]['item-w'];
var eh = fcdata[0]['item-h'];
var ts = fcdata[0]['text-size'];
var ml = fcdata[0]['max-lines'];
var mp = fcdata[0]['max-path'];
var bg = (el[0]['color'] != undefined) ? el[0]['color'] : fcdata[0]['bg' + el[0]['type']];
var bo = fcdata[0]['elborder'];
var pa = fcdata[0]['pawidth'];

var x = (el[0]['col'] * (ew + bo * 2)) + ((1 + el[0]['col']) * pa);
var y = (el[0]['row'] * (eh + bo * 2)) + ((1 + el[0]['row']) * pa);

var svga;

if (el[0]['url'] != undefined && el[0]['url'] != '')
        {
        svga = SVG ('a', { href: el[0]['url'], style: 'cursor:pointer;text-decoration:none;' });
        svg.append (svga);
        }
else if (el[0]['alturl'] != undefined && el[0]['alturl'] != '')
        {
        svga = SVG ('a', { href: el[0]['alturl'], 'target': '_blank', style: 'cursor:pointer;text-decoration:none;' });
        svg.append (svga);
        }
else
        svga = svg;

switch (el[0]['type'])
        {
        case 'Start':
        case 'End-Error':
        case 'End':       show_element_oval     (svga, x, y, el, ew, eh, ts, ml, bg, bo, pa, mp);  break;
        case 'Action':    show_element_box      (svga, x, y, el, ew, eh, ts, ml, bg, bo, pa, mp);  break;
        case 'Question':  show_element_question (svga, x, y, el, ew, eh, ts, ml, bg, bo, pa, mp);  break;
        case 'Switch':    show_element_switch   (svga, x, y, el, ew, eh, ts, ml, bg, bo, pa, mp);  break;
        }

}

//==============================================================================
//
//
//
//==============================================================================

function show_element_box (svga, xe, ye, el, ew, eh, ts, ml, bg, bo, pa, mp)
{
var r = 5, x = xe + bo, y = ye + bo;
var w = (el[0]['len'] * ew) + ((el[0]['len'] - 1) * (2 * bo + pa));

var dests = Object.keys (el[1]);
if (dests.length)
        {
        var delem = el[1][dests[0]];

        if ((delem != null) && (((el[0]['col'] + el[0]['len'] / 2) == (delem[0]['col'] + delem[0]['len'] / 2)) && ((el[0]['row'] + 1) == delem[0]['row'])))
                {
                var i, j = (el[0]['row'] + 1) * (2 * mp + 2) - 1, c = (el[0]['col'] + 1) * (2 * mp + 2) + (mp >> 1), teid = delem[0]['eid'];

                for (i = mp + 1; i >= 0; --i)
                        {
                        rbox[j + i][c][4] = teid;
                        rbox[j + i][c][11] = 8;
                        }
                }
        else
                routestack.push ([ fco[el[0]['goto']], [ [ (el[0]['col'] + 1) * (2 * mp + 2) + (mp >> 1), (el[0]['row'] + 1) * (2 * mp + 2) - 1, 1 ] ] ]);
        }

var la = [ [], [] ];
var rq = Math.pow (r, 2);
var yt, yb;

for (i = 0, yt = 2, yb = ts + 4; i < ml; ++i, yt += (ts + 2), yb += (ts + 2))
        {
        if (yt < r)
                la[ml & 1][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow (r - yt, 2)))));
        else if (yb >= (eh - r))
                la[ml & 1][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow ((eh - r) - yb, 2)))));
        else
                la[ml & 1][i] = w - 4;
        }

for (i = 0, yt = 3 + ts / 2, yb = 5 + ts * 1.5; i < (ml - 1); ++i, yt += (ts + 2), yb += (ts + 2))
        {
        if (yt < r)
                la[1 - (ml & 1)][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow (r - yt, 2)))));
        else if (yb >= (eh - r))
                la[1 - (ml & 1)][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow (yb - (eh - r), 2)))));
        else
                la[1 - (ml & 1)][i] = w - 4;
        }

var ft = show_text (svga, el[0]['eid'], x + w / 2, (ts + 2) + y, el[0]['title'], ts, ml, la);
if (ft != null)
        show_full_text (ft, el[0]['eid'], 0);
(ft ? ft['grp'] : svga).prepend (SVG ('rect', { 'x': x, 'y': y, width: w, height: eh, rx: r, ry: r, style: "stroke:black; stroke-width:1; fill:" + bg }));
}

//==============================================================================
//
//
//
//==============================================================================

function show_element_oval (svga, xe, ye, el, ew, eh, ts, ml, bg, bo, pa, mp)
{
var r = eh / 2, x = xe + bo, y = ye + bo;
var w = (el[0]['len'] * ew) + ((el[0]['len'] - 1) * (2 * bo + pa));

var dests = Object.keys (el[1]);
if (dests.length)
        {
        var delem = el[1][dests[0]];

        if ((delem != null) && (((el[0]['col'] + el[0]['len'] / 2) == (delem[0]['col'] + delem[0]['len'] / 2)) && ((el[0]['row'] + 1) == delem[0]['row'])))
                {
                var i, j = (el[0]['row'] + 1) * (2 * mp + 2) - 1, c = (el[0]['col'] + 1) * (2 * mp + 2) + (mp >> 1), teid = delem[0]['eid'];

                for (i = mp + 1; i >= 0; --i)
                        {
                        rbox[j + i][c][4] = teid;
                        rbox[j + i][c][11] = 8;
                        }
                }
        else
                routestack.push ([ fco[el[0]['goto']], [ [ (el[0]['col'] + 1) * (2 * mp + 2) + (mp >> 1), (el[0]['row'] + 1) * (2 * mp + 2) - 1, 1 ] ] ]);
        }

var la = [ [], [] ];
var rq = Math.pow (r, 2);
var yt, yb;

for (i = 0, yt = 2, yb = ts + 4; i < ml; ++i, yt += (ts + 2), yb += (ts + 2))
        {
        if (yt < r)
                la[ml & 1][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow (r - yt, 2)))));
        else if (yb >= (eh - r))
                la[ml & 1][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow ((eh - r) - yb, 2)))));
        else
                la[ml & 1][i] = w - 4;
        }

for (i = 0, yt = 3 + ts / 2, yb = 5 + ts * 1.5; i < (ml - 1); ++i, yt += (ts + 2), yb += (ts + 2))
        {
        if (yt < r)
                la[1 - (ml & 1)][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow (r - yt, 2)))));
        else if (yb >= (eh - r))
                la[1 - (ml & 1)][i] = w - (4 + 2 * (r - Math.ceil (Math.sqrt (rq - Math.pow (yb - (eh - r), 2)))));
        else
                la[1 - (ml & 1)][i] = w - 4;
        }

var ft = show_text (svga, el[0]['eid'], x + w / 2, (ts + 2) + y, el[0]['title'], ts, ml, la);
if (ft != null)
        show_full_text (ft, el[0]['eid'], 0);
(ft ? ft['grp'] : svga).prepend (SVG ('rect', { 'x': x, 'y': y, width: w, height: eh, rx: r, ry: r, style: "stroke:black; stroke-width:1; fill:" + bg }));
}

//==============================================================================
//
//
//
//==============================================================================

function show_element_question (svga, xe, ye, el, ew, eh, ts, ml, bg, bo, pa, mp)
{
var x = xe + bo, y = ye + bo;
var w = (el[0]['len'] * ew) + ((el[0]['len'] - 1) * (2 * bo + pa));
var yt, yb, xi = w / eh, rl = 3, ynl = 3;
var ynsre, delem, i, j, co, ro, teid, yn;
var yns = [];
var ynsr = [];

if (yesno == null)
        get_yesno_sizes (ts, xi, bo);

var dests = Object.keys (el[1]);
if (dests.length)
        {
        ro = el[0]['row'] * (2 * mp + 2) + (mp + 1 + (mp >> 1));

        for (j = 0; j < dests.length; ++j)
                {
                yn = el[0]['order'][j];
                if ((delem = el[1][dests[j]]) != null)
                        {
                        teid = delem[0]['eid'];
                        yn = (delem[0]['id'] == el[0]['yes']) ? 'yes' : 'no';
                        if ((el[0]['row'] + 1) == delem[0]['row'])
                                {

                                if (el[0]['col'] == (delem[0]['col'] + delem[0]['len'] / 2))
                                        {
                                        co = el[0]['col'] * (2 * mp + 2) + (mp >> 1);
                                        for (i = 0; i < (mp + 3 + (mp >> 1)); ++i)
                                                {
                                                rbox[ro + i][co][4] = teid;
                                                rbox[ro + i][co][11] = 8;
                                                }
                                        for (i = 0; i <= (mp >> 1) + 1; ++i)
                                                {
                                                rbox[ro][co + i][3] = teid;
                                                rbox[ro][co + i][11] = 1;
                                                }
                                        yns.push (SVG ('text', { 'x': x - bo, 'y': y + (eh / 2) + ts + yesno[yn][1], style: 'text-anchor:start;font-size:' + ts + 'px' }, yn));
                                        rl &= 2;
                                        ynl &= (yn == 'yes') ? 2 : 1;
                                        }

                                else if (el[0]['col'] == (delem[0]['col'] - delem[0]['len'] / 2))
                                        {
                                        co = (el[0]['col'] + 2) * (2 * mp + 2) + (mp >> 1);
                                        for (i = 0; i < (mp + 3 + (mp >> 1)); ++i)
                                                {
                                                rbox[ro + i][co][4] = teid;
                                                rbox[ro + i][co][11] = 8;
                                                }
                                        for (i = 0; i <= (mp >> 1) + 1; ++i)
                                                {
                                                rbox[ro][co - i][3] = teid;
                                                rbox[ro][co - i][11] = 2;
                                                }
                                        yns.push (SVG ('text', { 'x': x + w + bo - yesno[yn][0], 'y': y + (eh / 2) + ts + yesno[yn][1], style: 'text-anchor:start;font-size:' + ts + 'px' }, yn));
                                        rl &= 1;
                                        ynl &= (yn == 'yes') ? 2 : 1;
                                        }

                                else if ((el[0]['col'] + el[0]['len'] / 2) == (delem[0]['col'] + delem[0]['len'] / 2))
                                        {
                                        co = (el[0]['col'] + 1) * (2 * mp + 2) + (mp >> 1);
                                        for (i = 0; i < (mp + 2); ++i)
                                                {
                                                rbox[ro + i + 1 + (mp >> 1)][co][4] = teid;
                                                rbox[ro + i + 1 + (mp >> 1)][co][11] = 8;
                                                }
                                        yns.push (SVG ('text', { 'x': x + ew + bo + pa + yesno[yn][2], 'y': y + eh + bo - 2, style: 'text-anchor:start;font-size:' + ts + 'px' }, yn));
                                        rl &= 2;
                                        ynl &= (yn == 'yes') ? 2 : 1;
                                        }

                                }
                        }
                }
        for (j = 0; rl && j < dests.length; ++j)
                {
                yn = el[0]['order'][j];

                if (((yn == 'yes') && (ynl & 1)) || ((yn == 'no') && (ynl & 2)))
                        {
                        if ((i = rl) == 3)
                                {
                                console.log ('yn: ' + yn);
                                console.log (el[0]);
                                i &= (Math.abs (el[0]['col'] - fco[el[0][yn]][0]['col']) < Math.abs ((el[0]['col'] + 2) - fco[el[0][yn]][0]['col'])) ? 1 : 2;
                                }
                        if (i & 1)
                                {
                                rl &= 2;
                                ynl &= (yn == 'yes') ? 2 : 1;
                                var rse = [
                                        fco[el[0][yn]], [
                                                (ynsre = [ el[0]['col'] * (2 * mp + 2) + mp, el[0]['row'] * (2 * mp + 2) + (mp + 1 + (mp >> 1)), 0,
                                                { 'x': x - bo, 'y': y + (eh / 2) + ts + yesno[yn][1], style: 'text-anchor:start;font-size:' + ts + 'px' }, yn ])
                                                ]
                                        ];
                                ynsr.push (ynsre);

                                if (i == 1)
                                        {
                                        rse[1].push ( (ynsre = [ (el[0]['col'] + 2) * (2 * mp + 2) - 1, el[0]['row'] * (2 * mp + 2) + (mp + 1 + (mp >> 1)), 0,
                                                { 'x': x + w + bo - yesno[yn][0], 'y': y + (eh / 2) + ts + yesno[yn][1], style: 'text-anchor:start;font-size:' + ts + 'px' }, yn ]));
                                        ynsr.push (ynsre);
                                        }
                                if (el[1][dests[j]] == null) routestack.push (rse); else routestack.unshift (rse);
                                }
                        if (i & 2)
                                {
                                rl &= 1;
                                ynl &= (yn == 'yes') ? 2 : 1;
                                var rse = [
                                        fco[el[0][yn]], [
                                                (ynsre = [ (el[0]['col'] + 2) * (2 * mp + 2) - 1, el[0]['row'] * (2 * mp + 2) + (mp + 1 + (mp >> 1)), 0,
                                                { 'x': x + w + bo - yesno[yn][0], 'y': y + (eh / 2) + ts + yesno[yn][1], style: 'text-anchor:start;font-size:' + ts + 'px' }, yn ])
                                                ]
                                        ];
                                ynsr.push (ynsre);

                                if (i == 2)
                                        {
                                        rse[1].push ( (ynsre = [ el[0]['col'] * (2 * mp + 2) + mp, el[0]['row'] * (2 * mp + 2) + (mp + 1 + (mp >> 1)), 0,
                                                { 'x': x - bo, 'y': y + (eh / 2) + ts + yesno[yn][1], style: 'text-anchor:start;font-size:' + ts + 'px' }, yn ]));
                                        ynsr.push (ynsre);
                                        }
                                if (el[1][dests[j]] == null) routestack.push (rse); else routestack.unshift (rse);
                                }
                        }
                }
        }

var la = [ [], [] ];

for (i = 0, yt = 2, yb = ts + 4; i < ml; ++i, yt += (ts + 2), yb += (ts + 2))
        la[ml & 1][i] = 2 * (((yb > (eh / 2)) ? (eh - yb) : yt) * xi);

for (i = 0, yt = 3 + ts / 2, yb = 5 + ts * 1.5; i < (ml - 1); ++i, yt += (ts + 2), yb += (ts + 2))
        la[1 - (ml & 1)][i] = 2 * (((yb > (eh / 2)) ? (eh - yb) : yt) * xi);

var ft = show_text (svga, el[0]['eid'], x + w / 2, (ts + 2) + y, el[0]['title'], ts, ml, la);
if (ft != null)
        show_full_text (ft, el[0]['eid'], 0);

yns.push (SVG ('polygon', { points: [ x + w / 2, y, x + w, y + 0.5 * eh, x + w / 2, y + eh, x, y + 0.5 * eh ].join (' '), style: "stroke:black; stroke-width:1; fill:" + bg }));
yns.map (function (e) { (ft ? ft['grp'] : svga).prepend (e); });
ynsr.map (function (e) { e[5] = ft ? ft['grp'] : svga; });
}

//==============================================================================
//
//
//
//==============================================================================

function show_element_switch (svga, xe, ye, el, ew, eh, ts, ml, bg, bo, pa, mp)
{
var x = xe + bo, y = ye + bo;
var i, j, ca, col, s, w, xx, yy = y + eh, teid, ro, delem, co, dests, ts2;
cols = [];

if (el[0]['order'] != undefined)
        {
        dests = [];
        for (i = 0; i < el[0]['order'].length; ++i)
                dests.push (el[0][el[0]['order'][i]]);
        }
else
        dests = Object.keys (el[1]);

w = (ew * el[0]['len']) + ((el[0]['len'] - 1) * (2 * bo + pa));
ts2 = ts - 2;
var poi = [ x, yy - ts2, x, y, x + w, y, x + w, yy - ts2 ];

if (dests.length)
        {
        ro = (el[0]['row'] + 1) * (2 * mp + 2) - 1;

        col = el[0]['col'] + el[0]['len'];
        for (j = dests.length - 1; j >= 0; --j)
                {
                if (((delem = el[1][dests[j]]) != null) && ((delem[0]['row'] - 1) == el[0]['row']) && ((col = delem[0]['col']) < (el[0]['col'] + el[0]['len'] - 1)))
                        {
                        cols.unshift (col);
                        co = (el[0]['col'] + 1) * (2 * mp + 2) + col * (2 * mp + 2) + (mp >> 1);
                        teid = delem[0]['eid'];
                        if ((el[0]['row'] + 1) == delem[0]['row'])
                                {
                                if ((el[0]['col'] + col + 1) == (delem[0]['col'] + delem[0]['len'] / 2))
                                        {
                                        for (i = mp + 1; i >= 0; --i)
                                                rbox[ro + i][co][4] = teid;
                                        }
                                }
                        }
                else
                        {
                        cols.unshift (col);
                        co = (el[0]['col'] + 1) * (2 * mp + 2) + col * (2 * mp + 2) + (mp >> 1);
                        routestack.push ([ fco[dests[j]], [ [ co, ro, 1 ] ] ]);
                        }

                xx = x + ((col + 1) * ew) + ((col + 0.5) * (2 * bo + pa));
                poi.push ( xx + 6, yy - ts2, xx + 6, yy - (ts2 / 2), xx, yy, xx - 6, yy - (ts2 / 2), xx - 6, yy - ts2 );
                col -= 2;
                }
        }
svga.append (SVG ('polygon', { points: poi.join (' '), style: "stroke:black; stroke-width:1; fill:" + bg }));

var la = [ [], [] ];
var ml1 = ((ml - 1) >> 1), ml2 = (ml >> 1);

for (i = 0; i < ml1; ++i)
        la[ml1 & 1][i] = w - 6;

for (i = 0; i < (ml1 - 1); ++i)
        la[1 - (ml1 & 1)][i] = w - 6;

var ft = show_text (svga, el[0]['eid'] + '_S', x + w / 2, (ts + 2) + y, el[0]['title'], ts, ml1, la);
if (ft != null)
        {
        show_full_text (ft, el[0]['eid'] + '_S', 1);
        ft['grp'].prepend (SVG ('rect', { 'x': x + 3, 'y': y + 2, 'width': w - 6, 'height': ml1 * (ts + 2) + 2, style: "stroke:none; fill:" + bg }));
}

if (el[0]['order'] == undefined)
        {
        var els = Object.keys (el[0]);
        var pat = /^case\(.*\)$/;
        ca = els.filter (function (e) { return (pat.test (e)); });
        ca.sort (function (a, b) { var va = el[0][a], vb = el[0][b]; return ((va > vb) ? 1 : ((va < vb) ? -1 : 0)); });
        }
else
        ca = el[0]['order'];

for (i = ca.length - 1; i >= 0; --i)
        {
        la = [ [], [] ];

        for (j = 0; j < ml2; ++j)
                la[ml2 & 1][j] = (2 * ew) + pa;

        for (j = 0; j < (ml2 - 1); ++j)
                la[1 - (ml2 & 1)][j] = (2 * ew) + pa;

        s = ca[i];
        ft = show_text (svga, el[0]['eid'] + '_C_' + i, x + ((1 + cols[i]) * ew) + ((cols[i] + 0.5) * (2 * bo + pa)), ((ml1 + 1) * (ts + 2)) + y + 4, s.substr (5, s.length - 6), ts, ml2, la);
        if (ft != null)
                show_full_text (ft, el[0]['eid'] + '_C_' + i, 1);
        (ft ? ft['grp'] : svga).prepend (SVG ('rect', { 'x': x + (cols[i] * (ew + pa + 2 * bo)) + bo, 'y': (ml1 * (ts + 2)) + y + 6, 'width': (2 * ew) + pa, 'height': ml2 * (ts + 2) + 2, style: "stroke:none; fill:" + bg }))
        }
}

//==============================================================================
//
//
//
//==============================================================================

function SVG (tag, a, inner)
{
var rv = document.createElementNS ('http://www.w3.org/2000/svg', tag);
var i;

if (a != undefined)
        {
        for (i in a)
                rv.setAttributeNS (null, i, a[i]);
        }

if (inner != undefined)
        rv.appendChild (document.createTextNode (inner));

return (rv);
}

//==============================================================================
//
//
//
//==============================================================================

function initial_traverse_data (d)
{
var i, eid, e, es, el, w, rv = [], sx = 0, sy = 0;

d[0]['eid'] = eid = fca.length;
d[0]['row'] = d[0]['col'] = -1;
d[0]['len'] = 0;
fca.push (d);
fco[d[0]['id']] = d;
var plh = (d[0]['type'] == 'Switch') ? -3 : -2;

if ((es = d[0]['order']) != undefined)
        w = es.map (function (e) { return (((el = d[1][d[0][e]]) != null) ? initial_traverse_data (el) : [[plh, plh]]); });
else
        {
        es = Object.keys (d[1]);
        console.log (es);
        if (es.length == 0)
                console.log (d);
        es.sort ( function (a, b) { return ((a < b) ? -1 : ((a == b) ? 0 : 1)); });
        w = es.map (function (e) { return (((el = d[1][e]) != null) ? initial_traverse_data (el) : [[plh, plh]]); });
        }

if (w.length)
        {
        while (w.length > 1)
                {
                var e1 = w.shift ();
                var e2 = w.shift ();
                w.unshift (merge (e1, e2));
                }
        }
else
        w.push ([]);

switch (d[0]['type'])
        {
        case 'End':
        case 'End-Error':
                rv = [eid, eid];
                break;
        case 'Start':
        case 'Action':
        case 'Question':
                rv = add_new_top (eid, w[0][0], 2);
                break;
        case 'Switch':
                rv = add_new_top (eid, w[0][0], -1);
                break;
        }
w[0].unshift (rv);

return w[0];
}

//==============================================================================
//
//
//
//==============================================================================

function add_new_top (eid, tel, ms)
{
var rv = [];
var w = tel.length;
var i, j;

for (i = 0; i < w; ++i)
        rv.push (-1);

for (j = w - 1; j >= 0 && tel[j] == -1; --j);
for (i = 0; i < j && tel[i] == -1; ++i);

if (ms > -1)
        {
        i += ((1 + (j - i)) - ms) >> 1;
        j = (i - 1) + ms;
        }
while (i <= j)
        rv[i++] = eid;

return rv;
}

//==============================================================================
//
//
//
//==============================================================================

function merge (e1, e2)
{
var i, j, k, l;
var h1 = e1.length, h2 = e2.length;
var w1 = e1[0].length, w2 = e2[0].length;
var mch = (h1 > h2) ? h2 : h1;
var mh = (h1 > h2) ? h1 : h2, mw;
var rv = [];

outer_loop: for (i = w1 - 1; i >= 0; --i)
        {
        for (l = 0, j = i; j < w1; ++j, ++l)
                {
                for (k = 0; k < mch; ++k)
                        {
                        if ((e1[k][j] > -1 || e1[k][j] == -3) && (e2[k][l] > -1 || e2[k][l] == -3))
                                break outer_loop;
                        }
                }
        }
++i;
mw = i + w2;

for (j = 0; j < mh; ++j)
        {
        rv.push ([]);
        for (k = 0; k < mw; ++k)
                rv[j].push (-1);
        }

for (j = 0; j < h1; ++j)
        {
        for (k = 0; k < w1; ++k)
                rv[j][k] = e1[j][k];
        }

for (j = 0; j < h2; ++j)
        {
        for (k = 0; k < w2; ++k)
                if (e2[j][k] > -1 || e2[j][k] == -3)
                        rv[j][k + i] = e2[j][k];
        }

return (rv);
}

//==============================================================================
//
//
//
//==============================================================================

function show_text (svga, eid, x, y, txt, ts, ml, llens)
{
var i, j, k, s, sl, llen, lc, ol;
var l = (ml >> 1) - ((ml & 1) ? 0 : 1);

var t = SVG ('text', { 'x': x, 'y': y + (((ml - 1) / 2) * (ts + 2)), style: 'font-size:' + ts + 'px' }, txt);
svga.append (t);
var tl = t.getComputedTextLength ();
if (tl <= llens[ml & 1][l])
        return (null);
t.remove ();

var lines = [];
var words = txt.split (/\s+/);
var wordlen = words.map (function (w) {
        var t = SVG ('text', { 'x': 0, 'y': 0, style: 'font-size:' + ts + 'px' }, w);
        svga.append (t);
        var tl = t.getComputedTextLength ();
        t.remove ();
        return (tl);
        });

for (i = j = 0; i < words.length; ++i)
        j += wordlen[i];
var spl = (tl - j) / (words.length - 1);

for (i = 2; i <= ml; ++i)
        {
        ol = [];
        s = '';
        lc = sl = 0;

        llen = llens[i & 1][((ml - i) >> 1) + lc];
        for (j = 0; j < words.length && lc < i; ++j)
                {
                if ((sl + wordlen[j] + (sl ? spl : 0)) > llen)
                        {
                        if (sl)
                                {
                                --j;
                                ol.push (s);
                                }
                        else
                                ol.push (words[j]);
                        ++lc;
                        llen = llens[i & 1][((ml - i) >> 1) + lc];
                        s = '';
                        sl = 0;
                        }
                else
                        {
                        s += (sl ? ' ' : '') + words[j];
                        sl += wordlen[j] + (sl ? spl : 0);
                        }
                }
        if (j >= words.length || lc >= ml)
                {
                if (sl)
                        ol.push (s);
                s = (ml - i) / 2;
                for (k = 0; k < ol.length; ++k)
                        lines.push (SVG ('text', { 'x': x, 'y': y + ((k + s) * (ts + 2)), style: 'font-size:' + ts + 'px' }, ol[k]));
                break;
                }
        }

if (j >= words.length)
        {
        lines.map (function (e) { svga.append (e); });
        return (null);
        }

var grp = SVG ('g', { 'id': 'element_' + eid});
lines.map (function (e) { grp.append (e); });
svga.append (grp);

// If there are too many words for the 'regular' area, prepare for a baloon

// estimating windowsize for full text with similar aspect to SVG area
var nolr = Math.sqrt ((tl / (ts + 2)) / 2);
var nol = Math.ceil (nolr);
var wot = Math.ceil (tl / Math.floor ((nolr - 0.8)));
var lw = 0;

// get length of longest word and if it's longer than the previosly estimated windowsize, use that as windowsize.
wordlen.map (function (w) { if (w > lw) lw = w; });
if (lw > wot)
        wot = lw;

for (ol = [], s = [], sl = i = 0; i < words.length; ++i)
        {
        if ((sl + wordlen[i] + (sl ? spl : 0)) > wot)
                {
                ol.push (s.join (' '));
                s = [ words[i] ];
                sl = wordlen[i];
                }
        else
                {
                s.push (words[i]);
                sl += (wordlen[i] + (sl ? spl : 0));
                }
        }
if (sl)
        ol.push (s.join (' '));

return ({ 'text': ol, 'x': x, 'y': y, 'width': wot, 'popup': null, 'timerin': null, 'timerout': null, 'grp': grp });
}

//==============================================================================
//
//
//
//==============================================================================

function get_yesno_sizes (ts, xi, bo)
{
var l, t, s;
var yn = [ 'yes', 'no' ];
yesno = {};

for (s in yn)
        {
        t = SVG ('text', { 'x': 0, 'y': 0, style: 'font-size:' + ts + 'px' }, yn[s]);
        svg.append (t);
        l = t.getComputedTextLength ();
        t.remove ();
        yesno[yn[s]] = [
                l,
                (l <= bo) ? 0 : ((l - bo) / xi),
                (ts <= bo) ? 0 : ((ts - bo) * xi)
                ];
        }
}

//==============================================================================
