<?php

namespace App\Exports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendanceDetailExport implements FromCollection, WithColumnWidths, WithHeadings, WithStrictNullComparison, WithStyles
{
    public function __construct(private readonly array $rows) {}

    public function collection(): Collection
    {
        return collect($this->rows)->values()->map(function (array $row, int $index): array {
            return [
                'No' => $index + 1,
                'Nama Jemaat' => $row['name'] ?? '-',
                'Email' => filled($row['email'] ?? null) ? $row['email'] : '-',
                'No. HP' => filled($row['phone'] ?? null) ? $row['phone'] : '-',
                'Departemen' => filled($row['department'] ?? null) ? $row['department'] : 'Tanpa Departemen',
                'Hadir' => $row['hadir'] ?? 0,
                'Terlambat' => $row['terlambat'] ?? 0,
                'Event yang Diikuti' => $this->attendanceNotes($row['event_details'] ?? []),
            ];
        });
    }

    public function headings(): array
    {
        return ['No', 'Nama Jemaat', 'Email', 'No. HP', 'Departemen', 'Hadir', 'Terlambat', 'Event yang Diikuti'];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,
            'B' => 30,
            'C' => 34,
            'D' => 18,
            'E' => 22,
            'F' => 8,
            'G' => 10,
            'H' => 90,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);
        $sheet->getStyle('A1:H1')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EEF2FF');
        $sheet->getStyle('A1:H'.$sheet->getHighestRow())
            ->getAlignment()
            ->setVertical(Alignment::VERTICAL_TOP);
        $sheet->getStyle('H2:H'.$sheet->getHighestRow())
            ->getAlignment()
            ->setWrapText(true);

        return [];
    }

    /**
     * @param  array<string, array<int, array{title: string, session: ?string, status: string}>>  $eventDetails
     */
    private function attendanceNotes(array $eventDetails): string
    {
        $notes = [];

        foreach ($eventDetails as $date => $events) {
            $dateLabel = Carbon::parse($date)->locale('id')->translatedFormat('d M Y');

            foreach ($events as $event) {
                $session = filled($event['session'] ?? null) ? ' - '.$event['session'] : '';
                $status = ($event['status'] ?? '') === 'Late' ? 'Terlambat' : 'Hadir';

                $notes[] = $dateLabel.': '.$event['title'].$session.' ('.$status.')';
            }
        }

        return $notes === [] ? 'Tidak ada kehadiran' : implode('; ', $notes);
    }
}
