Halo {{ $name }},

Anda menerima pesan baru untuk event pelayanan: {{ $eventTitle }}

{{ $messageTitle }}
{{ $messageBody }}

Buka Event Saya di {{ $actionUrl }}
@if ($hasAttachment)
Lampiran: {{ $attachmentName ?: 'Berkas terlampir' }}
@endif

Email ini dikirim otomatis oleh ESC Planning Center. Mohon tidak membalas email ini.
