<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AttendanceHistoryExport implements FromCollection, WithHeadings, ShouldAutoSize
{
    protected array $rows;

    public function __construct(array $rows)
    {
        $this->rows = $rows;
    }

    public function collection(): Collection
    {
        return collect($this->rows);
    }

    public function headings(): array
    {
        if (empty($this->rows)) {
            return ['ID', 'Nama Jemaat', 'NIK', 'Event', 'Lokasi', 'Tanggal Event', 'Waktu Scan', 'Status'];
        }

        return array_keys($this->rows[0]);
    }
}
