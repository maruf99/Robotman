import type { AutoResponse } from '@robotman/types';
import { toTitleCase } from '#utils/util';
import { Select } from '@chakra-ui/react';
import { useMemo } from 'react';
import type { FilterProps, UseFiltersColumnProps } from 'react-table';

const TypeSelector = ({ column }: FilterProps<AutoResponse> & { column: UseFiltersColumnProps<AutoResponse> }) => {
	const { filterValue, setFilter, preFilteredRows, id } = column;

	const options: any[] = useMemo(() => {
		const opts: any[] = [];

		for (const row of preFilteredRows) {
			if (!opts.includes(row.values[id])) {
				opts.push(row.values[id]);
			}
		}

		return opts;
	}, [preFilteredRows, id]);

	return (
		<Select
			size="sm"
			value={filterValue}
			onChange={(e) => {
				setFilter(e.target.value || undefined);
			}}
		>
			<option value="">All</option>
			{options.map((option, i) => (
				<option key={i} value={option}>
					{toTitleCase(option)}
				</option>
			))}
		</Select>
	);
};

export default TypeSelector;
