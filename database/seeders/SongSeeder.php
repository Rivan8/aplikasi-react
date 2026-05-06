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
                'title' => 'Gratitude',
                'arrangement_name' => 'Brandon Lake',
                'bpm' => '78',
                'keys' => 'B',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
            [
                'title' => 'Trust in God',
                'arrangement_name' => 'Elevation Worship',
                'bpm' => '74',
                'keys' => 'C',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
            [
                'title' => 'Worthy of It All',
                'arrangement_name' => 'CeCe Winans',
                'bpm' => '68',
                'keys' => 'G',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => false,
            ],
            [
                'title' => 'Goodness of God',
                'arrangement_name' => 'Bethel Music',
                'bpm' => '63',
                'keys' => 'Ab',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
            [
                'title' => 'Praise',
                'arrangement_name' => 'Elevation Worship',
                'bpm' => '127',
                'keys' => 'B',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
            [
                'title' => 'Holy Forever',
                'arrangement_name' => 'Chris Tomlin',
                'bpm' => '72',
                'keys' => 'Db',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
            [
                'title' => 'Firm Foundation (He Won\'t)',
                'arrangement_name' => 'Maverick City Music',
                'bpm' => '75',
                'keys' => 'Bb',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
            [
                'title' => 'King of Kings',
                'arrangement_name' => 'Hillsong Worship',
                'bpm' => '68',
                'keys' => 'D',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => false,
            ],
            [
                'title' => 'Same God',
                'arrangement_name' => 'Elevation Worship',
                'bpm' => '72',
                'keys' => 'Db',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
            [
                'title' => 'What A Beautiful Name',
                'arrangement_name' => 'Hillsong Worship',
                'bpm' => '68',
                'keys' => 'D',
                'has_lyrics' => true,
                'has_chords' => true,
                'has_pdf' => true,
                'has_audio' => true,
            ],
        ];

        foreach ($songs as $song) {
            Song::updateOrCreate(
                ['title' => $song['title'], 'arrangement_name' => $song['arrangement_name']],
                $song
            );
        }
    }
}
