CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`services` text NOT NULL,
	`message` text NOT NULL,
	`timeframe` text NOT NULL,
	`language` text NOT NULL,
	`notification_status` text DEFAULT 'not_configured' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inquiry_limits` (
	`fingerprint` text PRIMARY KEY NOT NULL,
	`hits` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL
);
