import { trim } from './';

export default class Table {
    private readonly widths: number[] = [];
    private readonly rows: any[] = [];
    private columns: string[] = [];

    public setColumns(columns: string[]): this {
        this.columns = columns;
        for (const c of columns) this.widths.push(c.length + 2);

        return this;
    }

    public addRows(rows: any[]): this {
        for (const row of rows) {
            const formattedRow = row.map((r: any) => {
                if (r instanceof Date) r = r.getTime();
                return trim(String(r), 30);
            });
            this.rows.push(formattedRow);
            for (const [i, el] of formattedRow.entries()) {
                const width = el.length + 2;
                if (width > this.widths[i]) this.widths[i] = width;
            }
        }

        return this;
    }

    public render(): string {
        const table = [
            this.separator('┌', '┬', '┐'),
            this.formatEntry(this.columns),
            this.separator('├', '┼', '┤'),
            ...this.rows.map(row => this.formatEntry(row)),
            this.separator('└', '┴', '┘')
        ];

        return table.join('\n');
    }

    private formatEntry(row: string[]): string {
        return `│${row.map((el, i) => ` ${el}${' '.repeat(this.widths[i] - (el.length + 1))}`).join('│')}│`;
    }

    private separator(rightChar: string, middleChar: string, leftChar: string): string {
        return `${rightChar}${this.widths.map(w => '─'.repeat(w)).join(middleChar)}${leftChar}`;
    }
}