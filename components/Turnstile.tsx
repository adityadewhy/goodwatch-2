"use client";

import {Turnstile} from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
	siteKey: string;
	onSuccess: (token: string) => void;
}

export function TurnstileWidget({siteKey, onSuccess}: TurnstileWidgetProps) {
	return (
		<Turnstile
			siteKey={siteKey}
			onSuccess={onSuccess}
			onError={() => console.error("Turnstile error")}
		/>
	);
}
