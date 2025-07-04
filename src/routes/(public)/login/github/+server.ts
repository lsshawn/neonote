import { github } from '$lib/server/oauth';
import { generateState } from 'arctic';

import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const url = github.createAuthorizationURL(state, ['user:email']);

	event.cookies.set('github_oauth_state', state, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: import.meta.env.PROD,
		path: '/',
		sameSite: 'lax'
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
