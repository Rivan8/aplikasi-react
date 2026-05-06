<?php

namespace Database\Seeders;

use App\Models\Song;
use Illuminate\Database\Seeder;

class SongSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $songs = [
            [
                'title' => 'Mari kita sambut Sang Raja [Medley] Dia lahir untuk kami',
                'bpm' => null,
                'keys' => null,
                'has_pdf' => false,
                'has_lyrics' => false,
                'has_chords' => false,
                'has_audio' => false,
                'created_at' => '2025-11-08 19:27:00',
            ],
            [
                'title' => '10000 Reasons (Bless The Lord)',
                'bpm' => '70-80',
                'keys' => 'D-E, E-F, F-G, G-G',
                'has_pdf' => true,
                'has_lyrics' => true,
                'has_chords' => false,
                'has_audio' => false,
                'last_scheduled_at' => '2025-11-30 00:00:00',
                'created_at' => '2017-07-19 12:41:00',
            ],
            [
                'title' => '17 Agustus',
                'bpm' => null,
                'keys' => null,
                'has_pdf' => false,
                'has_lyrics' => false,
                'has_chords' => false,
                'has_audio' => false,
                'last_scheduled_at' => '2017-08-19 00:00:00',
                'created_at' => '2017-08-08 20:18:00',
            ],
            [
                'title' => 'Above All',
                'bpm' => '62',
                'keys' => 'D-E, F, G',
                'has_pdf' => true,
                'has_lyrics' => false,
                'has_chords' => false,
                'has_audio' => false,
                'last_scheduled_at' => '2026-04-03 00:00:00',
                'created_at' => '2017-11-29 14:30:00',
            ],
            [
                'title' => 'Ada Kuasa',
                'bpm' => '148',
                'keys' => 'D, D-E, F, F-G',
                'has_pdf' => false,
                'has_lyrics' => true,
                'has_chords' => false,
                'has_audio' => false,
                'last_scheduled_at' => '2026-04-19 00:00:00',
                'created_at' => '2018-08-28 14:15:00',
            ],
            [
                'title' => 'Ada Satu Sobatku',
                'bpm' => null,
                'keys' => 'C',
                'has_pdf' => true,
                'has_lyrics' => false,
                'has_chords' => false,
                'has_audio' => false,
                'last_scheduled_at' => '2026-04-29 00:00:00',
                'created_at' => '2024-01-24 12:16:00',
            ],
            [
                'title' => 'Agnus Dei',
                'bpm' => '66',
                'keys' => 'A, E-F, E-G, F, F-G, G-A',
                'has_pdf' => true,
                'has_lyrics' => true,
                'has_chords' => false,
                'has_audio' => false,
                'last_scheduled_at' => '2026-04-03 00:00:00',
                'created_at' => '2018-02-27 10:35:00',
            ],
        ];

        foreach ($songs as $song) {
            Song::create($song);
        }
    }
}
