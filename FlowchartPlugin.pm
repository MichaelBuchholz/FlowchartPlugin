

#  scp FlowchartPlugin.pm ecsrtwiki.emea.vzbi.com:/prod/Foswiki-2.1.6/lib/Foswiki/Plugins/FlowchartPlugin.pm


# Plugin for Foswiki - The Free and Open Source Wiki, http://foswiki.org/
#
# Copyright (C) 2000-2003 Andrea Sterbini, a.sterbini@flashnet.it
# Copyright (C) 2001-2004 Peter Thoeny, peter@thoeny.com
# Copyright (C) 2005... Aurelio A. Heckert, aurium@gmail.com
# Copyright (C) 2009-2010 Foswiki Contributors
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details, published at
# http://www.gnu.org/copyleft/gpl.html

# =========================
package Foswiki::Plugins::FlowchartPlugin;

# =========================

# This should always be $Rev: 8203 (2010-07-16) $ so that Foswiki can determine the checked-in
# status of the plugin. It is used by the build automation tools, so
# you should leave it alone.
our $VERSION = '$Rev: 8203 (2010-07-16) $';

# This is a free-form string you can use to "name" your own plugin version.
# It is *not* used by the build automation tools, but is reported as part
# of the version number in PLUGINDESCRIPTIONS.
our $RELEASE = '16 Jul 2010';

our $pluginName = 'FlowchartPlugin';    # Name of this Plugin

our $NO_PREFS_IN_TOPIC = 1;    # don't get preferences from plugin topic

our $debug = 0;

use JSON;
#use Data::Dumper;
use Encode;

#$Data::Dumper::Indent = 1;
#$Data::Dumper::Terse = 1;

my $user = '';

# =========================
sub initPlugin
{
    my ( $topic, $web, $usr, $installWeb ) = @_;
		$user = $usr;

    # Get plugin debug flag
    $debug = $Foswiki::cfg{Plugins}{$pluginName}{Debug} || 0;

    # Plugin correctly initialized
    Foswiki::Func::writeDebug(
        "- Foswiki::Plugins::${pluginName}::initPlugin( $web.$topic ) is OK")
      if $debug;

    return 1;
}

# =========================
use HTML::Entities;

sub commonTagsHandler
{
### my ( $text, $topic, $web ) = @_;   # do not uncomment, use $_[0], $_[1]... instead

Foswiki::Func::writeDebug ("- ${pluginName}::commonTagsHandler( $_[2].$_[1] )") if $debug;

# do custom extension rule, like for example:

my ($text, $params);

my ($i, $j, $jp, $k, $l, $m, $anchor, $title, $URL);
my $reattr = join ('|', ( 'id', 'type', 'goto', 'yes', 'no', 'case\s*\\(.*?\\)', 'color', 'alturl' ));
my $regoto = join ('|', ( 'yes', 'no', 'case\s*\\(.*?\\)' ));
my %ppfc = ();
my $fcc = 0;
my $numfc = 0;
my %jdata = ();

#my @tt = ();
while ( (($text, $params) = ($_[0] =~ m/(%FLOWCHART_START(?:{(.*?)})?%.*?%FLOWCHART_STOP%)/s)) )
	{
	my ($bm, $am) = ($`, $');
	my %p = defined ($params) ? Foswiki::Func::extractParameters ($params) : ();
	my $id = exists ($p{Id}) ? $p{Id} : (exists ($p{_DEFAULT}) ? $p{_DEFAULT} : sprintf ('Flowchart_%d', ++$fcc));

	my @t = split ("\n", $text);

	$t[0] =~ s/%FLOWCHART_START(?:{.*?})?%//;
	$t[$#t] =~ s/%FLOWCHART_STOP%//;

	my $stcnt = 0;
	my $idcnt = 0;
	my %flels = ();
	my $startid = '';

	for ($jp = undef, $i = 0; $i <= $#t; ++$i)
		{
		if ($t[$i] =~ m/^-{3}\+{2}\s*(.*?)\s*$/)
			{
			++$idcnt;
			my $title = $1;
			$title =~ s#<a\s.*?</a>##g;
			$title =~ s#<[^>]+>##g;
			$title =~ s#^\s*(.*?)\s*$#$1#;
			$j = { title => $title };
			$k = [];
			for (++$i; $i <= $#t && (($l, $m) = ($t[$i] =~ m/^\s+\*\s+($reattr)\s*:\s*(.*?)\s*$/i)); )
				{
				$l = ($l =~ m/^case\s*\(\s*(.*?)\s*\)$/i) ? ('case(' . $1 . ')') : lc ($l);
				$j->{$l} = $m;
				splice (@t, $i, 1);
				push (@{$k}, $l) if ($l =~ m/$regoto/i);
				}
			--$i;
			$j->{order} = $k if (scalar (@{$k}));
			$j->{color} = '#' . $j->{color} if (exists ($j->{color}) && substr ($j->{color}, 0, 1) ne '#');
			if (exists ($j->{id}))
				{
				my $taid = sprintf ('AutoId_%d', $idcnt);
				map ({ $jp->{$_} = $j->{id} if (exists ($jp->{$_}) && $jp->{$_} eq $taid) } qw( yes no goto ));
				}
			else
				{ $j->{id} = sprintf ('AutoId_%d', $idcnt); }
			if (exists ($j->{type}))
				{
				if ($j->{type} eq 'Question')
					{
					$j->{yes} = 'Next' unless (exists ($j->{yes}));
					$j->{no} = 'Next' unless (exists ($j->{no}));
					}
				elsif ($j->{type} ne 'Switch' && $j->{type} ne 'End' && $j->{type} ne 'End-Error')
					{ $j->{goto} = 'Next' unless (exists ($j->{goto})); }
				}
			else
				{
				$j->{type} = 'Action';
				$j->{goto} = 'Next' unless (exists ($j->{goto}));
				}
			map ({ $j->{$_} = sprintf ('AutoId_%d', $idcnt + 1) if (exists ($j->{$_}) && $j->{$_} eq 'Next') } qw( yes no goto ));
			$jp = $j;

			$title = $j->{title};
			$title = encode( "iso-8859-1", decode( "utf-8", $title ) ) ;
			$title =~ s/\"/\'/g;
			$title =~ s/\s+/ /g;

			if (exists ($j->{alturl}) && $j->{alturl} ne '')
				{
				if ($j->{alturl} =~ m-^(.*?)/([^/#]+)(#.*?)?$-)
					{
					$URL = Foswiki::Func::getViewUrl ($1, $2);
					$anchor = $3 ? $3 : '';
					}
				$j->{alturl} = $URL . $anchor;
				}
			else
				{
				$URL = Foswiki::Func::getViewUrl ($_[2], $_[1]);
				$anchor = Foswiki::Func::internalLink ('', $_[2], $_[1], '', $title, 0);
				#$bm .= '<pre><code>-' . join ('-<br />-', $_[2], $_[1], $URL, encode_entities ($anchor));
				# https://ecsrtwiki.emea.vzbi.com/foswiki/bin/view//System/FlowchartPluginExample
				if ($URL =~ m#^(.*?://.*?/)/(.*?)$#)
					{
					$URL = $1 . $2;
					}
				$anchor =~ s/^.*?href="(?:[^#]+)?(#.*?)".*?$/$1/;
				#$bm .= '-<br />-' . join ('-<br />-', $URL, encode_entities ($anchor)) . '-</code></pre>';
				$j->{url} = $URL . $anchor;
				}

			#push (@tt, '<pre>' . Dumper ($j) . "</pre>\n");
			$flels{$j->{id}} = [ $j, {} ];
			if (lc ($j->{type}) eq 'start')
				{
				$startid = $j->{id};
				++$stcnt;
				}
			}
		}

	#unshift (@t, '<pre>' . Dumper (\%flels) . "</pre>\n");
	$jdata{$id}[1] = &make_fc_elememt_tree (\%flels, $startid);

	#unshift (@t, join ('', @tt));
	#$#tt = -1;
	#unshift (@t, '<pre>' . to_json ($jdata{$id}, { pretty => 1 }) . "</pre>\n");
	unshift (@t, '%JQREQUIRE{"sprintf"}%');
	$_[0] = $bm . join ("\n", @t) . $am;

	$ppfc{$id} = ($stcnt == 1) ? \%p : (($stcnt > 1) ? 'Multiple "Start" Elements are not allowed' : 'Missing "Start" Element');
	}

$fcc = 0;
while ((($params) = ($_[0] =~ m/%FLOWCHART(?:{(.*?)})?%/s)))
	{
	my ($bm, $am) = ($`, $');
	my %p = (); #defined ($params) ? Foswiki::Func::extractParameters ($params) : ();

	$p{_DEFAULT} = ($params =~ m/^\s*('|")(.*?)\g1/)[1];
	map (
		{
		my $v = Foswiki::Func::extractNameValuePair ($params, $_->[0]) || Foswiki::Func::getPluginPreferencesValue ($_->[1]) || $_->[2];
		$p{$_->[0]} = $v if (defined ($v));
		}
		(
			[ 'text-size', 'TEXT_SIZE',    10 ],
			[ 'max-lines', 'MAX_LINES',     3 ],
			[ 'max-path',  'MAX_PATH',      3 ],
			[ 'item-w',    'ITEM_WIDTH',  100 ],
			[ 'item-h',    'ITEM_HEIGHT', undef ],
			[ 'area-w',    'ITEM_AREA_W', undef ],
			[ 'area-h',    'ITEM_AREA_H', undef ],
			[ 'percent',   'PERCENT_IMG', 100 ]
		));

	if (exists ($p{'item-h'}))
		{
		if (exists ($p{'max-lines'}))
			{ $p{'text-size'} = int (($p{'item-h'} - 4) / $p{'max-lines'}) - 2; }
		else
			{ $p{'max-lines'} = int (($p{'item-h'} - 4) / ($p{'text-size'} + 2)); }
		}
	else
		{ $p{'item-h'} = 4 + $p{'max-lines'} * (2 + $p{'text-size'}); }

	#$bm .= '<pre>' . Dumper (\%p) . "</pre>\n";
	my $id = exists ($p{Id}) ? $p{Id} : (exists ($p{_DEFAULT}) ? $p{_DEFAULT} : sprintf ('Flowchart_%d', ++$fcc));
	delete ($p{_DEFAULT});
	$jdata{$id}[0] = \%p;

	if (exists ($ppfc{$id}))
		{
		if (ref ($ppfc{$id}) eq 'HASH')
			{
			$_[0] = $bm . '<svg id="' . $id . '" xmlns="http://www.w3.org/2000/svg" width="10px" height="10px" onload="flowchart_main (' . "'$id'" . ');"></svg>' . $am;
			++$numfc;
			}
		else
			{ $_[0] = $bm . $ppfc{$id} . $am; }
		}
	else
		{ $_[0] = $bm . $am; }
	}

if ($numfc)
	{
	my $base = '%PUBURLPATH%/%SYSTEMWEB%/FlowchartPlugin';

	if (0 && $user eq '6293495480')
		{ Foswiki::Func::addToZone ('script', 'FlowchartPlugin::flowchart', "<script type='text/javascript' src='$base/flowchart_test.js'></script>"); }
	else
		{ Foswiki::Func::addToZone ('script', 'FlowchartPlugin::flowchart', "<script type='text/javascript' src='$base/flowchart.js'></script>"); }

	Foswiki::Func::addToZone ('script', 'FlowchartPlugin_flowchartdata',
	'<script type="text/json">' . to_json (\%jdata, { pretty => 1 }) . '</script>',
	'FlowchartPlugin::flowchart');
	}

}

################################################################################

sub make_fc_elememt_tree
{
my $els = shift;
my $startid = shift;
my ($rv, $k, $v, $e, @o, %o);

my %solved = ( 'start' => 1 );
my @st = (($rv = $els->{$startid}));
delete ($els->{$startid});

while (scalar (@st))
	{
	$e = shift (@st);
	if (exists ($e->[0]{order}))
		{
		%o = map ({ $_ => 1 } keys (%{$e->[0]}));
		map ({ delete ($o{$_}) } @{$e->[0]{order}});
		@o = @{$e->[0]{order}};
		push (@o, keys (%o));
		}
	else
		{ @o = keys (%{$e->[0]}); }

	foreach $k (@o)
		{
		$v = $e->[0]{$k};
		if ($k =~ m/^(goto|yes|no|case\s*\(.*?\))$/)
			{
			if (exists ($solved{$v}))
				{ $e->[1]{$v} = undef; }
			else
				{
				push (@st, ($e->[1]{$v} = $els->{$v}));
				delete ($els->{$v});
				$solved{$v} = 1;
				}
			$solved{$v} = 1;
			}
		}
	}

$rv;
}

################################################################################
1;
