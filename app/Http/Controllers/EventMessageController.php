<?php

namespace App\Http\Controllers;

use App\Models\EventMessage;
use App\Models\EventMessageRead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EventMessageController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:10000'],
        ]);

        EventMessage::create($validated);

        return back()->with('success', 'Pesan berhasil dikirim kepada volunteer event.');
    }

    public function markRead(Request $request, EventMessage $eventMessage): RedirectResponse
    {
        EventMessageRead::firstOrCreate(
            [
                'event_message_id' => $eventMessage->id,
                'user_id' => $request->user()->id,
            ],
            ['read_at' => now()],
        );

        return back();
    }
}
