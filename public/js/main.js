$(document).ready(function()
{
    'use strict';

    var dump = function(obj)
    {
        var i;

        var out = '';
        for (i in obj) 
        {
            if (obj.hasOwnProperty(i)) 
            {
                out += i + ": " + obj[i] + "\n";
            }
        }
        // alert(out);
        var pre = document.createElement('pre');
        pre.innerHTML = out;
        document.body.appendChild(pre);
    };

    
    var event_handler = 
    {
        'event-user-enter':  PSD.on_user_enter,
        'event-user-leave':  PSD.on_user_leave,
        'event-user-msg':    PSD.on_user_msg,
        'event-cmd-aliases': PSD.on_cmd_aliases,
        'event-cmd-clear':   PSD.on_cmd_clear,
    };

    var dispatch_events = function(msg)
    {
        event_handler[msg.event_type](msg.args);
    };


    var start_chat = function(alias)
    {
        $('#login-section').hide();
        // PSD.say('Okay <img src="pics/icons/smiley.png" style="vertical-align: middle;"/> Okay..');
        // PSD.say('A');
        // PSD.say('B');
        // PSD.say('C');
        // PSD.say('D');
        // PSD.say(sprintf('%02d', 4));
        
        var ws;
        if (window.hasOwnProperty('WebSocket'))
        {
            var url = HELP.parse_url(window.location);
            ws = new window.WebSocket('ws://' + url.host + ':' + url.port + '/psd');
        }
        else
        {
            window.alert('Sorry, your browser does not support WebSockets.');
            window.location = 'https://en.wikipedia.org/wiki/WebSocket#Browser_support';
        }

        ws.onmessage = function(msg) 
        {
            var d = JSON.parse(msg.data);
            dispatch_events(d);
        };

        var close_socket = function()
        { 
            ws.send(JSON.stringify({ event_type: 'event-user-leave', 'args': alias }));
            ws.onclose = function () {}; // disable onclose handler first, not sure why though
            ws.close();
        };

        // $('#close-socket').click(function() { close_socket(); });
        window.onbeforeunload = function() { close_socket(); };

        PSD.hello(alias);
        setTimeout(function()
        {
            ws.send(JSON.stringify({ event_type: 'event-user-enter', 'args': alias }));
        }, 1000);


        $('#chat-input')
            .keypress(function(event) 
            {
                if (event.keyCode === 13) 
                {
                    var $input = $(this);
                    var msg = $input.val();

                    if (msg === '') { return; }

                    if (msg.substr(0, 1) === '/')
                    {
                        msg = msg.substr(1);
                        var parts = msg.split(/\s+/);
                        if (parts[0] === 'clear') { PSD.on_cmd_clear(); }
                    }
                    else
                    {
                        ws.send(JSON.stringify({ event_type: 'event-user-msg', 'args': { alias: alias, msg: msg } }));
                    }

                    $input.val('');
                    
                }
            })
            .dblclick(function() { $(this).val(''); })
            .show()
            .focus()
            ;

        $('#theme-select').show();
    };


    $('#login-alias').focus();
    $('#chat-input').hide();
    $('#theme-select').hide();

    $('#login-alias')
        .keypress(function(event) 
        {
            if (event.keyCode === 13) 
            {
                $('#login-entrande').trigger('click');
            }
        })
        ;

    var is_login_section_shaking = false; // prevent spam clicking, which leads to buggy ui
    $('#login-entrande').click(function()
    {
        var alias = $('#login-alias').val();
        var is_alias_valid = false;

        if (alias !== "")
        {
            if (/^([\-+]?[@.$#][\-_A-Za-z0-9]{2,18}|[\-_A-Za-z0-9]{2,20})$/.test(alias))
            {
                $.ajax('/is_alias_unique',
                {
                    type:     'post',
                    async:    false,
                    data:     { alias: alias },
                    dataType: 'json',
                    success:  function(res) { is_alias_valid = res.is_alias_unique; },
                });
            }
        }

        if (!is_alias_valid)
        {
            if (is_login_section_shaking) { return; } 

            var SOUND_DURATION_s = 0.86;
            // var sound = new Howl
            new Howl
            ({
                urls: 
                [
                    'sounds/error.mp3', 
                    'sounds/error.ogg',
                ]
            }).play();
            var $ls = $($('#login-section'));
            $ls.effect("shake", { direction: 'up', times: 3, distance: 7, }, SOUND_DURATION_s * 1000);
            is_login_section_shaking = true; setTimeout(function() { is_login_section_shaking = false; }, SOUND_DURATION_s * 1000);

            return;
        }

        start_chat(alias);
    });

    $('#theme-select').change(function()
    {
        var theme = $(this).val();
        if (theme === 'bogus') { return ; }
        $.fn.styleSwitch(theme);

        $('#chat-input').focus();
    });


    // start_chat('Joe');
});
