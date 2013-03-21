#!/usr/bin/perl 
use strict;
use warnings;
use v5.14;
use utf8;

use Mojolicious::Lite;
use Mojo::IOLoop;
use JSON;
use Encode qw|encode_utf8|;

get '/', sub 
{ 
    my $r = shift;


    $r->render('index',
        title  => 'psychling duck - welcome',
        answer => 43,
    );
} => 'index';

websocket '/psd' => sub 
{
    my $r = shift;

    $r->app->log->debug('[websocket connected]');

    Mojo::IOLoop->stream($r->tx->connection)->timeout(300);

    # my $T = Mojo::IOLoop->recurring(1 => sub 
    # {
    # });
    $r->send(to_json( { event_type => '', args => { } } ));

    $r->on(message => sub 
    {
        my ($r, $msg) = @_;
        $msg = from_json($msg);
        dispatch_events($r, $msg);
    });

    $r->on(finish => sub 
    {
        my $r = shift;
        $r->app->log->debug('[websocket disconnected]');
    });

     # Mojo::IOLoop->remove($T);
};

my %event_handler =
(
    'event-user-enter' => \&on_user_enter,
    'event-user-leave' => \&on_user_leave,
    'event-user-msg'   => \&on_user_msg,
);

sub dispatch_events
{
    my ($r, $msg) = @_;
    say 'dispatching';
    $event_handler{$msg->{event_type}}->($r, $msg->{args});   
}

my %ws_to;
sub on_user_enter
{
    my ($r, $alias) = @_;
    $ws_to{$alias} = $r;

    $r->send(to_json
    ({ 
        event_type => 'event-cmd-aliases', 
        args       => [ grep { $_ ne $alias } keys %ws_to ],
    }));

    for my $current_alias (keys %ws_to)
    {
        next if $current_alias eq $alias;

        $ws_to{$current_alias}->send(to_json
        ({ 
            event_type => 'event-user-enter', 
            args       => $alias, 
        }));
    }

    say encode_utf8("$alias joins #REDЯUM");
}

sub on_user_leave
{
    my ($r, $alias) = @_;
    delete $ws_to{$alias};

    for my $current_alias (keys %ws_to)
    {
        $ws_to{$current_alias}->send(to_json
        ({ 
            event_type => 'event-user-leave', 
            args       => $alias, 
        }));
    }

    say encode_utf8("$alias left REDЯUM");
}


# would require to make the line height bigger, I guess
# no icons is fine as well... =)
my %icon_for =
(
    '=)' => '', # path/to/icon
    ':)' => '',
    ':(' => '',
    'xD' => '',
);

sub on_user_msg
{
    my ($r, $args) = @_;
    my ($alias, $msg) = @{$args}{qw|alias msg|}; # hash ref slice

    # preprocess msg
    #

    # try to defend agains XSS
    use HTML::Entities;
                                #  "   '   &   <   > 
    $msg = encode_entities($msg, "\x22\x27\x26\x3C\x3E");

    # =) => <img src="$icon_for{'=)'}" />
    # skip it

    # convert links to <a href="..." />[number]</a>
    #
    use URI::Find;
    my $url_counter = 0;
    my $finder = URI::Find->new(sub 
    {
        my($uri, $orig_uri) = @_;
        $url_counter++;
        return qq|<a href="$uri" target="_blank">[$url_counter]</a>|;
    });
    $finder->find(\$msg);


    for my $current_alias (keys %ws_to)
    {
        $ws_to{$current_alias}->send(to_json
        ({ 
            event_type => 'event-user-msg', 
            args       => { alias => $alias, msg => $msg },
        }));
    }

    say encode_utf8("<$alias> $msg");
}



post 'is_alias_unique' => sub
{
    my $r = shift;
    my $alias = $r->param('alias');
    $r->render(json => { is_alias_unique => !exists $ws_to{$alias} });
};


app->start;
__DATA__

@@ index.html.ep
<!DOCTYPE html>

<html>

<head>
    <meta charset="UTF-8">

    %= stylesheet 'css/reset.css'
    %= stylesheet 'css/main.css'
    %= stylesheet 'css/themes/default.css'

    %= javascript 'js/libs/jquery-1.8.2.min.js'
    %= javascript 'js/libs/jquery-ui-1.10.2.custom.min.js'
    %= javascript 'js/libs/howler.min.js'
    %= javascript 'js/libs/sprintf-0.7-beta1.js'
    %= javascript 'js/libs/stylesheet_switcher.js'

    %= javascript 'js/utils.js'
    %= javascript 'js/psycho_duckling.js'
    %= javascript 'js/main.js'

    <title><%= $title %></title>
</head>

<body>
    <div id="page">
        <div id="chat-screen">
        </div>

        <p style="line-height: 16px;">&nbsp;</p>
    </div>

    <div id="login-section">
        <div>
            <input id="login-alias" type="text" placeholder="alias" maxlength="20" />
            <input id="login-entrande" type="button" value="entrande" /> 
        </div>
    </div>

    <div id="chat-input-section">
        <input id="chat-input" type="text" placeholder="say" maxlength="512" />
    </div>

    <select id="theme-select" class="theme-select-eyecandy">
        <option value="bogus">[theme]</option>
        <option value="css/themes/default.css">[darkly]</option>
        <option value="css/themes/whitly.css">[whitly]</option>
    </select>

</body>

</html>
