<script lang="ts">
	import { page } from '$app/state';
	import { Send, X } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		message,
		email,
		name
	}: {
		message: string;
		email: string;
		name: string;
	} = $props();

	let isOpen = $state(false);

	const texts = ['Feedback', 'Bugs', 'Ideas'];
	let textIndex = $state(0);

	$effect(() => {
		if (isOpen) return;

		const interval = setInterval(() => {
			textIndex = (textIndex + 1) % texts.length;
		}, 2500);

		return () => clearInterval(interval);
	});

	let status: 'idle' | 'submitting' | 'success' | 'error' = $state('idle');
	let errorMessage = $state('');
	let fieldErrors = $state<{ [key: string]: string[] | undefined }>({});

	function toggle() {
		isOpen = !isOpen;
	}

	function resetForm() {
		message = '';
		email = page.data.user?.email ?? '';
		name = '';
		status = 'idle';
		errorMessage = '';
		fieldErrors = {};
	}

	async function handleSubmit() {
		status = 'submitting';
		errorMessage = '';
		fieldErrors = {};

		try {
			const res = await fetch('/api/feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message,
					email,
					page: page.url.pathname,
					metadata: { id: page.data?.user?.id, name }
				})
			});

			if (res.ok) {
				status = 'success';
				setTimeout(() => {
					isOpen = false;
					resetForm();
				}, 2000);
			} else {
				const data = await res.json();
				errorMessage = data.error || data.message || 'An unexpected error occurred.';
				if (data.details?.fieldErrors) {
					fieldErrors = data.details.fieldErrors;
				}
				status = 'error';
			}
		} catch (e) {
			errorMessage = 'Failed to submit feedback. Please try again later.';
			status = 'error';
		}
	}
</script>

<div class="fixed right-4 bottom-4 z-50 flex flex-col items-end">
	{#if isOpen}
		<div
			class="bg-base-100 mb-2 w-80 rounded-lg border p-4 shadow-lg sm:w-96"
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			{#if status === 'success'}
				<div class="flex h-full flex-col items-center justify-center py-10 text-center">
					<h3 class="text-lg font-semibold">Thank you!</h3>
					<p>We've received your message. We'll reply within 24 hours.</p>
				</div>
			{:else}
				<div>
					<h3 class="mb-2 text-lg font-semibold">Feedback, bugs, or ideas?</h3>
					<textarea
						bind:value={message}
						class="textarea textarea-bordered w-full"
						class:textarea-error={fieldErrors.message}
						rows="4"
						placeholder="Your message..."
						disabled={status === 'submitting'}
						aria-label="Your message"
					></textarea>
					{#if fieldErrors.message}
						<p class="text-error mt-1 text-sm">{fieldErrors.message[0]}</p>
					{/if}

					<input
						type="email"
						bind:value={email}
						placeholder="Your email"
						class="input input-bordered mt-2 w-full"
						class:input-error={fieldErrors.email}
						disabled={status === 'submitting'}
						aria-label="Your email"
					/>
					{#if fieldErrors.email}
						<p class="text-error mt-1 text-sm">{fieldErrors.email[0]}</p>
					{/if}
					<input
						type="text"
						bind:value={name}
						placeholder="Your name (optional)"
						class="input input-bordered mt-2 w-full"
						class:input-error={name && fieldErrors.name}
						disabled={status === 'submitting'}
						aria-label="Your name (optional)"
					/>
					{#if name && fieldErrors.name}
						<p class="text-error mt-1 text-sm">{fieldErrors.name[0]}</p>
					{/if}

					{#if name && status === 'error' && errorMessage}
						<p class="text-error mt-2 text-sm">{errorMessage}</p>
					{/if}

					<div class="mt-4 flex justify-end">
						<button
							class="btn btn-primary"
							onclick={handleSubmit}
							disabled={status === 'submitting' || !message.trim()}
						>
							{#if status === 'submitting'}
								<span class="loading loading-spinner"></span>
							{/if}
							Send
							<Send class="ml-2 h-4 w-4" />
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<button
		class="btn btn-primary btn-sm inline-grid w-24 place-items-center shadow-lg"
		onclick={toggle}
		aria-label={isOpen ? 'Close feedback form' : 'Open feedback form'}
	>
		{#if isOpen}
			<X class="col-start-1 row-start-1 h-4 w-4" />
		{:else}
			{#key texts[textIndex]}
				<span class="col-start-1 row-start-1 text-xs" transition:fade={{ duration: 500 }}
					>{texts[textIndex]}?</span
				>
			{/key}
		{/if}
	</button>
</div>
