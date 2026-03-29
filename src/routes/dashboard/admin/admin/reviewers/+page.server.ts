import { db } from '$lib/server/db/index.js';
import { user, t1Review, t2Review, legionReview } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, sql, desc } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const t1Stats = db
		.$with('t1Stats')
		.as(
			db
				.select({
					userId: t1Review.userId,
					count: sql<number>`COUNT(*)`.as('count'),
					lastReview: sql<Date>`MAX(${t1Review.timestamp})`.as('lastReview'),
					avgFeedbackLen: sql<number>`AVG(LENGTH(${t1Review.feedback}))`.as('avgFeedbackLen')
				})
				.from(t1Review)
				.groupBy(t1Review.userId)
		);

	const t2Stats = db
		.$with('t2Stats')
		.as(
			db
				.select({
					userId: t2Review.userId,
					count: sql<number>`COUNT(*)`.as('count'),
					lastReview: sql<Date>`MAX(${t2Review.timestamp})`.as('lastReview'),
					avgFeedbackLen: sql<number>`AVG(LENGTH(${t2Review.feedback}))`.as('avgFeedbackLen')
				})
				.from(t2Review)
				.groupBy(t2Review.userId)
		);

	const legionStats = db
		.$with('legionStats')
		.as(
			db
				.select({
					userId: legionReview.userId,
					count: sql<number>`COUNT(*)`.as('count'),
					lastReview: sql<Date>`MAX(${legionReview.timestamp})`.as('lastReview'),
					avgFeedbackLen: sql<number>`AVG(LENGTH(${legionReview.feedback}))`.as('avgFeedbackLen')
				})
				.from(legionReview)
				.groupBy(legionReview.userId)
		);

	const reviewers = await db
		.with(t1Stats, t2Stats, legionStats)
		.select({
			id: user.id,
			name: user.name,
			t1Count: sql<number>`COALESCE(${t1Stats.count}, 0)`,
			t2Count: sql<number>`COALESCE(${t2Stats.count}, 0)`,
			legionCount: sql<number>`COALESCE(${legionStats.count}, 0)`,
			totalCount: sql<number>`COALESCE(${t1Stats.count}, 0) + COALESCE(${t2Stats.count}, 0) + COALESCE(${legionStats.count}, 0)`,
			lastReview: sql<Date>`GREATEST(COALESCE(${t1Stats.lastReview}, '1970-01-01'), COALESCE(${t2Stats.lastReview}, '1970-01-01'), COALESCE(${legionStats.lastReview}, '1970-01-01'))`,
			avgFeedbackLen: sql<number>`(COALESCE(${t1Stats.avgFeedbackLen} * ${t1Stats.count}, 0) + COALESCE(${t2Stats.avgFeedbackLen} * ${t2Stats.count}, 0) + COALESCE(${legionStats.avgFeedbackLen} * ${legionStats.count}, 0)) / NULLIF(COALESCE(${t1Stats.count}, 0) + COALESCE(${t2Stats.count}, 0) + COALESCE(${legionStats.count}, 0), 0)`
		})
		.from(user)
		.leftJoin(t1Stats, eq(user.id, t1Stats.userId))
		.leftJoin(t2Stats, eq(user.id, t2Stats.userId))
		.leftJoin(legionStats, eq(user.id, legionStats.userId))
		.where(
			sql`COALESCE(${t1Stats.count}, 0) + COALESCE(${t2Stats.count}, 0) + COALESCE(${legionStats.count}, 0) > 0`
		)
		.orderBy(desc(sql`totalCount`));

	return {
		reviewers
	};
}
