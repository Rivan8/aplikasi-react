<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'myesc' => [
        'enabled' => filter_var(env('MYESC_MEMBER_API_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
        'scan_url' => env('MYESC_MEMBER_API_URL', 'https://admin.myesc.id/Api/Api_laravel_pcs/scan'),
        'api_key' => env('MYESC_MEMBER_API_KEY'),
        'cache_minutes' => env('MYESC_MEMBER_API_CACHE_MINUTES', 10),
        'connect_timeout' => env('MYESC_MEMBER_API_CONNECT_TIMEOUT', 5),
        'timeout' => env('MYESC_MEMBER_API_TIMEOUT', 10),
        'idjemaat_length' => env('MYESC_IDJEMAAT_LENGTH', 10),
        'noaj_length' => env('MYESC_NOAJ_LENGTH', 7),
    ],

];

