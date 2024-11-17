const fetchMarkdown = async (file: string) => {
	const url = `https://raw.githubusercontent.com/korginc/logue-sdk/gh-pages/${file}`;
	const res = await fetch(url);

	if (res.status === 200) {
		return res.text();
	}

	throw new Error(`Could not fetch ${url}`);
};

const findAndFetchAllMdFiles = async (md: string, fetchedFiles: Set<string>) => {
	let mdFiles: string[] = md.match(/(?<=\]\()[^)]*\.md(?=\))/g) || [];
	// filter out files that end in "_ja.md"
	mdFiles = mdFiles.filter((file: string) => !file.endsWith('_ja.md'));
	if (mdFiles) {
		for (const mdFile of mdFiles) {
			if (!fetchedFiles.has(mdFile)) {
				fetchedFiles.add(mdFile);
				const file = await fetchMarkdown(mdFile);
				await findAndFetchAllMdFiles(file, fetchedFiles);
			}
		}
	}
	return mdFiles;
};

const extractTables = (md: string): string[] => {
	const lines = md.split(/\r?\n/);
	const tables: string[] = [];
	let collectingTable = false;
	let currentTable = '';

	for (const line of lines) {
		if (line.startsWith('|')) {
			// Start or continue capturing lines if they start with '|'
			collectingTable = true;
			currentTable += line + '\n'; // Append the line to the current table with newline
		} else if (collectingTable) {
			// If we're collecting a table and encounter a non-table row, save the table and stop collecting
			tables.push(currentTable.trim());
			currentTable = '';
			collectingTable = false;
		}
	}

	// In case the file ends while still collecting a table
	if (collectingTable && currentTable) {
		tables.push(currentTable.trim());
	}

	// Filter to ensure tables contain the proper header
	return tables.filter(
		(table) =>
			table.includes('| Name |') &&
			table.includes('| Developer |') &&
			table.includes('| Description |') &&
			table.includes('| Platforms |')
	);
};

const parseTableToJSON = (table: string): any[] => {
	const lines = table.trim().split(/\r?\n/);
	const headers = lines[0]
		.split('|')
		.map((header) => header.trim())
		.filter((header) => header);

	return lines
		.slice(2) // Skip the header and separator lines
		.map((line) => {
			const values = line
				.split('|')
				.map((value) => value.trim())
				.filter((value) => value);
			const entry: any = {};
			headers.forEach((header, index) => {
				entry[header] = values[index] || ''; // Handle missing values
			});
			return entry;
		});
};

// Helper function to extract the title from the front matter of a Markdown file
const extractTitleFromFrontMatter = (md: string): string => {
	const frontMatterMatch = md.match(/^---\r?\n([\s\S]+?)\r?\n---/);
	if (frontMatterMatch) {
		const frontMatter = frontMatterMatch[1];
		const titleMatch = frontMatter.match(/^title:\s*(.*)/m);
		return titleMatch ? titleMatch[1].trim() : 'Untitled';
	}
	return 'Untitled';
};

export async function load() {
	const fetchedFiles = new Set<string>();
	const indexMd = await fetchMarkdown('01_unit_index.md');
	fetchedFiles.add('01_unit_index.md');

	const allMdFiles = await findAndFetchAllMdFiles(indexMd, fetchedFiles);

	let tableData: any[] = [];
	if (allMdFiles) {
		for (const mdFile of allMdFiles) {
			const fileContent = await fetchMarkdown(mdFile);
			const title = extractTitleFromFrontMatter(fileContent); // Use the new function to extract the title
			console.log('title', title);
			const tables = extractTables(fileContent);
			for (const table of tables) {
				const jsonData = parseTableToJSON(table);
				tableData.push({
					file: mdFile,
					title, // Include the extracted title
					rows: jsonData
				});
			}
		}
	}

	tableData = tableData.sort((a, b) => a.file.localeCompare(b.file));

	return {
		tableData
	};
}
