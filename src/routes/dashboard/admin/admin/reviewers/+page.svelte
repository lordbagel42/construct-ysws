<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import relativeDate from 'tiny-relative-date';
	import { resolve } from '$app/paths';

	let { data } = $props();

	let reviewerSearch = $state('');

	let filteredReviewers = $derived(
		data.reviewers.filter((reviewer) =>
			reviewer.name?.toLowerCase().includes(reviewerSearch.toLowerCase())
		)
	);
</script>

<Head title="Reviewers" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Reviewers</h1>

	<p class="mb-3 text-lg">Showing {filteredReviewers.length} reviewers</p>

	<input
		class="themed-box mb-3 w-full p-2"
		placeholder="Search reviewers..."
		bind:value={reviewerSearch}
	/>

	{#if filteredReviewers.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">
					No reviewers found matching the filter <img
						src="https://cdn.hackclub.com/019d1090-6521-7123-9834-65baa89d29d0/image.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each filteredReviewers as reviewer (reviewer.id)}
				<div
					class="themed-box relative flex flex-col p-4 shadow-lg/20 transition-all hover:scale-102"
				>
					<a
						class="absolute inset-0 z-1"
						href={resolve(`/dashboard/admin/admin/reviewers/${reviewer.id}`)}
						aria-label="reviewer"
					>
					</a>
					<h2 class="flex flex-row gap-1 text-xl font-semibold">
						<span class="grow truncate">{reviewer.name}</span>
					</h2>
					<div class="mt-2 grid grid-cols-2 gap-2 text-sm">
						<p><span class="font-bold">Total Reviews:</span> {reviewer.totalCount}</p>
						<p><span class="font-bold">T1:</span> {reviewer.t1Count} | <span class="font-bold">T2:</span> {reviewer.t2Count} | <span class="font-bold">Legion:</span> {reviewer.legionCount}</p>
						<p>
							<span class="font-bold">Last Review:</span>
							{#if reviewer.lastReview && reviewer.lastReview.getTime() > 0}
								{relativeDate(reviewer.lastReview)}
							{:else}
								Never
							{/if}
						</p>
						<p>
							<span class="font-bold">Avg Feedback:</span>
							{Math.round(reviewer.avgFeedbackLen || 0)} chars
						</p>
					</div>

					{#if (reviewer.avgFeedbackLen || 0) < 50}
						<div class="mt-3 bg-red-900/30 border border-red-500 rounded p-2 text-xs text-red-200">
							⚠️ LOW AVERAGE FEEDBACK LENGTH
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
