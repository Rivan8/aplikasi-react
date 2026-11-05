<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>@yield('title', 'ESC Planning Center')</title>
    <style>
        @media only screen and (max-width: 480px) {
            .email-card { border-left: 0 !important; border-right: 0 !important; border-radius: 0 !important; }
            .email-pad { padding-left: 22px !important; padding-right: 22px !important; }
            .email-stack { display: block !important; width: 100% !important; padding: 0 0 14px 0 !important; }
            .email-title { font-size: 22px !important; line-height: 1.35 !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#F5F5F4; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#292524; -webkit-font-smoothing:antialiased;">
    <div style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; mso-hide:all;">@yield('preheader')</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F5F4;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="width:100%; max-width:600px; background-color:#FFFFFF; border:1px solid #E7E5E4; border-radius:18px; overflow:hidden;">
                    <tr>
                        <td class="email-pad" style="background-color:#EA580C; background-image:linear-gradient(135deg,#EA580C 0%,#F97316 60%,#FB923C 100%); padding:24px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="48" valign="middle" style="width:48px;">
                                        <img src="{{ $message->embed(public_path('images/myesc plan.png')) }}" width="44" height="44" alt="ESC Planning Center" style="display:block; width:44px; height:44px; border-radius:12px; background-color:#FFFFFF;">
                                    </td>
                                    <td valign="middle" style="padding-left:14px;">
                                        <p style="margin:0; font-size:17px; line-height:1.3; font-weight:700; color:#FFFFFF;">ESC Planning Center</p>
                                        <p style="margin:3px 0 0; font-size:11px; line-height:1.4; letter-spacing:0.12em; text-transform:uppercase; color:#FFEDD5;">Service Planning</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-pad" style="padding:34px 32px 0;">
                            @yield('content')
                        </td>
                    </tr>
                    <tr>
                        <td class="email-pad" style="padding:0 32px;">
                            <div style="height:1px; background-color:#E7E5E4; font-size:0; line-height:0;">&nbsp;</div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" class="email-pad" style="padding:20px 32px 30px;">
                            <p style="margin:0; font-size:12px; line-height:1.6; color:#A8A29E;">Email ini dikirim otomatis oleh ESC Planning Center.<br>Mohon tidak membalas email ini.</p>
                        </td>
                    </tr>
                </table>
                <p style="margin:18px 0 0; font-size:11px; line-height:1.5; color:#A8A29E;">&copy; {{ date('Y') }} MYESC &middot; <a href="https://pcs.myesc.id" style="color:#A8A29E; text-decoration:underline;">pcs.myesc.id</a></p>
            </td>
        </tr>
    </table>
</body>
</html>
