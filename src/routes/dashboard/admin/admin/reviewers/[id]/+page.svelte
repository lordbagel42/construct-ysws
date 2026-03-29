<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import relativeDate from 'tiny-relative-date';
	import { resolve } from '$app/paths';

	let { data } = $props();

	let approvalRate = $derived(data.stats.t1.total > 0
		? (data.stats.t1.approvals / data.stats.t1.total) * 100
		: 0);

	let avgFeedbackLen = $derived(data.allReviews.length > 0
		? data.allReviews.reduce((acc, r) => acc + (r.feedback?.length || 0), 0) / data.allReviews.length
		: 0);
</script>

<Head title={`Reviewer: ${data.reviewer.name}`} />

<div class="flex h-full flex-col">
	<div class="mt-5 flex items-center gap-4">
		<img src={data.reviewer.profilePicture} alt="Profile" class="h-16 w-16 rounded-full" />
		<div>
			<h1 class="font-hero text-3xl font-medium">{data.reviewer.name}</h1>
			<p class="text-primary-300">{data.reviewer.slackId}</p>
		</div>
	</div>

	<div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="themed-box p-4 shadow-lg">
			<h3 class="text-lg font-bold">T1 Stats</h3>
			<p>Total: {data.stats.t1.total}</p>
			<p>Approvals: {data.stats.t1.approvals}</p>
			<p>Rejections: {data.stats.t1.rejections}</p>
			<p class={`font-bold ${approvalRate > 95 ? 'text-red-400' : ''}`}>
				Approval Rate: {Math.round(approvalRate)}%
				{#if approvalRate > 95} ⚠️ HIGH {/if}
			</p>
		</div>
		<div class="themed-box p-4 shadow-lg">
			<h3 class="text-lg font-bold">Other Stats</h3>
			<p>T2 Reviews: {data.stats.t2.total}</p>
			<p>Legion Reviews: {data.stats.legion.total}</p>
			<p>Total Reviews: {data.allReviews.length}</p>
		</div>
		<div class="themed-box p-4 shadow-lg">
			<h3 class="text-lg font-bold">Quality Indicators</h3>
			<p class={`font-bold ${avgFeedbackLen < 50 ? 'text-red-400' : ''}`}>
				Avg Feedback: {Math.round(avgFeedbackLen)} chars
				{#if avgFeedbackLen < 50} ⚠️ LOW {/if}
			</p>
		</div>
	</div>

	<h2 class="mt-8 mb-4 text-2xl font-bold text-white">Review History</h2>

	<div class="flex flex-col gap-4">
		{#each data.allReviews as review (review.type + review.id)}
			{@const lowFeedback = (review.feedback?.length || 0) < 50}
			<div class={`themed-box p-4 shadow-lg flex flex-col gap-2 ${lowFeedback ? 'border-red-500/50 bg-red-900/10' : ''}`}>
				<div class="flex justify-between items-start">
					<div>
						<span class="rounded bg-primary-800 px-2 py-0.5 text-xs font-bold text-primary-200">
							{review.type}
						</span>
						<span class={`ml-2 font-bold ${review.action.includes('reject') ? 'text-red-400' : 'text-green-400'}`}>
							{review.action.toUpperCase()}
						</span>
						<h3 class="mt-1 text-lg font-semibold">
							<a href={resolve(`/dashboard/admin/review/${review.projectId}`)} class="underline hover:text-primary-300">
								{review.projectName}
							</a>
						</h3>
					</div>
					<div class="text-right text-xs text-primary-400">
						{relativeDate(review.timestamp)}
						<br />
						{review.timestamp.toLocaleString()}
					</div>
				</div>

				{#if review.feedback}
					<div class="mt-2">
						<p class="text-sm font-bold text-primary-300">Feedback:</p>
						<p class="text-sm italic">"{review.feedback}"</p>
						{#if lowFeedback}
							<p class="mt-1 text-[10px] font-bold text-red-400 uppercase">⚠️ Very short feedback</p>
						{/if}
					</div>
				{/if}

				{#if review.notes}
					<div class="mt-1">
						<p class="text-sm font-bold text-primary-300">Internal Notes:</p>
						<p class="text-sm">{review.notes}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
