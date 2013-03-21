// PSycho Duckling chat
(function()
{
    'use strict';

    var room_name = 'REDЯUM';

    var cmd_aliases_only_once = true;

    var PSD =
    {
        say: function(msg)
        {
            var d = new Date();
            var hh = d.getHours();
            var mm = d.getMinutes();
            var ss = d.getSeconds();
            var ms = d.getMilliseconds();
            hh = sprintf("%02d", hh);
            mm = sprintf("%02d", mm);
            ss = sprintf("%02d", ss);
            ms = sprintf("%03d", ms);
            

            var meta = 
                '<span class="chat-bracket">[</span>'
            +   hh 
            +   '<span class="chat-colon">:</span>' 
            +   mm 
            +   '<span class="chat-colon">:</span>' 
            +   ss
            +   '<span class="chat-dot">.</span>' + ms
            +   '<span class="chat-bracket">]</span>'
            +   ' '
            ;


            var msg_style = ' style="';
            if (msg.length > 256) // rather arbitrary
            {
                msg_style += 'line-height: 100%; ';
            }
            msg_style += '" ';

            var $screen = $($('#chat-screen'));
            $screen.append
            (
                '<p>'
            +       '<span class="chat-msg-meta">' + meta + '</span>'
            +       '<span class="chat-msg-content"' + msg_style + '>' + msg + '</span>'
            +   '</p>'
            );

            $(document).scrollTop($(document).height());
        },   

        hello: function(alias)
        {
            PSD.say
            (
                '* welcome to ' 
            +   '<span class="chat-room-name">'
            +   '#' + room_name + ' '
            +   '</span>'
            +   '<span class="chat-alias">' + alias + '</span>'
            );

            $(window).scrollTop(0);
        },

        on_cmd_aliases: function(aliases_list)
        {

            if (aliases_list.length !== 0)
            {
                var sorted = aliases_list.sort();
                
                var prettified = [];
                sorted.forEach(function(e, i)
                {
                    prettified.push
                    (
                        '<span class="chat-alias">' + e + '</span>'
                    );
                });
                PSD.say('* users: ' + prettified.join(', '));
            }
            else
            {
                PSD.say('* there are no users currently');
            }

            if (cmd_aliases_only_once)
            {
                $(window).scrollTop(0);
                cmd_aliases_only_once = false;
            }
        },

        on_user_enter: function(alias)
        {
            PSD.say
            (
                '* '
            +   '<span class="chat-alias">' + alias + '</span>'
            +   ' joins '
            +   '<span class="chat-room-name">'
            +   '#' + room_name
            +   '</span>'
            );
        },

        on_user_leave: function(alias)
        {
            PSD.say
            (
                '* '
            +   '<span class="chat-alias">' + alias + '</span>'
            +   ' left '
            +   '<span class="chat-room-name">'
            +   '#' + room_name
            +   '</span>'
            );
        },

        on_user_msg: function(args)
        {
            var alias = args.alias;
            var msg = args.msg;

            PSD.say
            (
                '<span class="chat-angle-bracket">&lt;</span>' 
            +   '<span class="chat-alias">' + alias + '</span>'
            +   '<span class="chat-angle-bracket">&gt;</span>'
            +   ' '
            +   msg
            );   

            
        },

        on_cmd_clear: function()
        {
            $('#chat-screen p').each(function()
            {
                $(this).remove();
                $(window).scrollTop(0);
            });  
        },
    };

    window.PSD = PSD;
}());
