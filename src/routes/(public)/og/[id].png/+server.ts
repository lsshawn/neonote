import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		if (!params.id) {
			error(404, 'No id in params');
		}
		// Fetch the note data
		const res = await fetch(`${config.apiUrl}/notes/${params.id}?parse=markdown&only=frontmatter`);

		if (!res.ok) {
			error(404, 'Note not found');
		}
		const note = await res.json();
		console.log('[LS] -> src/routes/og/[id].png/+server.ts:15 -> note: ', note);

		// Extract text content for preview (first 150 characters)
		const title = note.title || config.name;
		const description = note.description || config.description;

		// Create a simple SVG-based OG image
		const header = `
				<!-- Logo area -->
				<rect x="60" y="60" width="80" height="80" rx="12" fill="#3b82f6"/>
				<text x="100" y="110" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">📝</text>
				
				<!-- Brand -->
				<text x="160" y="95" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">${config.name}</text>
				<text x="160" y="125" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">${config.description}</text>
`;
		const svg = `
			<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
						<stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
					</linearGradient>
				</defs>
				
				<!-- Background -->
				<rect width="1200" height="630" fill="url(#bg)"/>
				
        ${header}
				
				<!-- Title -->
				<text x="60" y="220" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" textLength="${Math.min(title.length * 25, 1080)}" lengthAdjust="spacingAndGlyphs">${title.replace(
					/[<>&"']/g,
					(match) => {
						const escapeMap: Record<string, string> = {
							'<': '&lt;',
							'>': '&gt;',
							'&': '&amp;',
							'"': '&quot;',
							"'": '&#39;'
						};
						return escapeMap[match];
					}
				)}</text>
				
				${
					description
						? `
				<!-- Description -->
				<text x="60" y="280" font-family="Arial, sans-serif" font-size="24" fill="#d1d5db" textLength="${Math.min(description.length * 12, 1080)}" lengthAdjust="spacingAndGlyphs">${description.replace(
					/[<>&"']/g,
					(match) => {
						const escapeMap: Record<string, string> = {
							'<': '&lt;',
							'>': '&gt;',
							'&': '&amp;',
							'"': '&quot;',
							"'": '&#39;'
						};
						return escapeMap[match];
					}
				)}</text>
				`
						: ''
				}
				
				<!-- Bottom decoration -->
				<rect x="60" y="520" width="1080" height="4" fill="#3b82f6"/>
				<text x="60" y="560" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">${config.domain}</text>
			</svg>
		`;

		// Convert SVG to PNG using a simple approach
		// For production, you might want to use a proper image generation library
		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (e) {
		if (e.status) {
			throw e;
		}
		error(500, 'Failed to generate OG image');
	}
};
