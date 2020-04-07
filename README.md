# FlowchartPlugin
Foswiki's FlowchartPlugin

It's already some years ago, since all more populat webrosers support inline-SVG without the need of Browser Plugins.
That and the not so beautiful results of the Flowchart Plugin from 2009 tempted me, to do a complete makeover.

In the old version, the Topic was parsed and the plugin created an SVG file. Imagemagic was used, to convert the SVG to a PNG file.
A MAP file was created, to allow linking from items in the PNG to the point, where that item was located in the topic.

Not so nice features have been:
- The definition part of the items hasn't been removed from the topic in the view.
- The text in the items had to be formatted manually by inserting linebreak-macros.
- Flowpaths, that go to far away items went straight through the chart, crossing anything in its way.

This new version does no longer create an SVG file. It creates JSON Data and embeds that in the HTML, which is sent to the browser.
There in the browser, this JSON is read by the JavaScript part of this plugin.
The SVG is written straight into the browsers DOM.
This allows, to "measure" the size of each word, that will go into the items. By knowing the size, formatting can be automated.
That way, it's always beatuiful.
Text, that is so long, that it doesn't fit into the item is truncated. It becomes visible, if the mouse hovers over such an item.

Linking to the area, where the definition of an Item resides can be done directly in SVG. No MAP file is needed any longer.

The definition part of each item will no longer be shown on the browser - it's removed from the view. Nobody needs to see that.

Flowpaths, that go to far away items are now drawn around items. They are no longer crossing items.

The aspect ratio of the flowchart area is automatically limited between 2/5 and 5/2.

Zooming in and out can be done with the mousewheel.
The content shown will be panned, when the mousepointer moves over the image, while it's zoomed in.

Known ugly "feature": Some browsers obviously cannot render fonts with fractions of "points".
This leads to growing text, while zooming.
It looks, as if the browser uses the next higher integer value for the fontsize, so 11.1 becomes 12.
That doesn't look so nice. The text might grow across the borders of an item.
