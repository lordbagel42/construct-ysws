import { db } from '$lib/server/db/index.js';
import { user, t1Review, t2Review, legionReview, project } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, desc, sql } from 'drizzle-orm';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const id: number = parseInt(params.id);

	if (!id) {
		throw error(404);
	}

	const [reviewer] = await db.select().from(user).where(eq(user.id, id)).limit(1);

	if (!reviewer) {
		throw error(404);
	}

	const t1Reviews = await db
		.select({
			id: t1Review.id,
			projectId: t1Review.projectId,
			projectName: project.name,
			action: t1Review.action,
			feedback: t1Review.feedback,
			notes: t1Review.notes,
			timestamp: t1Review.timestamp,
			type: sql<'T1'>`'T1'`
		})
		.from(t1Review)
		.innerJoin(project, eq(t1Review.projectId, project.id))
		.where(eq(t1Review.userId, id))
		.orderBy(desc(t1Review.timestamp));

	const t2Reviews = await db
		.select({
			id: t2Review.id,
			projectId: t2Review.projectId,
			projectName: project.name,
			action: sql<string>`'approve'`, // T2 is mostly approval
			feedback: t2Review.feedback,
			notes: t2Review.notes,
			timestamp: t2Review.timestamp,
			type: sql<'T2'>`'T2'`
		})
		.from(t2Review)
		.innerJoin(project, eq(t2Review.projectId, project.id))
		.where(eq(t2Review.userId, id))
		.orderBy(desc(t2Review.timestamp));

	const legionReviews = await db
		.select({
			id: legionReview.id,
			projectId: legionReview.projectId,
			projectName: project.name,
			action: legionReview.action,
			feedback: legionReview.feedback,
			notes: legionReview.notes,
			timestamp: legionReview.timestamp,
			type: sql<'Legion'>`'Legion'`
		})
		.from(legionReview)
		.innerJoin(project, eq(legionReview.projectId, project.id))
		.where(eq(legionReview.userId, id))
		.orderBy(desc(legionReview.timestamp));

	const allReviews = [...t1Reviews, ...t2Reviews, ...legionReviews].sort(
		(a, b) => b.timestamp.getTime() - a.timestamp.getTime()
	);

	const stats = {
		t1: {
			total: t1Reviews.length,
			approvals: t1Reviews.filter(r => r.action.includes('approve')).length,
			rejections: t1Reviews.filter(r => r.action.includes('reject')).length
		},
		t2: {
			total: t2Reviews.length
		},
		legion: {
			total: legionReviews.length
		}
	};

	return {
		reviewer,
		allReviews,
		stats
	};
}
