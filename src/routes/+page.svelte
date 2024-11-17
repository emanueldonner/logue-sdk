<script lang="ts">
	import { onMount } from 'svelte';

	export let data: any;

	let searchTerm: string = '';
	let selectedTitle: string = 'all';
	let selectedPlatform: string = 'all';
	let activeFilters: Set<string> = new Set();
	// Define a mapping for standardizing platform names
	const platformMapping: { [key: string]: string } = {
		'nts-1 mkii': 'nts-1 mkii',
		'nts-1mkii': 'nts-1 mkii',
		'nts-1_mkii': 'nts-1 mkii',
		'nts-1_mkII': 'nts-1 mkii',
		'nts-1 mkII': 'nts-1 mkii',
		'nts-1': 'nts-1',
		nts3: 'nts-3',
		nts3kaoss: 'nts-3',
		'nts-3kaoss': 'nts-3',
		// Add more mappings as needed
		pro: 'pro',
		xd: 'xd',
		drum: 'drum'
	};

	let listOfTitles: any = [];
	let listOfPlatforms: any = [];

	const getListOfTitles = (tableData: any) => {
		// each title should only appear once
		const titles = tableData.map((table: any) => table.title);
		return [...new Set(titles)];
	};

	const getListOfPlatforms = (tableData: any) => {
		// each platform should only appear once
		const platforms = tableData.flatMap((table: any) =>
			table.rows.flatMap((entry: any) => standardizePlatforms(entry.Platforms))
		);
		return [...new Set(platforms)];
	};

	// Function to standardize platform names based on the mapping
	const standardizePlatforms = (platforms: string) => {
		return platforms.split(',').map((platform: string) => {
			const trimmedPlatform = platform.trim();
			// if not empty, return the mapped platform name
			if (trimmedPlatform) {
				return platformMapping[trimmedPlatform] || trimmedPlatform;
			}
			return null;
		});
	};

	$: console.log('Current active filters:', activeFilters);
	$: {
		if (activeFilters.size > 0) {
			console.log('active filters', activeFilters);
		}
	}
	// Flatten and standardize the table data
	let originalTableData = data.tableData.flatMap((table: any) =>
		table.rows.map((entry: any) => ({
			...entry,
			title: table.title,
			Platforms: standardizePlatforms(entry.Platforms)
		}))
	);
	$: tableData = originalTableData;

	const mdToHtmlLink = (md: string) => {
		return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
	};

	const applyFilters = () => {
		const searchTerms = searchTerm.toLowerCase().split(' ');

		tableData = originalTableData.filter((entry: any) => {
			// Check search term match
			const matchesSearch = searchTerms.every(
				(term: string) =>
					entry.Name?.toLowerCase().includes(term) ||
					entry.Developer?.toLowerCase().includes(term) ||
					entry.Description?.toLowerCase().includes(term) ||
					entry.Platforms?.some((platform: string) => platform?.toLowerCase().includes(term))
			);

			// Check platform filters match
			const matchesPlatforms =
				selectedPlatform === 'all' || entry.Platforms.includes(selectedPlatform);

			// Check title filter match
			const matchesTitle = selectedTitle === 'all' || entry.title === selectedTitle;

			return matchesSearch && matchesPlatforms && matchesTitle;
		});
	};

	const filterBySearch = () => {
		applyFilters();
	};

	const filterByPlatform = (platform: string) => {
		selectedPlatform = platform;
		applyFilters();
	};

	const removeFilter = (filter: string) => {
		activeFilters.delete(filter);
		applyFilters();
	};

	const updateTitleFilter = (title: string) => {
		selectedTitle = title;
		applyFilters();
	};

	onMount(() => {
		listOfTitles = getListOfTitles(data.tableData);
		listOfPlatforms = getListOfPlatforms(data.tableData);
	});
</script>

<div class="container">
	<h1><em>logue SDK</em></h1>
	<p>A filter- and searchable index of Korg's logue SDK.</p>
	<div class="disclaimer">
		<p>
			Disclaimer: All the data in this index is sourced from the <a
				href="https://github.com/korginc/logue-sdk">korginc/logue-sdk</a
			>
			repository.<br />
			It can only be as accurate and up to date as the repository is.<br />
			<em>Every time you refresh the page, the data will be updated.</em>
		</p>
	</div>
	<!-- filter by platform -->
	<div class="action-container">
		<div
			class="title-filter"
			on:change={(e: Event) => {
				const target = e.target as HTMLSelectElement;
				updateTitleFilter(target.value);
			}}
		>
			<label for="title">Type:</label>
			<select id="title" name="title">
				<option value="all">All</option>
				{#each listOfTitles as title}
					<option value={title}>{title}</option>
				{/each}
			</select>
		</div>
		<!-- filter by platform -->
		<div
			class="title-filter"
			on:change={(e: Event) => {
				const target = e.target as HTMLSelectElement;
				filterByPlatform(target.value);
			}}
		>
			<label for="platform">Platform:</label>
			<select id="platform" name="platform">
				<option value="all">All</option>
				{#each listOfPlatforms as platform}
					<option value={platform}>{platform}</option>
				{/each}
			</select>
		</div>
		<!-- search -->
		<div class="search">
			<label for="search">Search:</label>
			<input
				bind:value={searchTerm}
				on:input={filterBySearch}
				id="search"
				name="search"
				type="text"
			/>
		</div>
		<!-- list of filters active -->
		<!-- <div class="filters">
			<label for="platform">Filters active:</label>
			<div class="active-filter-container">
				{#each Array.from(activeFilters) as filter}
					<span class="filter-item"
						>{filter}
						<button
							on:click={() => {
								removeFilter(filter);
							}}
						>
							x
						</button>
					</span>
				{/each}
			</div>
		</div> -->
	</div>
	<div class="table-container">
		{#if tableData}
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Developer</th>
						<th>Description</th>
						<th>Platforms</th>
						<th>Type</th>
					</tr>
				</thead>
				<tbody>
					{#each tableData as row}
						<tr>
							<td>{@html mdToHtmlLink(row.Name)}</td>
							<td>{row.Developer}</td>
							<td>{row.Description}</td>
							<td class="platforms">
								{#each row.Platforms as platform}
									<span class="platform-item">{platform}</span>
								{/each}
							</td>
							<td>{row.title}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p>Loading...</p>
		{/if}
	</div>
	<div class="footer">
		<!-- contact, copyright, etc. -->
		<p>Copyright © 2024 by <a href="https://github.com/emanueldonner">Emanuel Donner</a></p>
		<p>Data source: <a href="https://github.com/korginc/logue-sdk">korginc/logue-sdk</a></p>
	</div>
</div>

<style>
	:root {
		--primary: #0e1114d6;
		--secondary: #f7f8f9;
		--tertiary: #bde8e8ba;
		--disclaimer: #f4e39a67;
		--text: #333;
		--background: #ffffff;
		--border-radius: 4px;
		--padding: 0.8rem;
	}

	.container {
		max-width: 1200px;
		margin: auto;
		padding: 0 2rem;
		/* use system font */
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			'Open Sans', 'Helvetica Neue', sans-serif;
		background: var(--background);
		color: var(--text);
	}

	h1 {
		font-size: 1.8rem;
		/* text-align: center; */
		margin-bottom: 1rem;
		color: var(--primary);
	}

	p {
		/* text-align: center; */
		margin-bottom: 1.5rem;
		color: var(--text);
	}

	.disclaimer {
		text-align: left;
		background-color: var(--disclaimer);
		padding: 0.5rem 1rem;
		margin-bottom: 1rem;
		& p {
			margin: 0;
			font-size: 0.9rem;
		}
	}

	.action-container {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 0.5rem;
	}
	.action-container > * {
		flex: 1;
	}

	label {
		font-size: 0.8rem;
		color: var(--text);
		margin-bottom: 0.2rem;
	}
	.title-filter,
	.search {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.filters {
		display: flex;
		flex-direction: column;
	}

	.active-filter-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filter-item {
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 0.8rem;
		background: var(--tertiary);
		color: var(--text);
		border-radius: var(--border-radius);
		font-size: 0.8rem;
	}

	.filter-item button {
		background: none;
		border: none;
		color: var(--text);
		margin-left: 0.5rem;
		cursor: pointer;
	}

	.table-container {
		margin-top: 1rem;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.5rem;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--secondary);
	}

	th {
		background: var(--primary);
		color: #fff;
	}

	tr:nth-child(odd) {
		background: var(--secondary);
	}

	.platforms {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.platform-item {
		display: inline-block;
		padding: 0.4rem 0.8rem;
		background: var(--tertiary);
		border-radius: var(--border-radius);
		cursor: pointer;
		border: none;
	}

	select {
		padding: 0.5rem;
	}

	.search input {
		padding: 0.5rem;
		border-radius: var(--border-radius);
		border: 1px solid #ccc;
		font-size: 0.8rem;
	}
	.footer {
		text-align: center;
		margin: 1rem 0 2rem;
		font-size: 0.8rem;
		& p {
			margin: 0.2rem;
		}
	}
	@media (max-width: 768px) {
		.action-container {
			flex-direction: column;
			gap: 1rem;
		}

		.title-filter,
		.search {
			margin-right: 0;
		}

		h1 {
			font-size: 1.5rem;
		}

		p {
			margin-bottom: 1rem;
		}
	}
</style>
